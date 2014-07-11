jQuery(function($) {
  authorizationModal = Backbone.Modal.extend({
    template: function() {
      return this.authorizationView.template();
    },
    initialize: function(attributes, options) {
      this.authorizationView = new authorizationView({el: $('.authorizationOverlay').get(0), managerPriceView: attributes['managerPriceView'], employeeSession: attributes['employeeSession'], authorizationModal: this});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(display_flag) {
      if(display_flag) {
        $('.authorizationOverlay').stop().show().html(this.render().el);
      } else {
        $('.authorizationOverlay').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    }
  });
});