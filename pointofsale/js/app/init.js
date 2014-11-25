jQuery(function($) {
  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
    events: {
      "click a.recent-tickets-button": 'loadRecentTickets',
      "click a.quote-tickets-button": 'loadQuoteTickets',
      "click a.open-tickets-button": 'loadOpenTickets',
      "click a.closed-tickets-button": 'loadCloseTickets',
      "click a.print-ticket": 'printTicket',
      "click a.calculator-button": 'calculatorInitiate',
      "click a.add-user-button": 'signupFormInitiate'
    },
    calculatorSkin: _.template($('#dash-calculator').html()),
    addCustomer: _.template($('#add-customer').html()),
  	initialize: function() {
      //Global checkout locking flag
      checkoutActive = false;

      //Employee Session Model
      this.employeeSession = new employeeSession({apiServer: 'http://test.general-goods.com:7000'});
      this.activeCustomer = new activeCustomer();
      this.preloaderSemaphore = 0;
      this.checkoutHideSemaphore = 0;

      //Modal Dialogs
      this.ticketStatusDialogModal = new ticketStatusDialogModal({
        activeCustomer: this.activeCustomer,
        employeeSession: this.employeeSession
      });

  		//Regional Views
      this.employeeOperationsRegion = new employeeOperationsView({el: this.$('.employeeOperations').get(0), employeeSession: this.employeeSession});

      this.searchTicketRegion = new searchTicketView({
        el: this.$('.ticketSearch').get(0),
        ticketStatusDialogModal: this.ticketStatusDialogModal,
        employeeSession: this.employeeSession,
        appFrame: this
      });

      this.activeCustomerRegion = new activeCustomerView({
        el: this.$('.activeCustomer').get(0),
        employeeSession: this.employeeSession,
        activeCustomer: this.activeCustomer,
        searchTicketView: this.searchTicketRegion,
        ticketStatusDialogModal: this.ticketStatusDialogModal,
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

      this.ticketStatusDialogModal.setActiveTicket(this.activeTicketRegion);
      this.ticketStatusDialogModal.setCustomerView(this.activeCustomerRegion);
      this.searchTicketRegion.setActiveTicket(this.activeTicketRegion);

      this.invoiceDialog = this.activeTicketRegion.invoiceDialog;

      this.activeCustomerRegion.activeCustomer.setActiveTicketViewSingleton(this.activeTicketRegion);

      //Avoided re-initialization
      this.activeTicketRegion.$ticketContainer.kinetic({
        //moved: _.bind(this.activeTicketRegion.panTicket, this.activeTicketRegion),
        //stopped: _.bind(this.activeTicketRegion.stopPanTicket, this.activeTicketRegion)
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
      //$(window).mouseup(function(){
         //$('.mousetrap').css('z-index', 0);
      //});
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
        $('.item-search input.search').focus();
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
    checkoutHidePreloader: function(preloader, status, locked) {
      if(preloader) {
        this.checkoutHideSemaphore = this.checkoutHideSemaphore+1;
      } else {
        this.checkoutHideSemaphore = this.checkoutHideSemaphore-1;
      }

      if(this.checkoutHideSemaphore > 0) {
        if(status == 'pos_in_progress' && !locked) {
          $('.ticketSearch .checkout').hide();
        }
      } else {
        if(status == 'pos_in_progress' && !locked) {
          $('.ticketSearch .checkout').show();
        }
      }
    },
    printTicket: function(e) {
      e.preventDefault();
      this.activeTicketRegion.printTicket();
    },
    loadRecentTickets: function(e) {
      if(this.checkoutHideSemaphore == 0) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadRecentInvoices(e);
      } else {
        e.preventDefault();
        alert("Cannot change ticket while product scanning is in progress.");
      }
    },
    loadQuoteTickets: function(e) {
      if(this.checkoutHideSemaphore == 0) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadQuoteInvoices(e);
      } else {
        e.preventDefault();
        alert("Cannot change ticket while product scanning is in progress.");
      }
    },
    loadOpenTickets: function(e) {
      if(this.checkoutHideSemaphore == 0) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadOpenInvoices(e);
      } else {
        e.preventDefault();
        alert("Cannot change ticket while product scanning is in progress.");
      }
    },
    loadCloseTickets: function(e) {
      if(this.checkoutHideSemaphore == 0) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadClosedInvoices(e);
      } else {
        e.preventDefault();
        alert("Cannot change ticket while product scanning is in progress.");
      }
    },
    calculatorInitiate: function(e) {
      e.preventDefault();
      $('.calcOverlay').html(this.calculatorSkin({
        api_server: this.employeeSession.get('apiServer')
      })).show();
      $('.calcOverlay a.clear-calculator').on('click', _.bind(this.clearCalculator, this));
      $('.calcOverlay iframe').focus();
    },
    signupFormInitiate: function(e) {
      e.preventDefault();
      $('.calcOverlay').html(this.addCustomer({
        api_server: this.employeeSession.get('apiServer'),
        token: this.employeeSession.get("token")
      })).show();
      $('.calcOverlay a.clear-calculator').on('click', _.bind(this.clearCalculator, this));
      $('.calcOverlay iframe').focus();
    },
    clearCalculator: function(e) {
      e.preventDefault();
      $('.calcOverlay').empty().hide();
    }
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.app-wrap').get(0)
  	});
  }

  appBootstrap();
});
