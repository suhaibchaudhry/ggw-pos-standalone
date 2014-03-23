jQuery(function($) {
  invoiceDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.invoiceDialogView.template();
    },
    initialize: function(attributes, options) {
      this.invoiceDialogView = new invoiceDialogView({el: $('.invoiceDialogOverlay').get(0), modal: this, employeeSession: attributes['employeeSession'], ticket: attributes['ticket'], activeCustomerView: attributes['activeCustomerView']});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.invoiceDialogOverlay').stop().show().html(this.render().el);
      } else {
        $('.invoiceDialogOverlay').stop().fadeOut(function() {
          $(this).empty();
        });

        $('.item-search input.search').focus();
      }
    }
  });
});