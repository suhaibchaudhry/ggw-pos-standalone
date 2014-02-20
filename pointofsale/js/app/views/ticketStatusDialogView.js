jQuery(function($) {
  //Application Views
  ticketStatusDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'statusOverlay',
    events: {
      "click a.status-open-ticket": "openTicket",
      "click a.status-quote-ticket": "quoteTicket"
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
    },
    loginSubmit: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var uname = this.$('input#login-uname').val();
      var pass = this.$('input#login-password').val();
      
      this.employeeSession.login(uname, pass);
    },
    template: _.template($('#ticket-status-modal').html()),
    render: function() {
      return this;
    },
    openTicket: function(e) {
      e.preventDefault();
      this.activeCustomer.changeTicketStatusToOpen();
      this.modal.switch(false);
    },
    quoteTicket: function(e) {
      e.preventDefault();
      this.modal.switch(false);
    }
  });
});