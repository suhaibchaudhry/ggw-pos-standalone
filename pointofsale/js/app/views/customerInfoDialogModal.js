jQuery(function($) {
  customerInfoDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.customerInfoDialogView.template();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.customerInfoDialogView = new customerInfoDialogView({el: $('.customerInfoOverlay').get(0), activeCustomer: attributes['activeCustomer'], modal: this, employeeSession: attributes['employeeSession'], ticket: attributes['ticket']});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state, uid) {
      if(state) {
        $('.customerInfoOverlay').stop().show().html(this.render().el);
        if(uid) {
          this.customerInfoDialogView.loadUserProfile(uid);
        } else {
          this.customerInfoDialogView.loadUserProfile();
        }
        this.customerInfoDialogView.render();
      } else {
        $('.customerInfoOverlay').stop().fadeOut(function() {
             $(this).empty();
        });

        $('.item-search input.search').focus();
      }
    }
  });
});