jQuery(function($) {
  modifyStockDialog = Backbone.Modal.extend({
    template: function() {
      return this.modifyStockView.template();
    },
    initialize: function(attributes, options) {
      this.modifyStockView = new modifyStockView({
        el: $('.modifyProductStock').get(0),
        api_server: options['api_server'],
        token: options['token'],
        modal: this
      });
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.modifyProductStock').stop().show().html(this.render().el);
        this.modifyStockView.render();
        //that.focusCash(); - This is done when total is echoed from the server now.
      } else {
        $('.modifyProductStock').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    },
    openDialog: function(flag) {
      this.display(true);
    }
  });
});