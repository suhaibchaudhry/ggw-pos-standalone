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
      //Setup Alertify
      alertify.defaults = {
          // dialogs defaults
          modal: true,
          movable: true,
          resizable: true,
          closable: true,
          maximizable: true,
          pinnable: true,
          pinned: true,
          padding: true,
          overflow: true,
          maintainFocus: false,
          transition:'pulse',

          // notifier defaults
          notifier:{
              // auto-dismiss wait time (in seconds)  
              delay: 5,
              // default position
              position:'bottom-right'
          },

          // language resources 
          glossary:{
              // dialogs default title
              title:'General Goods Wholesale',
              // ok button text
              ok: 'OK',
              // cancel button text
              cancel: 'Cancel'
          },

          // theme settings
          theme: {
              // class name attached to prompt dialog input textbox.
              input:'ajs-input',
              // class name attached to ok button
              ok:'ajs-ok',
              // class name attached to cancel button 
              cancel:'ajs-cancel'
          }
      };

      //Global checkout locking flag
      checkoutActive = false;

      //Employee Session Model
      this.employeeSession = new employeeSession({apiServer: 'http://test.general-goods.com:7000'});
      this.activeCustomer = new activeCustomer();
      this.preloaderSemaphore = 0;
      this.checkoutHideSemaphore = 0;
      this.modificationsLock = false;

      //Modal Dialogs
      this.ticketStatusDialogModal = new ticketStatusDialogModal({
        activeCustomer: this.activeCustomer,
        employeeSession: this.employeeSession,
        appFrame: this
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

      //Allow shortcuts on input fields
      Mousetrap.stopCallback = function () {
        return false;
      };
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
        if(status == 'pos_in_progress' || (status != 'pos_return' && status != 'pos_return_closed' && !locked)) {
          $('.ticketSearch .checkout').hide();
        }
      } else {
        if(status == 'pos_in_progress' || (status != 'pos_return' && status != 'pos_return_closed' && !locked)) {
          $('.ticketSearch .checkout').show();
        }
      }
    },
    ticketLockModifications: function(lock) {
      this.modificationsLock = lock;
    },
    printTicket: function(e) {
      e.preventDefault();
      this.activeTicketRegion.printTicket();
    },
    loadRecentTickets: function(e) {
      if(this.checkoutHideSemaphore == 0 && !this.modificationsLock) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadRecentInvoices(e);
      } else {
        e.preventDefault();
        alertify.alert("Cannot switch ticket while current ticket is loading or updating. Try again later.", function() {
          $('.item-search input.search').focus();
        });
      }
    },
    loadQuoteTickets: function(e) {
      if(this.checkoutHideSemaphore == 0 && !this.modificationsLock) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadQuoteInvoices(e);
      } else {
        e.preventDefault();
        alertify.alert("Cannot switch ticket while current ticket is loading or updating. Try again later.", function() {
          $('.item-search input.search').focus();
        });
      }
    },
    loadOpenTickets: function(e) {
      if(this.checkoutHideSemaphore == 0 && !this.modificationsLock) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadOpenInvoices(e);
      } else {
        e.preventDefault();
        alertify.alert("Cannot switch ticket while current ticket is loading or updating. Try again later.", function() {
          $('.item-search input.search').focus();
        });
      }
    },
    loadCloseTickets: function(e) {
      if(this.checkoutHideSemaphore == 0 && !this.modificationsLock) {
        this.invoiceDialog.display(true);
        this.invoiceDialog.invoiceDialogView.loadClosedInvoices(e);
      } else {
        e.preventDefault();
        alertify.alert("Cannot switch ticket while current ticket is loading or updating. Try again later.", function() {
          $('.item-search input.search').focus();
        });
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
