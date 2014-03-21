jQuery(function($) {
  //Application Views
  rmaDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'rmaItemSelectOverlay',
    events: {
      "click a.ticket-checkout-cancel": 'closeDialog'
    },
    rmaLineItemsSelectTemplate: _.template($('#rma-select-line-item').html()),
    initialize: function(attributes, options) {
      this.modal = attributes['modal'];
    },
    template: _.template($('#process-rma-modal').html()),
    render: function() {
      return this;
    },
    populateSelections: function(products) {
      var template = this.rmaLineItemsSelectTemplate;
      _.each(products, function(product) {
        this.$('.returning-items-select .product-table').append(template(product));
      });
    },
    closeDialog: function(e) {
      e.preventDefault();
      this.closeRMADialog(e);
    },
    closeRMADialog: function(e) {
      this.modal.display(false);
      $('input.rma-scan').focus();
    }
  });
});