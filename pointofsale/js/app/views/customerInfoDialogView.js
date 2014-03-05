jQuery(function($) {
  //Application Views
  customerInfoDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'customerInfoOverlay',
    events: {
      "click a.customer-info-continue": 'closeCheckoutDialog',
      "click .info-menu-tabs a": 'changeTab',
      "click .invoice-history a": 'invoiceDataRefresh',
      "click .invoice-history table.uc-order-history tbody tr": 'selectInvoice'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
    },
    template: _.template($('#customer-info-modal').html()),
    loadUserProfile: function() {
      var that = this;
      var activeCustomer = this.activeCustomer;
      var customer_uid = activeCustomer.get('id');

      var customerInfoRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
      //Start preloader
      //this.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/info',
        data: {request: customerInfoRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.loader').hide();
            that.$('.tabs').show();

            //Customer Info Tab
            that.$('.profile-content').html(res.customer_info);
            var company = that.$('h2').remove().text();
            that.$('.bbm-modal__title').text(company);
            that.$('.profile-content fieldset legend').append('<span></span>');

            //Invoices
            that.populateInvoices(that.$('.invoice-history'), res.invoices);

            //Payments
            that.$('.payment-history').html(res.payments);

            that.adjustBlockHeights();
          } else {
            that.employeeSession.set('login', false);
          }
          //ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
          that.employeeSession.set('login', false);
        }
      });
    },
    populateInvoices: function(invoices, ahah) {
      invoices.html(ahah);
    },
    changeTab: function(e) {
      e.preventDefault();

      //Detect index of selected tab
      this.$('li.pure-menu-selected').removeClass('pure-menu-selected');
      var list_element = e.currentTarget.parentNode;
      list_element.className = 'pure-menu-selected';
      var index = this.$('.info-menu-tabs ul li').index(list_element);
      
      //Activate corrosponding tab
      var tabs = this.$('.tabs .tab');
      tabs.hide();
      tabs.eq(index).show();
    },
    invoiceDataRefresh: function(e) {
      e.preventDefault();
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      var that = this;
      var activeCustomer = this.activeCustomer;
      var customer_uid = activeCustomer.get('id');

      var customerInvoicesRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/invoice'+query,
        data: {request: customerInvoicesRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            //that.$('.loader').hide();
            //that.$('.tabs').show();

            //invoices
            that.populateInvoices(that.$('.invoice-history'), res.invoices);
          } else {
            that.employeeSession.set('login', false);
          }
          //ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
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
    adjustBlockHeights: function() {
      var fieldsets = this.$('.profile-content fieldset');
      var height = 0;
      var current_height = 0;
      fieldsets.each(function() {
        current_height = $(this).height();
        if(current_height > height) {
          height = current_height;
        }
      });
      fieldsets.height(height);
    },
    render: function() {
      return this;
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
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