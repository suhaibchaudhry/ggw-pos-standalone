jQuery(function($) {
  managerPriceDialog = Backbone.Modal.extend({
    template: function() {
      return this.managerPriceView.template();
    },
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
      this.managerPriceView = new managerPriceView({
        el: $('.managerPrice').get(0),
        employeeSession: attributes['employeeSession'],
        modal: this,
        ticket: attributes['ticket'],
        activeCustomer: attributes['activeCustomer']
      });
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.managerPrice').stop().show().html(this.render().el);
        this.managerPriceView.render();
        //that.focusCash(); - This is done when total is echoed from the server now.
      } else {
        $('.managerPrice').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    },
    openDialog: function(e) {
      if((this.ticket.get("status") != 'pos_return' && this.ticket.get("status") != 'pos_return_closed' && this.ticket.get("status") != 'pos_completed') || !this.ticket.get('locked')) {
        this.managerPriceView.openDialog(e);
      }
    }
  });
});