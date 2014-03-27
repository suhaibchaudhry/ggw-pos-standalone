jQuery(function($) {
  //Application Views
  checkoutDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'checkoutOverlay',
    events: {
      "click a.ticket-checkout-continue": 'checkoutProcess',
      "click a.ticket-checkout-cancel": 'closeCheckoutDialog',
      "click .info-menu-tabs a": 'changeTab',
      "keypress .cash-checkout input.cash-paid": 'cashInputValidate',
      "keyup .cash-checkout input.cash-paid": 'calculateCashChange'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];
    },
    template: _.template($('#ticket-checkout-modal').html()),
    creditSummaryTemplate: _.template($('#credit-summary-template').html()),
    render: function() {
      this.currentTab = 0;
      this.change_left = undefined; 
      this.change_value = undefined;
      this.cash_paid = undefined;
      this.creditTermCheckoutSetup();
      return this;
    },
    checkoutProcess: function(e) {
      e.preventDefault();
      if(this.currentTab == 0) {
        this.cashCheckout(e);
      } else if(this.currentTab == 2) {
        this.creditCheckout(e);
      }
    },
    creditTermCheckoutSetup: function() {
      var cuid = this.activeCustomer.get('id');
      if(cuid) {
        this.$('.info-menu-tabs ul li.term-checkout').show();

        var ticket = this.ticket;
        var creditTermLimitsRequest = JSON.stringify({token: sessionStorage.token, customer: cuid});
        var that = this;

        ticket.trigger('ticket:preloader', true);
        $.ajax({
          type: 'POST',
          url: ticket.employeeSession.get('apiServer')+'/pos-api/customer/credits',
          data: {request: creditTermLimitsRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            //stop preloader
            ticket.trigger('ticket:preloader', false);
            if(res.status) {
                that.available_credit = res.credit_limits.available_credit;
                that.term_limit = res.credit_limits.term_limit;
                that.$('.term-credit-checkout').html(that.creditSummaryTemplate(res.credit_limits));
            }
          },
          error: function(xhr, errorType, error) {
            //stop pre loader and logout user.
            ticket.trigger('ticket:preloader', false);
            ticket.employeeSession.set('login', false);
          }
        });
      } else {
        this.$('.info-menu-tabs ul li.term-checkout').hide();
      }
    },
    creditCheckout: function(e) {
      var that = this;
      var ticket = this.ticket;
      var total = ticket.get('total');
      if(_.isUndefined(this.available_credit) || _.isUndefined(this.term_limit) || total > this.available_credit) {
        alert("Insufficient credit limit. Transaction could not be completed.");
        this.closeCheckoutDialog(e);
      } else {
        var cuid = this.activeCustomer.get('id');
        var creditCheckoutRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId'), total: total, customer: cuid, term_limit: this.term_limit});

        ticket.trigger('ticket:preloader', true);
        $.ajax({
            type: 'POST',
            url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/credit-checkout',
            data: {request: creditCheckoutRequest},
            timeout: 15000,
            success: function(res, status, xhr) {
              //stop preloader
              ticket.trigger('ticket:preloader', false);
              if(res.status) {
                alert("Checkout Complete.");
                //Close ticket
                ticket.set('status_en', 'Closed Ticket');
                ticket.set('status', 'pos_completed');         
              } else {
                alert(res.message);
              }

              that.closeCheckoutDialog(e);
            },
            error: function(xhr, errorType, error) {
              //stop pre loader and logout user.
              ticket.trigger('ticket:preloader', false);
              ticket.employeeSession.set('login', false);
            }
        });
      }
    },
    cashCheckout: function(e) {
      var that = this;

      if(!_.isUndefined(this.change_left) && !_.isUndefined(this.change_value) && !_.isUndefined(this.cash_paid)) {
        if(this.change_left > 0) {
          alert("Customer still owes amount: "+accounting.formatMoney(this.change_left));
        } else {
          var ticket = this.ticket;
          var cuid = this.activeCustomer.get('id');
          var cashCheckoutRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId'), total: ticket.get('total'), cash: this.cash_paid, change: this.change_value, customer: cuid});

          ticket.trigger('ticket:preloader', true);
          $.ajax({
            type: 'POST',
            url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/cash-checkout',
            data: {request: cashCheckoutRequest},
            timeout: 15000,
            success: function(res, status, xhr) {
              //stop preloader
              ticket.trigger('ticket:preloader', false);
              if(res.status) {
                alert("Checkout Complete. Please make change for amount: "+accounting.formatMoney(that.change_value));
                //Close ticket
                ticket.set('status_en', 'Closed Ticket');
                ticket.set('status', 'pos_completed');         
              } else {
                alert(res.message);
              }

              that.closeCheckoutDialog(e);
            },
            error: function(xhr, errorType, error) {
              //stop pre loader and logout user.
              ticket.trigger('ticket:preloader', false);
              ticket.employeeSession.set('login', false);
            }
          });
        }
      } else {
        alert("Please insert cash amount before checkout.");
      }
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
      this.currentTab = index;
    },
    focusCash: function() {
      this.$('.cash-paid').focus();
      this.$('.change-due-value, .change-left-value').html(accounting.formatMoney(this.ticket.get('total')));
      this.$('.change-value').html(accounting.formatMoney(0));
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    cashInputValidate: function(e) {
      if(e.currentTarget.value == e.currentTarget.defaultValue) {
        e.currentTarget.value = '';
      }

      if((e.keyCode < 48 || e.keyCode > 57) && e.keyCode != 46 && e.keyCode != 8 && e.keyCode != 190) {
        e.preventDefault();
      }
    },
    calculateCashChange: function(e) {
      var total = this.ticket.get('total');
      var paid = parseFloat(e.currentTarget.value);

      var change = total - paid;

      if(change > 0) {
        total = change;
        change = 0;
      } else if(change < 0) {
        total = 0;
        change = -change;
      }

      this.change_left = total;
      this.change_value = change;
      this.cash_paid = paid;

      this.$('.change-left-value').html(accounting.formatMoney(total));
      this.$('.change-value').html(accounting.formatMoney(change));
    }
  });
});