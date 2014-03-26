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
    render: function() {
      return this;
    },
    checkoutProcess: function(e) {
      e.preventDefault();
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
        alert("Please insert cash amount before checkout");
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