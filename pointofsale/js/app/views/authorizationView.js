jQuery(function($) {
  //Application Views
  authorizationView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "submit form": "loginSubmit",
      "click a.authorize-cancel-button": "cancelAuthorization"
    },
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.authorizedCallback = attributes['authorizedCallback'];
      this.authorizationModal = attributes['authorizationModal'];
    },
    loginSubmit: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var requestedUser = JSON.stringify({uname: this.$('input#login-uname').val(), pass: this.$('input#login-password').val()});
      var that = this;

      that.loginPreloader(true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/auth',
        data: {request: requestedUser},
        timeout: 15000,
        success: function(res, status, xhr) {
          that.authorizedCallback(res);
          /*
          if(res.login && res.privileged) {
            that.managerPriceView.$('a.unlock-price-override').hide();
            that.managerPriceView.$('.overriden-price').attr('disabled', false);
          } else {
            alertify.alert('Provided manager login/password were invalid.');
          }*/
          that.authorizationModal.display(false);
          that.loginPreloader(false);
        },
        error: function(xhr, errorType, error) {
          alertify.alert('Error connecting to the network. Check connection and try again.');
          that.loginPreloader(false);
          that.authorizationModal.display(false);
        }
      });
      //this.employeeSession.login(uname, pass);
    },
    cancelAuthorization: function(e) {
      e.preventDefault();
      this.authorizationModal.display(false);
    },
    template: _.template($('#authorization-modal').html()),
    render: function() {
      //console.log(this.$el.get(0));
      //this.$el.html(this.template());
      return this;
    },
    loginPreloader: function(displayLoader) {
      if(displayLoader) {
        this.$(".preloader").show();
      } else {
        this.$(".preloader").hide();
      }
    }
  });
});