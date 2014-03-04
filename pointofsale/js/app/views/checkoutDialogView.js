jQuery(function($) {
  //Application Views
  checkoutDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'checkoutOverlay',
    events: {
      "click a.ticket-checkout-continue": 'closeCheckoutDialog',
      "click a.ticket-checkout-cancel": 'closeCheckoutDialog'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];
    },
    template: _.template($('#ticket-checkout-modal').html()),
    render: function() {
      return this;
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});