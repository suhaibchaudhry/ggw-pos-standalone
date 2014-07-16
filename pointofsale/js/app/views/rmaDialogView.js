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
    populateSelections: function(products, customerInfoDialog, historic) {
      if(historic) {
        this.customerInfoDialog = customerInfoDialog;
        var template = this.rmaLineItemsSelectTemplate;
        _.each(products, function(product) {
          if(product.unhistoric) {
            product.historic = false;
            product.date = 'NEVER PURCHASED';
            product.remaining_qty = 50;
            product.qty = 1;
            console.log(product);
          } else {
            product.historic = true;
          }
          customerInfoDialog.rmaItemsCollection.add(product);
          console.log(product);
          this.$('.returning-items-select .product-table').append(template(product));
        });
      } else {
        this.customerInfoDialog = customerInfoDialog;
        var template = this.rmaLineItemsSelectTemplate;
        _.each(products, function(product) {
          product.historic = false;
          product.date = 'NEVER PURCHASED';
          product.remaining_qty = 50;
          product.qty = 1;
          this.$('.returning-items-select .product-table').append(template(product));
          customerInfoDialog.rmaItemsCollection.add(product);
        });
      }
    },
    closeDialog: function(e) {
      e.preventDefault();
      this.closeRMADialog(e);
    },
    closeRMADialog: function(e) {
      this.modal.display(false);
    },
    lineItemSelected: function(e) {
      var id = e.currentTarget.dataset.id;
      var product = this.customerInfoDialog.rmaItemsCollection.get(id);
      this.customerInfoDialog.rmaItemSelected(product);
    }
  });
});