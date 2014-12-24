jQuery(function($) {
  //Application Views
  ticketStatusDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'statusOverlay',
    events: {
      "click a.action-open-ticket": "openTicket",
      "click a.action-quote-ticket": "quoteTicket",
      "click .open-tickets-container table tr": 'selectInvoice',
      "click a.clear-ticket": 'clearTicketForReuse',
      "click a.ticket-checkout-cancel": 'cancelTicketStatusChange',
      "click a.make-payments-direct": 'makeCustomerPayments',
      "click a.make-rma-direct": 'makeRMAReturn'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.employeeSession = attributes['employeeSession'];
      this.modal = attributes['modal'];
      this.appFrame = attributes['appFrame'];
    },
    template: _.template($('#ticket-status-modal').html()),
    render: function() {
      var that = this;
      var cuid = this.activeCustomer.get('id');
      if(cuid) {
        var recentInvoicesRequest = JSON.stringify({token: sessionStorage.token});
        var heading = '<div class="rma-remaining-label">Open Tickets:</div>';

        that.activeTicketView.ticket.trigger('ticket:preloader', true);
        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/open/'+this.activeCustomer.get('id'),
          data: {request: recentInvoicesRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              that.$('.open-tickets-container').html(heading+res.content);
            } else {
              that.employeeSession.set('login', false);
            }
            that.activeTicketView.ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            that.activeTicketView.ticket.trigger('ticket:preloader', false);
            that.employeeSession.set('login', false);
          }
        });
      }

      return that;
    },
    clearTicketForReuse: function(e) {
      e.preventDefault();
      this.activeCustomer.set('id', false);
      this.activeCustomer.updateTicketCustomerUidOnServer(0);
      this.modal.switch(false);
    },
    makeCustomerPayments: function(e) {
      //e.preventDefault();
      var customer_uid = this.activeCustomer.get('id');
      if(customer_uid) {
        this.activeCustomerView.customerInfoDialogModal.display(true, customer_uid, 1);
      } else {
        alertify.alert("Cannot make payments on walk-in customers.");
      }

      if(this.activeTicketView.ticket.get('productCollection').length == 0) {
        this.clearTicketForReuse(e);
      }
    },
    makeRMAReturn: function(e) {
      //e.preventDefault();
      var customer_uid = this.activeCustomer.get('id');
      if(customer_uid) {
        this.activeCustomerView.customerInfoDialogModal.display(true, customer_uid, 2);
      } else {
        alertify.alert("Cannot make returns for walk-in customers.");
      }

      if(this.activeTicketView.ticket.get('productCollection').length == 0) {
        this.clearTicketForReuse(e);
      }
    },
    cancelTicketStatusChange: function(e) {
      e.preventDefault();
      this.modal.switch(false);
    },
    selectInvoice: function(e) {
      if(this.appFrame.checkoutHideSemaphore == 0) {
        var ticketId = $('td:eq(1)', e.currentTarget).text();
        var that = this;
        var ticket = that.activeTicketView.ticket;
        if(ticketId) {
          $.ajax({
            type: 'GET',
            url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+ticketId+'&register_id='+$('#register-id').html()+'&op=acquire',
            timeout: 1000,
            success: function(res) {
              if(res.status) {
                that.modal.switch(false);
                that.loadSelectedTicket(ticketId);
              } else {
                alertify.alert(res.message);
              }
            },
            error: function(xhr, errorType, error) {
              ticket.employeeSession.set('login', false);
            }
          });
        }
      } else {
        alertify.alert("Cannot change ticket while product scanning is in progress.");
      }
    },
    loadSelectedTicket: function(ticketId) {
      var that = this;
      var ticket = that.activeTicketView.ticket;

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
    },
    openTicket: function(e) {
      e.preventDefault();
      this.activeCustomer.changeTicketStatusToOpen();
      this.modal.switch(false);
    },
    quoteTicket: function(e) {
      e.preventDefault();
      this.modal.switch(false);
    }
  });
});