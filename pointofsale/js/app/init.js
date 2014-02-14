jQuery(function($) {
  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
  	initialize: function() {
      //Employee Session Model
      this.employeeSession = new employeeSession({apiServer: 'http://www.general-goods.com'});
 
  		//Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0), employeeSession: this.employeeSession});

      this.searchTicketRegion = new searchTicketView({
        el: this.$('.ticketSearch').get(0),
        employeeSession: this.employeeSession
      });

      this.activeCustomerRegion = new activeCustomerView({
        el: this.$('.activeCustomer').get(0),
        employeeSession: this.employeeSession
      });

      this.activeTicketRegion = new activeTicketView({
        el: this.$('.activeTicket').get(0),
        employeeSession: this.employeeSession,
        registerDisplay: this.$('.register-display'),
        activeCustomerView: this.activeCustomerRegion,
        searchTicketView: this.searchTicketRegion,
        appFrame: this
      });

      this.activeCustomerRegion.activeCustomer.setActiveTicketViewSingleton(this.activeTicketRegion);

      //Avoided re-initialization
      this.activeTicketRegion.$ticketContainer.kinetic({
        moved: _.bind(this.activeTicketRegion.panTicket, this.activeTicketRegion),
        stopped: _.bind(this.activeTicketRegion.stopPanTicket, this.activeTicketRegion)
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

      //Catch mouse releases outside of application frame, and release all mousetraps.
      $(window).mouseup(function(){
         $('.mousetrap').css('z-index', 0);
      });
  	},
    //No demolish is neccesary for this always-on singleton view.
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
    },
    ticketPreloader: function(preloader) {
      if(preloader) {
        $('.loaderOverlay').show();
      } else {
        $('.loaderOverlay').hide();
      }
    }
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.app-wrap').get(0)
  	});
  }

  appBootstrap();
});