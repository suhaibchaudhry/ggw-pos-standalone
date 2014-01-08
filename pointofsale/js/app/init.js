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

var employeeLoginDialog = Backbone.ModalView.extend({
  name: "employeeLoginDialog",
  templateHtml: _.template("<div class='modal-header'>Add a new person to the list</div>\
<form>\
    <table class='compact'>\
    \
    <tr><td>\
        <label for='name'>Name</label>\
    </td><td>\
        <input type='text' id='name' />\
    </td></tr>\
\
    <tr><td>\
        <label for='email'>Email</label>\
    </td><td>\
        <input type='text' id='email' />\
    </td></tr>\
    \
    <tr><td>\
        <label for='phone'>Phone</label>\
    </td><td>\
        <input type='text' id='phone' />\
    </td></tr>\
    \
    <tr><td></td><td>\
        <input id='addPersonButton' type='submit' value='Add person' />\
    </td></tr>\
    \
    </table>\
</form>"),
});

var applicationFrame = Backbone.View.extend({
	tagName: 'div',
	initialize: function() {
    this.employeeSession = new employeeSession();
    this.employeeLoginDialog = new employeeLoginDialog();
		this.listenTo(this.employeeSession, 'change:token', this.render);
    this.employeeSession.initialSession();
	},
	render: function(model, value, options) {
		if(value) {
			console.log('login true');
			//alert('login true');
		} else {
      this.employeeLoginDialog.render().showModal();	
		}

		return this;
	}
});

var appBootstrap = function() {
	var app = new applicationFrame({
		el: $('div.app-wrap').get(0)
	});
}