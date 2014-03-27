jQuery(function($) {
  checkoutDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.checkoutDialogView.template();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.ticket = attributes['ticket'];
      this.checkoutDialogView = new checkoutDialogView({el: $('.checkoutOverlay').get(0), activeCustomer: attributes['activeCustomer'], modal: this, ticket: attributes['ticket']});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.checkoutOverlay').stop().show().html(this.render().el);
        this.checkoutDialogView.render();
        this.checkoutDialogView.focusCash();
      } else {
        $('.checkoutOverlay').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    }
  });
});