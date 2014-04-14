jQuery(function($) {
  //Application Views
  managerPriceView = Backbone.View.extend({
    tagName: 'div',
    className: 'managerPrice',
    events: {
      "click a.price-override-cancel": "cancelOverride",
      "click a.price-override-continue": "continueOverride"
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
        this.modal.display(true);

        this.$('.price-override-settings').html(this.priceOverrideSettings({
          product: product.attributes,
          labelizeData: this.labelizeData
        }));
      }
    },
    cancelOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    continueOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});