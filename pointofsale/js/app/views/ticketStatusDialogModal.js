jQuery(function($) {
  ticketStatusDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.ticketStatusDialogView.template();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.ticketStatusDialogView = new ticketStatusDialogView({el: $('.statusOverlay').get(0), activeCustomer: attributes['activeCustomer'], employeeSession: attributes['employeeSession'], modal: this});
    },
    beforeCancel: function() {
      return false;
    },
    setActiveTicket: function(activeTicketView) {
      this.ticketStatusDialogView.activeTicketView = activeTicketView;
    },
    setCustomerView: function(activeCustomerView) {
      this.ticketStatusDialogView.activeCustomerView = activeCustomerView;
    },
    switch: function(on) {
      if(on && this.activeCustomer.get('ticket').get('status') == 'pos_quote') {
        $('.statusOverlay').stop().show().html(this.render().el);
        this.ticketStatusDialogView.render();
      } else {
        $('.statusOverlay').stop().fadeOut(function() {
          $(this).empty();
        });

        
      }
    }
  });
});