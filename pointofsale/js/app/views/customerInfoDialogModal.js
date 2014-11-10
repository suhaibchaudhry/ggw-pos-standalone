jQuery(function($) {
  customerInfoDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.customerInfoDialogView.template();
    },
    initialize: function(attributes, options) {
      //Initialize RMA Choose dialog
      this.rmaDialogModal = new rmaDialogModal({employeeSession: this.employeeSession});
      this.activeCustomer = attributes['activeCustomer'];
      this.customerInfoDialogView = new customerInfoDialogView({el: $('.customerInfoOverlay').get(0), activeCustomer: attributes['activeCustomer'], modal: this, employeeSession: attributes['employeeSession'], ticket: attributes['ticket'], rmaDialogModal: this.rmaDialogModal, activeCustomerView: attributes['activeCustomerView']});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state, uid, default_tab_flag) {
      if(state) {
        $('.customerInfoOverlay').stop().show().html(this.render().el);
        if(uid) {
          if(default_tab_flag == 1 || default_tab_flag == 2) {
            this.customerInfoDialogView.loadUserProfile(uid, default_tab_flag);
          } else {
            this.customerInfoDialogView.loadUserProfile(uid);
          }
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