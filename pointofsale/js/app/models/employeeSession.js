jQuery(function($) {
  //App Models
  employeeSession = Backbone.Model.extend({
    initialize: function(attribtues) {
      //this.apiServer = options['apiServer'];
      this.set({
        apiServer: attribtues['apiServer']
      });
    },
    initialSession: function() {
      //Get latest clock flag on start
    	if(sessionStorage.token) {
        var session = this;
    		session.set({token: sessionStorage.token, login: true, clock: false, lunch: false});
        
        var clockStateReq = JSON.stringify({token: sessionStorage.token});
        $.ajax({
          type: 'POST',
          url: session.get('apiServer')+'/pos-api/clockState',
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
    		url: session.get('apiServer')+'/pos-api/auth',
    		data: {request: requestedUser},
    		timeout: 15000,
    		success: function(res, status, xhr) {
    			if(res.login) {
    				sessionStorage.token = res.token;
            sessionStorage.account = uname;
    				session.set({token: res.token, login: true, clock: res.clock, lunch: res.lunch});
    			} else {
            sessionStorage.account = '';
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
});