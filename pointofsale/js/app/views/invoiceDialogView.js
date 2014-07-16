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
      "click .invoice-history table.uc-order-history tbody tr": 'selectInvoice'
    },
    initialize: function(attributes, options) {
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
      this.activeCustomerView = attributes['activeCustomerView'];
    },
    template: _.template($('#invoice-list-modal').html()),
    render: function() {
      return this;
    },
    closeInvoiceDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    loadRecentInvoices: function(e) {
      e.preventDefault();

      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.$('.title').text('Recent Invoices');

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/employee/recent-tickets'+query,
        data: {request: recentInvoicesRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.invoice-recent-history').html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          that.employeeSession.set('login', false);
        }
      });
    },
    loadClosedInvoices: function(e) {
      e.preventDefault();

      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.$('.title').text('Closed Invoices');

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/closed'+query,
        data: {request: recentInvoicesRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.invoice-closed-history').html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          that.employeeSession.set('login', false);
        }
      });
    },
    loadQuoteInvoices: function(e) {
      e.preventDefault();

      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.$('.title').text('RMA Tickets');

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/quote'+query,
        data: {request: recentInvoicesRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.invoice-quote-history').html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          that.employeeSession.set('login', false);
        }
      });
    },
    loadOpenInvoices: function(e) {
      e.preventDefault();

      var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});
      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      this.$('.title').text('Open Invoices');

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/open'+query,
        data: {request: recentInvoicesRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.invoice-open-history').html(res.content);
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
      if(ticketId) {
        this.modal.display(false);
        this.loadSelectedTicket(ticketId);
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
            this.trigger('ticket:preloader', false);
            ticket.employeeSession.set('login', false);
          }
      });
    }
  });
});