jQuery(function($) {
  authorizationModal = Backbone.Modal.extend({
    template: function() {
      return this.authorizationView.template({title: this.modalTitle});
    },
    initialize: function(attributes, options) {
      this.overlayElement = attributes['el'];
      this.modalTitle = attributes['title'];
      this.authorizationView = new authorizationView({el: this.overlayElement.get(0), authorizedCallback: attributes['authorizedCallback'], employeeSession: attributes['employeeSession'], authorizationModal: this});
    },
    beforeCancel: function() {
      return false;
    },
    display: function(display_flag) {
      if(display_flag) {
        this.render();
        //this.overlayElement.stop().show();
      } else {
        this.overlayElement.hide();
      }
    }
  });
});