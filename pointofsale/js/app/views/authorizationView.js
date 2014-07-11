jQuery(function($) {
  //Application Views
  authorizationView = Backbone.View.extend({
    tagName: 'div',
    className: 'authorizationOverlay',
    events: {
      "submit form": "loginSubmit"
    },
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.managerPriceView = attributes['managerPriceView'];
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
          if(res.login && res.privileged) {
            that.managerPriceView.$('a.unlock-price-override').hide();
            that.managerPriceView.$('.overriden-price').attr('disabled', false);
          } else {
            alert('Provided manager login/password were invalid.');
          }
          that.authorizationModal.display(false);
          that.loginPreloader(false);
        },
        error: function(xhr, errorType, error) {
          alert('Error connecting to the network. Check connection and try again.');
          that.loginPreloader(false);
          that.authorizationModal.display(false);
        }
      });
      //this.employeeSession.login(uname, pass);
    },
    template: _.template($('#authorization-modal').html()),
    render: function() {
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