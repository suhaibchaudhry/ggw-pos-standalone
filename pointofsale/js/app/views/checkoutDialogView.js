jQuery(function($) {
  //Application Views
  checkoutDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'checkoutOverlay',
    events: {
      "click a.ticket-checkout-continue": 'checkoutProcess',
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
    checkoutProcess: function(e) {
      this.closeCheckoutDialog(e);
      //Close ticket
      this.ticket.set('status_en', 'Closed Ticket');
      this.ticket.set('status', 'pos_completed');
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});