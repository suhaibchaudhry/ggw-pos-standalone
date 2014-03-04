jQuery(function($) {
  customerInfoDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.customerInfoDialogView.template();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.customerInfoDialogView = new customerInfoDialogView({el: $('.customerInfoOverlay').get(0), activeCustomer: attributes['activeCustomer'], modal: this});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.customerInfoOverlay').stop().show().html(this.render().el);
      } else {
        $('.customerInfoOverlay').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    }
  });
});