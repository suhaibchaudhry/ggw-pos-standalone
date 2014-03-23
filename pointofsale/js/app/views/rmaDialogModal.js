jQuery(function($) {
  rmaDialogModal = Backbone.Modal.extend({
    template: function() {
      return this.rmaDialogView.template();
    },
    initialize: function(attributes, options) {
      this.rmaDialogView = new rmaDialogView({el: $('.rmaItemSelectOverlay').get(0), modal: this});
    },
    beforeCancel: function() {
      return false;
    },
    populateSelections: function(products, customerInfoDialog) {
      this.rmaDialogView.populateSelections(products, customerInfoDialog);
    },
    display: function(state) {
      if(state) {
        $('.rmaItemSelectOverlay').stop().show().html(this.render().el);
        this.rmaDialogView.render();
      } else {
        $('.rmaItemSelectOverlay').stop().fadeOut(function() {
          $(this).empty();
        });

        $('input.rma-scan').focus();
      }
    }
  });
});