jQuery(function($) {
  loginModal = Backbone.Modal.extend({
    template: function() {
      return this.loginView.template();
    },
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.listenTo(this.employeeSession, 'change:login', this.display);
      this.listenTo(this.employeeSession, 'change:message', this.messagePrompt);
      this.loginView = new loginView({el: $('.modalOverlay').get(0)});
      this.loginView.employeeSession = this.employeeSession;
      this.listenTo(this.employeeSession, 'session:login-preloader', this.loginView.loginPreloader);
    },
    beforeCancel: function() {
      return false;
    },
    display: function(session, login, options) {
      if(login) {
        $('.modalOverlay').stop().fadeOut(function() {
          $(this).empty();
        });
      } else {
        $('.modalOverlay').stop().show().html(this.render().el);
      }
    },
    messagePrompt: function(session, message, options) {
      if(message) {
        alertify.alert(message);
      }
    }
  });
});