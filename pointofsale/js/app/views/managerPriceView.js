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
      "click a.unlock-price-override": 'unlockPriceOverride',
      "click .price-override-tabs a": 'changeOverrideTab',
      "click .price-history-list .price-history-item": 'historyPriceOverride'
    },
    labelizeData: _.template($('#labelize-data').html()),
    priceOverrideSettings: _.template($('#price-override-settings-form').html()),
    priceHistoryListTpl: _.template($('#price-history-list-tpl').html()),
    initialize: function(attributes, option) {
      this.employeeSession = attributes['employeeSession'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];
      this.activeCustomer = attributes['activeCustomer'];
      var authCallback = _.bind(this.authorizedCallback, this);
      this.authorizationModal = new authorizationModal({authorizedCallback: authCallback, employeeSession: attributes['employeeSession'], el: $('.managerAuthorizationOverlay'), title: 'Manager Authorization'});
    },
    authorizedCallback: function(res) {
      if(res.login && res.privileged) {
        this.$('a.unlock-price-override').hide();
        this.$('.overriden-price').attr('disabled', false);
      } else {
        alert('Provided manager login/password were invalid.');
      }
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

        var split;
        if(product.get('qty_split')) {
          split = product.get('qty_split');
        } else {
          split = 1;
        }

        this.$('.price-override-settings').html(this.priceOverrideSettings({
          product: product.attributes,
          labelizeData: this.labelizeData,
          split: split
        }));

        if(this.employeeSession.get('privileged')) {
          this.$('.overriden-price').attr('disabled', false);
          this.$('a.unlock-price-override').hide();
        } else {
          this.$('.overriden-price').attr('disabled', true);
          this.$('a.unlock-price-override').show();
        }

        if(this.activeCustomer.get('id')) {
          this.$('.price-override-tabs').show();
        } else {
          this.$('.price-override-tabs').hide();
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
      var qty_split = accounting.unformat(this.$('span.split-value').text());

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
            if(!that.product.get('orig_price')) {
              that.product.set('orig_price', that.product.get('price'));
            }
            that.product.set('qty_split', qty_split);
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
      var orig_split = accounting.unformat(this.$('div.qty-split').attr('data-orig-split'));
      if(incr) {
        qty_split++;
        this.priceModify(price, qty_split, orig_split);
      } else {
        if(qty_split > 1) {
          qty_split--;
          this.priceModify(price, qty_split, orig_split);
        }
      }
    },
    unlockPriceOverride: function(e) {
      e.preventDefault();
      this.authorizationModal.display(true);
    },
    priceModify: function(price, qty_split, orig_split) {
      if(this.product.get('orig_price')) {
        price = this.product.get('orig_price')/qty_split;
      } else {
        price = (price*orig_split)/qty_split;
      }
      this.$('input.overriden-price').val(accounting.formatNumber(price, 2, "", "."));
      this.$('span.split-value').text(qty_split);
    },
    changeOverrideTab: function(e) {
      e.preventDefault();
      var settingsBlock = this.$('.price-override-settings');
      var historyBlock = this.$('.price-override-history');
      var chagePriceButton = this.$('.price-override-continue');

      this.$('.price-override-tabs ul li.pure-menu-selected').removeClass('pure-menu-selected');
      e.target.parentNode.className = 'pure-menu-selected';
      if(e.target.className == 'split') {
        settingsBlock.show();
        historyBlock.hide();
        chagePriceButton.show();
      } else {
        settingsBlock.hide();
        historyBlock.show();
        chagePriceButton.hide();
        this.loadPriceHistoy();
      }
    },
    loadPriceHistoy: function() {
      var that = this;
      var loadPriceHistory = JSON.stringify({
        token: this.employeeSession.get("token"),
        product_id: this.product.get('id'),
        cuid: this.activeCustomer.get('id')
      });

      that.ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/product/price-history',
        data: {request: loadPriceHistory},
        timeout: 10000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.price-override-history').html(that.priceHistoryListTpl(res));
          } else {
            that.$('.price-override-history').html(res.error);
          }
          //that.modal.display(false);
          that.ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //Something is wrong log user out.
          that.modal.display(false);
          that.employeeSession.set('login', false);
          that.ticket.trigger('ticket:preloader', false);
        }
      });
    },
    historyPriceOverride: function(e) {
      e.preventDefault();
      var price = e.target.parentNode.getAttribute('data-price-raw');
      var qty = e.target.parentNode.getAttribute('data-qty-split-raw');
      this.$('input.overriden-price').val(price);
      this.$('span.split-value').text(qty);
      this.$('a.price-override-continue').trigger('click');
    }
  });
});