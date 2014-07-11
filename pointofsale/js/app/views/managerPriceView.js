jQuery(function($) {
  //Application Views
  managerPriceView = Backbone.View.extend({
    tagName: 'div',
    className: 'managerPrice',
    events: {
      "click a.price-override-cancel": "cancelOverride",
      "click a.price-override-continue": "continueOverride",
      "click .price-override-settings .qty-split a.incr": "increaseQtySplit",
      "click .price-override-settings .qty-split a.decr": "decreaseQtySplit",
      "click a.unlock-price-override": 'unlockPriceOverride'
    },
    labelizeData: _.template($('#labelize-data').html()),
    priceOverrideSettings: _.template($('#price-override-settings-form').html()),
    initialize: function(attributes, option) {
      this.employeeSession = attributes['employeeSession'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];
    },
    template: _.template($('#manager-price-modal').html()),
    render: function() {
      return this;
    },
    openDialog: function(e) {
      var line_item;
      if(e.target.nodeName == 'SPAN') {
        line_item = e.target.parentNode.parentNode;
      } else {
        line_item = e.target.parentNode;
      }

      var id = line_item.dataset.id;
      var product = this.ticket.get('productCollection').get(id);
      if(product) {
        this.product = product;
        this.modal.display(true);

        this.$('.price-override-settings').html(this.priceOverrideSettings({
          product: product.attributes,
          labelizeData: this.labelizeData
        }));

        if(this.employeeSession.get('privileged')) {
          this.$('.overriden-price').attr('disabled', false);
          this.$('a.unlock-price-override').hide();
        } else {
          this.$('.overriden-price').attr('disabled', true);
          this.$('a.unlock-price-override').show();
        }
      }
    },
    cancelOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    continueOverride: function(e) {
      e.preventDefault();
      var that = this;
      var ticket = this.ticket;
      var price = accounting.unformat(this.$('input.overriden-price').val());

      var managerOverrideRequest = JSON.stringify({
        token: this.employeeSession.get("token"),
        ticketId: ticket.get('ticketId'),
        productNid: this.product.get('id'),
        qty_split: this.$('span.split-value').text(),
        unit_price: price
      });

      ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/product/manager-override',
        data: {request: managerOverrideRequest},
        timeout: 10000,
        success: function(res, status, xhr) {
          if(res.status) {
            $.jGrowl("Item price was changed.");
            that.product.set('manager_price', price);
            that.product.set('price', price);
          } else {
            that.employeeSession.set('login', false);
          }
          that.modal.display(false);
          ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          $.jGrowl("Could not connect to the network. Please check connection.");
          //Something is wrong log user out.
          that.modal.display(false);
          that.employeeSession.set('login', false);
          ticket.trigger('ticket:preloader', false);
        }
      });
    },
    increaseQtySplit: function(e) {
      e.preventDefault();
      this.QtySplitModify(true);
    },
    decreaseQtySplit: function(e) {
      e.preventDefault();
      this.QtySplitModify(false);
    },
    QtySplitModify: function(incr) {
      var price = this.product.get('price');
      var qty_split = accounting.unformat(this.$('span.split-value').text());
      if(incr) {
        qty_split++;
        this.priceModify(price, qty_split);
      } else {
        if(qty_split > 1) {
          qty_split--;
          this.priceModify(price, qty_split);
        }
      }
    },
    unlockPriceOverride: function(e) {
      e.preventDefault();
      
    },
    priceModify: function(price, qty_split) {
      price = price/qty_split;
      this.$('input.overriden-price').val(accounting.formatNumber(price, 2, "", "."));
      this.$('span.split-value').text(qty_split);
    }
  });
});