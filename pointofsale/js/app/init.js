jQuery(function($) {
  //App Models
  var employeeSession = Backbone.Model.extend({
    initialize: function(attributes, options) {
      this.apiServer = options['apiServer'];
    },
    initialSession: function(attributes, options) {
    	if(sessionStorage.token) {
    		this.set({token: sessionStorage.token, login: true});
    	} else {
    		this.set({token: '', login: false, message: ''});
    	}
    },
    login: function(uname, pass) {
      var model = this;
      //Set session to initial state to get change events on attributes.
      this.set({message: ''});

    	var requestedUser = JSON.stringify({uname: uname, pass: pass});
    	var session = this;

      this.trigger('session:login-preloader', true);
    	$.ajax({
    		type: 'POST',
    		url: session.apiServer+'/pos-api/auth',
    		data: {request: requestedUser},
    		timeout: 15000,
    		success: function(res, status, xhr) {
    			if(res.login) {
    				sessionStorage.token = res.token;
    				session.set({token: res.token, login: true});
    			} else {
    				session.set({token: '', login: false, message: 'Provided employee login/password were invalid.'});
    			}

          model.trigger('session:login-preloader', false);
    		},
    		error: function(xhr, errorType, error) {
    			session.set({token: '', login: false, message: 'Error connecting to the network. Check connection and try again.'});
    		}
    	});
    }
  });

  var loginView = Backbone.View.extend({
    tagName: 'div',
    className: 'modalOverlay',
    events: {
      "submit form": "loginSubmit"
    },
    loginSubmit: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var uname = this.$('input#login-uname').val();
      var pass = this.$('input#login-password').val();
      
      this.employeeSession.login(uname, pass);
    },
    template: _.template($('#login-modal').html()),
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

  var loginModal = Backbone.Modal.extend({
    template: function() {
      return this.loginView.template();
    },
    initialize: function(attributes, options) {
      this.employeeSession = options['employeeSession'];
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
        $('.modalOverlay').fadeOut();
      } else {
        $('.modalOverlay').show().html(this.render().el);
      }
    },
    messagePrompt: function(session, message, options) {
      if(message) {
        alert(message);
      }
    }
  });

  var employeeOperationsView = Backbone.View.extend({
    tagName: 'div',
    render: function() {
      this.$('.clock').FlipClock({
        clockFace: 'TwelveHourClock'
      });
      return this;
    },
    demolish: function() {
      return this;
    }
  });

  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      //Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0)});

      this.employeeSession = new employeeSession({}, {apiServer: 'http://www.general-goods.com'});
  		this.loginModal = new loginModal({}, {employeeSession: this.employeeSession});

      this.listenTo(this.employeeSession, 'change:login', this.render);

      this.employeeSession.initialSession();
      this.heightAdjust();

      $(window).on('resize', _.bind(this.heightAdjust, this));
  	},
  	render: function(session, login, options) {
      if(login) {
        this.employeeOperationsRegion.render();
      } else {
        console.log('Login: Draw UI');
      }
  		return this;
  	},
    heightAdjust: function() {
      this.$('.content.region').
        height(
          $(window).height() - this.$('.header').height() - this.$('.footer').height()
        );
    }
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.app-wrap').get(0)
  	});
  }

  appBootstrap();
});


