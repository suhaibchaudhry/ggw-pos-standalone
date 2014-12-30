jQuery(function($) {
  //Application Views
  invoiceDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'invoiceDialogOverlay',
    events: {
      "click a.ticket-customer-link": 'customerInfoDialog',
      "click a.customer-info-continue": 'closeInvoiceDialog',
      "click .invoice-recent-history a": 'loadRecentInvoices',
      "click .invoice-quote-history a": 'loadQuoteInvoices',
      "click .invoice-open-history a": 'loadOpenInvoices',
      "click .invoice-closed-history a": 'loadClosedInvoices',
      "click a.search-button": 'searchTicketInvoice',
      "click .invoice-history table.uc-order-history tbody tr": 'selectInvoice',
      "click a.calculator-button": 'calculatorInitiate'
    },
    calculatorSkin: _.template($('#dash-calculator').html()),
    initialize: function(attributes, options) {
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
      this.activeCustomerView = attributes['activeCustomerView'];
    },
    calculatorInitiate: function(e) {
      e.preventDefault();
      $('.calcOverlay').html(this.calculatorSkin({
        api_server: this.employeeSession.get('apiServer')
      })).show();
      $('.calcOverlay a.clear-calculator').on('click', _.bind(this.clearCalculator, this));
      $('.calcOverlay iframe').focus();
    },
    clearCalculator: function(e) {
      e.preventDefault();
      $('.calcOverlay').empty().hide();
    },
    template: _.template($('#invoice-list-modal').html()),
    render: function() {
      return this;
    },
    closeInvoiceDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    searchTicketInvoice: function(e) {
      e.preventDefault();

      var search = this.$('input.invoice-search');
      var query = search.val();
      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token, searchQuery: query});
      search.val('');

      this.loadTicketListData('/pos-api/employee/recent-tickets', '', 'Recent Invoices', recentInvoicesRequest, '.invoice-recent-history');
    },
    loadRecentInvoices: function(e) {
      e.preventDefault();
      var query = this.removeURLParameter(e.currentTarget.search, 'request');
      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});

      this.$('.ticket-search-bar').show();
      this.loadTicketListData('/pos-api/employee/recent-tickets', query, 'Recent Invoices', recentInvoicesRequest, '.invoice-recent-history');
    },
    loadClosedInvoices: function(e) {
      e.preventDefault();

      var closedInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.loadTicketListData('/pos-api/ticket/closed', query, 'Closed Invoices', closedInvoicesRequest, '.invoice-closed-history');
    },
    loadQuoteInvoices: function(e) {
      e.preventDefault();

      var quoteInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.loadTicketListData('/pos-api/ticket/quote', query, 'RMA Tickets', quoteInvoicesRequest, '.invoice-quote-history');
    },
    loadOpenInvoices: function(e) {
      e.preventDefault();

      var openInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.loadTicketListData('/pos-api/ticket/open', query, 'Open Invoices', openInvoicesRequest, '.invoice-open-history');
    },
    loadTicketListData: function(rpc, query, title, requestObj, contentClass) {
      var that = this;

      this.$('.title').text(title);

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+rpc+query,
        data: {request: requestObj},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$(contentClass).html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          that.employeeSession.set('login', false);
        }
      });
    },
    customerInfoDialog: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var customer_uid = e.currentTarget.dataset.uid;
      this.activeCustomerView.customerInfoDialogModal.display(true, customer_uid);
    },
    removeURLParameter: function(url, parameter) {
        //prefer to use l.search if you have a location/link object
        var urlparts= url.split('?');   
        if (urlparts.length>=2) {

            var prefix= encodeURIComponent(parameter)+'=';
            var pars= urlparts[1].split(/[&;]/g);

            //reverse iteration as may be destructive
            for (var i= pars.length; i-- > 0;) {    
                //idiom for string.startsWith
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                    pars.splice(i, 1);
                }
            }

            url = urlparts[0]+'?'+pars.join('&');
            return url;
        } else {
            return url;
        }
    },
    selectInvoice: function(e) {
      var ticketId = $('td:eq(1)', e.currentTarget).text();
      var ticket = this.ticket;
      var that = this;
      if(ticketId) {
        $.ajax({
          type: 'GET',
          url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+ticketId+'&register_id='+$('#register-id').html()+'&op=acquire',
          timeout: 1000,
          success: function(res) {
            if(res.status) {
              that.modal.display(false);
              that.loadSelectedTicket(ticketId);
            } else {
              alertify.alert(res.message, function() {
              });
            }
          },
          error: function(xhr, errorType, error) {
            ticket.employeeSession.set('login', false);
          }
        });
      }
    },
    loadSelectedTicket: function(ticketId) {
        var ticket = this.ticket;

        ticket.trigger('ticket:preloader', true);
        //Get Latest Customer UID on ticket, incase cache is dirty.
        var currentTicketRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticketId});
        $.ajax({
          type: 'POST',
          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/get-current',
          data: {request: currentTicketRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              ticket.set(res.ticket);
            } else {
              ticket.employeeSession.set('login', false);
            }
            ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            ticket.trigger('ticket:preloader', false);
            ticket.employeeSession.set('login', false);
          }
      });
    }
  });
});