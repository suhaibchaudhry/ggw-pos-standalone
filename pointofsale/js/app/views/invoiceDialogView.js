jQuery(function($) {
  //Application Views
  invoiceDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'invoiceDialogOverlay',
    events: {
      "click a.customer-info-continue": 'closeInvoiceDialog',
      "click .invoice-list-content a": 'loadRecentInvoices',
      "click .invoice-history table.uc-order-history tbody tr": 'selectInvoice'
    },
    initialize: function(attributes, options) {
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
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
            that.$('.invoice-list-content').html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          that.employeeSession.set('login', false);
        }
      });
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