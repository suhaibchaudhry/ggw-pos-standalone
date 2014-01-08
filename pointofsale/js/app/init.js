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

  var Modal = Backbone.Modal.extend({
    template: _.template($('#modal-template').html()),
    cancelEl: '.bbm-button'
  });

  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      this.employeeSession = new employeeSession();
  		this.listenTo(this.employeeSession, 'change:token', this.render);
      this.employeeSession.initialSession();
  	},
  	render: function(model, value, options) {
  		if(value) {
  			console.log('login true');
  			//alert('login true');
  		} else {
        var modalView = new Modal();
        $('.app').html(modalView.render().el);
        //this.employeeLoginDialog.render().showModal();	
  		}

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


