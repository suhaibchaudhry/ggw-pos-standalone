//App Models
var employeeSession = Backbone.Model.extend({
  initialize: function() {
  	if(sessionStorage.token) {
  		this.set({token: sessionStorage.token, status: true});
  	} else {
  		this.set({token: '', status: false, message: ''});
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
  			if(res.status == 'success') {
  				sessionStorage.token = res.token;
  				session.set({token: res.token, status: true});
  			} else {
  				session.set({token: '', status: false, message: 'Provided employee login/password were invalid.'});
  			}
  		},
  		error: function(xhr, errorType, error) {
  			session.set({token: '', status: false, message: 'Error connecting to the network. Check connection and try again.'});
  		}
  	});
  }
}, {
	apiServer: 'http://www.general-goods.com'
});

var applicationFrame = Backbone.View.extend({
	tagName: 'div',
	initialize: function() {
		this.listenTo(this.model, 'change:[status]', this.render);
	},
	render: function(model, value, options) {
		if(value) {
			console.log('login true');
			alert('login true');
		} else {
			console.log('login false');
			alert('login false');
		}

		return this;
	}
});

var appBootstrap = function() {
	var session = new employeeSession;
	var app = new applicationFrame({
		model: session,
		el: $('div.app-wrap').get(0)
	});
}
