jQuery(function($) {
  //App Models
  var employeeSession = Backbone.Model.extend({
    initialSession: function() {
    	if(sessionStorage.token) {
    		this.set({token: sessionStorage.token, login: true});
    	} else {
    		this.set({token: '', login: false, message: ''});
    	}
    },
    login: function(uname, pass) {
    	var requestedUser = JSON.stringify({uname: uname, pass: pass});
    	var session = this;
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
    		},
    		error: function(xhr, errorType, error) {
    			session.set({token: '', login: false, message: 'Error connecting to the network. Check connection and try again.'});
    		}
    	});
    }
  }, {
  	apiServer: 'http://www.general-goods.com'
  });

  var loginModal = Backbone.Modal.extend({
    template: _.template($('#login-modal').html()),
    initialize: function(attributes, options) {
      this.employeeSession = options['employeeSession'];
      this.listenTo(this.employeeSession, 'change:login', this.display);
    },
    beforeCancel: function() {
      return false;
    },
    display: function(session, login, options) {
      if(login) {
        $('.modalOverlay').hide();
      } else {
        $('.modalOverlay').show().html(this.render().el);
      }
    }
  });

  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      this.employeeSession = new employeeSession();
  		this.loginModal = new loginModal({}, {employeeSession: this.employeeSession});

      this.listenTo(this.employeeSession, 'change:login', this.render);
      this.employeeSession.initialSession();
  	},
  	render: function(session, login, options) {
  		return this;
  	}
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.app-wrap').get(0)
  	});
  }

  appBootstrap();
});


