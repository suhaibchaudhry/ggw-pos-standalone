jQuery(function($) {
  ticketStatusDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.ticketStatusDialogView.template();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.ticketStatusDialogView = new ticketStatusDialogView({el: $('.statusOverlay').get(0), activeCustomer: attributes['activeCustomer'], modal: this});
    },
    beforeCancel: function() {
      return false;
    },
    switch: function(on) {
      if(on && this.activeCustomer.get('ticket').get('status') == 'pos_quote') {
        $('.statusOverlay').stop().show().html(this.render().el);
      } else {
        $('.statusOverlay').stop().fadeOut(function() {
          $(this).empty();
        });

        
      }
    }
  });
});