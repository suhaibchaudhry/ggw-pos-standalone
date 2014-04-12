jQuery(function($) {
  managerPriceDialog = Backbone.Modal.extend({
    template: function() {
      return this.managerPriceView.template();
    },
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.managerPriceView = new managerPriceView({
        el: $('.managerPrice').get(0),
        employeeSession: attributes['employeeSession'],
        modal: this
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
    openDialog: function() {
      this.managerPriceView.openDialog();
    }
  });
});