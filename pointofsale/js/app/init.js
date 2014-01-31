jQuery(function($) {
  //App Models
  var employeeSession = Backbone.Model.extend({
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

  //Application Views
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
      this.employeeSession = attributes['employeeSession'];
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
        url: this.employeeSession.get('apiServer')+'/pos-api/clock',
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
          url: this.employeeSession.get('apiServer')+'/pos-api/clock',
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

    computeAMPM: function(hours) {
      if(hours >= 12) {
        return "PM";
      } else {
        return "AM";
      }
    },

    formatTwoDigit: function(number) {
      return ("0"+number).slice(-2); //Convert to double digit
    },

    formatHour: function(hours) {
      if(hours > 12) {
        hours -= 12;
      } else if(hours == 0) {
        hours = 12;
      }

      return this.formatTwoDigit(hours); //Convert to double digit
    },

    fetchCurrentTime: function() {
      var date = new Date();
      var time = {
        hours: date.getHours(),
        minutes: date.getMinutes()
      }

      return this.formatHour(time.hours)+":"+this.formatTwoDigit(time.minutes)+" "+this.computeAMPM(time.hours);
    },

    render: function() {
      this.$clock = this.$('.clock');

      var view = this;
      view.$clock.text(view.fetchCurrentTime());
      this.clockIntervalId = setInterval(function() {
        view.$clock.text(view.fetchCurrentTime());
      }, 2000);

      if(sessionStorage.account) {
        this.$('.greeting').append('<span class="label">Employee ID: </span>'+sessionStorage.account);
      }

      this.$('.controls').html(this.template());

      return this;
    },

    demolish: function() {
      if(this.$clock) {
        this.$clock.empty();
      }

      this.$('.greeting').empty();

      clearInterval(this.clockIntervalId);
      this.$('.controls').empty();

      return this;
    },

    logout: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.employeeSession.logout();
    }

  });

  //Product Model
  var ticketProduct = Backbone.Model.extend({

  });

  var ticketProductCollection = Backbone.Collection.extend({
    model: ticketProduct
  });

  var Ticket = Backbone.Model.extend({
    initialize: function() {
      this.set({
        total: 0,
        productCollection: new ticketProductCollection()
      });

      this.listenTo(this.get('productCollection'), 'add', this.computeTotals);
    },
    computeTotals: function(model) {
      this.set('total', this.get('total')+accounting.unformat(model.get('sell_price')));
    },
    addItem: function(productAttributes) {
      this.get('productCollection').add(productAttributes);
      //Add Item to database
    },
    removeItem: function(productId) {
      this.get('productCollection').remove(productId);
      //Remove Item from database
    },
    clearTicket: function() {
      //Clear ticket on ui
      this.get('productCollection').reset();
    },
    emptyTicket: function() {
      //Empty ticket on server and ui use clearTicket

    },
    deleteTicket: function() {
      //Delete ticket and clear on ui

    }
  });

  //Split visible ticket and ticket ui operation in to different views
  var activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      //"click .line-item": 'removeLineItem',
    },
    //Event Controllers
    itemSelected: function(e, datum) {
      this.ticket.addItem(datum);
    },
    removeLineItem: function(e) {
      this.ticket.removeItem(e.currentTarget.dataset.id);
    },
    //View Callbacks
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.$registerDisplay = attributes['registerDisplay'];

      this.ticket = new Ticket();
      this.ticketRegionClicked = false;
      this.ticketRegionClickY = 0;
      this.$ticketContainer = this.$('.ticket-container');
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$mouseTrap = this.$('.mousetrap');

      this.listenTo(this.ticket.get('productCollection'), 'add', this.addItem);
      this.listenTo(this.ticket.get('productCollection'), 'remove', this.removeItem);
      this.listenTo(this.ticket.get('productCollection'), 'reset', this.clearTicket);

      this.listenTo(this.ticket, 'change:total', this.updateTotal);
    },
    updateTotal: function(model, value, options) {
      this.$registerDisplay.find('.subtotal').html(this.labelizeTemplate({
        label: 'Subtotal',
        value: accounting.formatMoney(value)
      }));
    },
    addItem: function(model) {
      this.$ticketContainer.find('.product-table').append(this.lineItemTemplate(model.attributes));
    },
    removeItem: function(model) {
      this.$ticketContainer.find('#line-item-'+model.get('id')).remove();
    },
    clearTicket: function() {
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$registerDisplay.find('.calculation').empty();
    },
    searchResultTemplate: _.template($('#item-search-components').html()),
    lineItemTemplate: _.template($('#ticket-line-item').html()),
    labelizeTemplate: _.template($('#labelize-data').html()),
    panTicket: function() {
      this.$mouseTrap.css('z-index', 2);
    },
    stopPanTicket: function() {
      this.$mouseTrap.css('z-index', 0);
    },
    resolveSearchRPC: function(url, uriEncodedQuery) {
      var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      return newurl;
    },
    render: function() {
      //Move to template
      this.$('.item-search').append(this.searchResultTemplate());
      this.$searchbox = this.$('.item-search input.search');

      //Avoid re-initialization or figure out how to destroy in demolish, or move a level up in view hiearchy.
      this.$ticketContainer.kinetic({
        moved: _.bind(this.panTicket, this),
        stopped: _.bind(this.stopPanTicket, this)
      });
      
      this.$searchbox.typeahead({
        valueKey: 'name',
        name: 'search-items',
        remote: {
            url: this.employeeSession.get('apiServer')+'/pos-api/products/'+this.employeeSession.get("token"),
            replace: _.bind(this.resolveSearchRPC, this)
        },
        limit: 12,
        template: _.template($('#item-search-result').html())
      });
    },
    demolish: function() {
       this.$('.item-search input.search').typeahead('destroy');
       this.$('.item-search').empty();
       //this.$ticketContainer.kinetic('detach');
       this.ticket.clearTicket();
    }
  });

  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      //Employee Session Model
      this.employeeSession = new employeeSession({apiServer: 'http://www.general-goods.com'});
 
  		//Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0), employeeSession: this.employeeSession});
      this.activeTicketRegion = new activeTicketView({
        el: this.$('.activeTicket').get(0),
        employeeSession: this.employeeSession,
        registerDisplay: this.$('.register-display')
      });

      //Modal View
      this.loginModal = new loginModal({employeeSession: this.employeeSession});

      //Bind Events
      this.listenTo(this.employeeSession, 'change:login', this.render);

      //Bootstrap Application
      this.employeeSession.initialSession();
      this.heightAdjust();

      //Global Window level event catching and handling
      //Handle window resize
      $(window).on('resize', _.bind(this.heightAdjust, this));

      //Catch mouse releases outside of application window.
      $(window).mouseup(function(){
         $('.mousetrap').css('z-index', 0);
      });
  	},
  	render: function(session, login, options) {
      if(login) {
        this.employeeOperationsRegion.render();
        this.activeTicketRegion.render();
      } else {
        this.employeeOperationsRegion.demolish();
        this.activeTicketRegion.demolish();
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


