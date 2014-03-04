jQuery(function($) {
  //Application Views
  customerInfoDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'customerInfoOverlay',
    events: {
      "click a.ticket-checkout-continue": 'closeCheckoutDialog',
      "click a.ticket-checkout-cancel": 'closeCheckoutDialog'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
    },
    template: _.template($('#customer-info-modal').html()),
    render: function() {
      return this;
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});