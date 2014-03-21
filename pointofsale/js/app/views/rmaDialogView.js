jQuery(function($) {
  //Application Views
  rmaDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'rmaItemSelectOverlay',
    events: {
      "click a.ticket-checkout-cancel": 'closeDialog',
      "click .line-item" : 'lineItemSelected'
    },
    rmaLineItemsSelectTemplate: _.template($('#rma-select-line-item').html()),
    initialize: function(attributes, options) {
      this.modal = attributes['modal'];
    },
    template: _.template($('#process-rma-modal').html()),
    render: function() {
      return this;
    },
    populateSelections: function(products, customerInfoDialog) {
      this.customerInfoDialog = customerInfoDialog;
      var template = this.rmaLineItemsSelectTemplate;
      _.each(products, function(product) {
        this.$('.returning-items-select .product-table').append(template(product));
        customerInfoDialog.rmaItemsCollection.add(product);
      });
    },
    closeDialog: function(e) {
      e.preventDefault();
      this.closeRMADialog(e);
    },
    closeRMADialog: function(e) {
      this.modal.display(false);
      $('input.rma-scan').focus();
    },
    lineItemSelected: function(e) {
      var id = e.currentTarget.dataset.id;
      var product = this.customerInfoDialog.rmaItemsCollection.get(id);
      this.customerInfoDialog.rmaItemSelected(product);
    }
  });
});