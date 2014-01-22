jQuery(function($) {
  //App Models
  var employeeSession = Backbone.Model.extend({
    initialize: function(attributes, options) {
      this.apiServer = options['apiServer'];
    },
    initialSession: function(attributes, options) {
      //Get latest clock flag on start
    	if(sessionStorage.token) {
        var session = this;
    		session.set({token: sessionStorage.token, login: true, clock: false, lunch: false});
        
        var clockStateReq = JSON.stringify({token: sessionStorage.token});
        $.ajax({
          type: 'POST',
          url: session.apiServer+'/pos-api/clockState',
          data: {request: clockStateReq},
          timeout: 15000,
          success: function(res, status, xhr) {
            session.set({clock: res.clock, lunch: res.lunch});
          },
          error: function(xhr, errorType, error) {
            session.set({clock: false, lunch: false});
          }
        });

    	} else {
    		this.set({token: '', login: false, message: '', clock: false, lunch: false});
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
    				session.set({token: res.token, login: true, clock: res.clock, lunch: res.lunch});
    			} else {
    				session.set({token: '', login: false, message: 'Provided employee login/password were invalid.'});
    			}

          model.trigger('session:login-preloader', false);
    		},
    		error: function(xhr, errorType, error) {
    			session.set({token: '', login: false, message: 'Error connecting to the network. Check connection and try again.'});
    		}
    	});
    },
    logout: function() {
      sessionStorage.token = '';
      //Reset Clock state on logout
      this.set({token: '', login: false, message: '', clock: false, lunch: false});
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

    events: {
      "click a.logout": "logout",
      "click a.clock-in": "clockRecord",
      "click a.lunch-in": "lunchRecord"
    },

    template: _.template($('#employee-operations-buttons').html()),

    initialize: function(attributes, options) {
      this.employeeSession = options['employeeSession'];
      this.listenTo(this.employeeSession, 'change:clock', this.clockStateChange);
      this.listenTo(this.employeeSession, 'change:lunch', this.lunchStateChange);
    },

    clockRecord: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var lunch_in = this.employeeSession.get("lunch");
      if(lunch_in) {
        this.lunchRecord(e);
      }

      var token = this.employeeSession.get("token");
      var clockEvent = JSON.stringify({
        token: token,
        event_type: 'clock'
      });

      var session = this.employeeSession;

      $.ajax({
        type: 'POST',
        url: this.employeeSession.apiServer+'/pos-api/clock',
        data: {request: clockEvent},
        timeout: 15000,
        success: function(res, status, xhr) {
          session.set({clock: res.checkin});
        },
        error: function(xhr, errorType, error) {
          session.set({clock: false});
        }
      });
    },

    lunchRecord: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var clocked_in = this.employeeSession.get("clock");

      if(clocked_in) {
        var token = this.employeeSession.get("token");
        var clockEvent = JSON.stringify({
          token: token,
          event_type: 'lunch'
        });

        var session = this.employeeSession;

        $.ajax({
          type: 'POST',
          url: this.employeeSession.apiServer+'/pos-api/clock',
          data: {request: clockEvent},
          timeout: 15000,
          success: function(res, status, xhr) {
            session.set({lunch: res.checkin});
          },
          error: function(xhr, errorType, error) {
            session.set({lunch: false});
          }
        });
      } else {
        alert("You must be clocked in before starting lunch.");
      }
    },

    clockStateChange: function(session, clock, options) {
      if(clock) {
        //User is clocked in display clockout button
        this.$('a.clock-in').text('Clock Out').removeClass('pure-button-success').addClass('pure-button-error');
      } else {
        //User is clocked out display clockout button
        this.$('a.clock-in').text('Clock In').removeClass('pure-button-error').addClass('pure-button-success');
      }
    },

    lunchStateChange: function(session, lunch, options) {
      if(lunch) {
        //User is clocked in display clockout button
        this.$('a.lunch-in').text('Lunch Out').removeClass('pure-button-success').addClass('pure-button-error');
      } else {
        //User is clocked out display clockout button
        this.$('a.lunch-in').text('Lunch In').removeClass('pure-button-error').addClass('pure-button-success');
      }
    },    

    render: function() {
      this.clock = $('<div class="clock"></div>');
      this.$('.controls').before(this.clock);
      this.clock.FlipClock({
        clockFace: 'TwelveHourClock'
      });

      this.$('.controls').html(this.template());
      return this;
    },

    demolish: function() {
      if(this.clock) {
        this.clock.remove();
      }
      this.$('.controls').empty();
      return this;
    },

    logout: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.employeeSession.logout();
    }

  });

  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      //Employee Session Model
      this.employeeSession = new employeeSession({}, {apiServer: 'http://www.general-goods.com'});
 
  		//Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0)}, {employeeSession: this.employeeSession});

      //Modal View
      this.loginModal = new loginModal({}, {employeeSession: this.employeeSession});

      //Bind Events
      this.listenTo(this.employeeSession, 'change:login', this.render);

      //Bootstrap Application
      this.employeeSession.initialSession();
      this.heightAdjust();

      //Handle window resize
      $(window).on('resize', _.bind(this.heightAdjust, this));
  	},
  	render: function(session, login, options) {
      if(login) {
        this.employeeOperationsRegion.render();
      } else {
        this.employeeOperationsRegion.demolish();
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


