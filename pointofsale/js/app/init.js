jQuery(function($) {
  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
    events: {
      "click a.recent-tickets-button": 'loadRecentTickets',
      "click a.quote-tickets-button": 'loadQuoteTickets',
      "click a.open-tickets-button": 'loadOpenTickets',
      "click a.closed-tickets-button": 'loadCloseTickets'
    },
  	initialize: function() {
      //Employee Session Model
      this.employeeSession = new employeeSession({apiServer: 'http://www.general-goods.com'});
      this.activeCustomer = new activeCustomer();
      this.preloaderSemaphore = 0;

  		//Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0), employeeSession: this.employeeSession});

      this.searchTicketRegion = new searchTicketView({
        el: this.$('.ticketSearch').get(0),
        employeeSession: this.employeeSession
      });

      this.activeCustomerRegion = new activeCustomerView({
        el: this.$('.activeCustomer').get(0),
        employeeSession: this.employeeSession,
        activeCustomer: this.activeCustomer,
        menuItems: this.$('.header ul.menu')
      });

      this.activeTicketRegion = new activeTicketView({
        el: this.$('.activeTicket').get(0),
        employeeSession: this.employeeSession,
        registerDisplay: this.$('.register-display'),
        activeCustomerView: this.activeCustomerRegion,
        searchTicketView: this.searchTicketRegion,
        appFrame: this
      });

      this.invoiceDialog = this.activeTicketRegion.invoiceDialog;

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
      $('.loaderOverlay a.refresh').on('click', _.bind(this.reload, this));

      //Catch mouse releases outside of application frame, and release all mousetraps.
      $(window).mouseup(function(){
         $('.mousetrap').css('z-index', 0);
      });
  	},
    reload: function(e) {
      e.preventDefault();
      location.reload();
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
        this.preloaderSemaphore = this.preloaderSemaphore+1;
      } else {
        this.preloaderSemaphore = this.preloaderSemaphore-1;
      }

      if(this.preloaderSemaphore > 0) {
        $('.loaderOverlay').show();
      } else {
        $('.loaderOverlay').hide();
      }
    },
    loadRecentTickets: function(e) {
      this.invoiceDialog.display(true);
      this.invoiceDialog.invoiceDialogView.loadRecentInvoices(e);
    },
    loadQuoteTickets: function(e) {
      this.invoiceDialog.display(true);
      this.invoiceDialog.invoiceDialogView.loadQuoteInvoices(e);
    },
    loadOpenTickets: function(e) {
      this.invoiceDialog.display(true);
      this.invoiceDialog.invoiceDialogView.loadOpenInvoices(e);
    },
    loadCloseTickets: function(e) {
      this.invoiceDialog.display(true);
      this.invoiceDialog.invoiceDialogView.loadClosedInvoices(e);
    }
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.app-wrap').get(0)
  	});
  }

  appBootstrap();
});