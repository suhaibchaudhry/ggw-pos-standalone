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
      "keypress .toggle-payment input.check-amount": 'cashInputValidate',
      "keypress .toggle-payment input.mo-amount": 'cashInputValidate',
      "keypress .toggle-payment input.charge-amount": 'cashInputValidate',
      "keyup .cash-checkout input.cash-paid": 'calculateCashChange',
      "keyup .toggle-payment input.check-amount": 'calculateCashChange',
      "keyup .toggle-payment input.mo-amount": 'calculateCashChange',
      "keyup .toggle-payment input.charge-amount": 'calculateCashChange',
      'change .toggle-payment input[type="checkbox"]': 'checkboxToggle',
      "change #cc-payment-split": 'changeModeToSwipe'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];

      $.cardswipe({
        parser: _.bind(this.creditCardParser, this),
        success: _.bind(this.creditCardScan, this),
        error: _.bind(this.creditCardScanFail, this)
      });

      $.cardswipe('disable');
    },
    template: _.template($('#ticket-checkout-modal').html()),
    creditSummaryTemplate: _.template($('#credit-summary-template').html()),
    ccCheckoutTemplate: _.template($('#credit-card-checkout-template').html()),
    fetchRegisterID: _.template($('#register-id').html()),
    render: function() {
      var ticket = this.ticket;
      var totalRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId')});
      var that = this;

      $.cardswipe('enable');

      ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/load-total',
        data: {request: totalRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          //stop preloader
          if(res.status) {
              that.ticketTotal = accounting.unformat(res.total);
              that.ticketTax = accounting.unformat(res.taxes);
              that.focusCash();

              that.creditCardSwiperSetup();
          } else {
            ticket.employeeSession.set('login', false);
          }
          ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          that.closeCheckoutDialog();
          ticket.trigger('ticket:preloader', false);
          ticket.employeeSession.set('login', false);
        }
      });

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
    creditCardSwiperSetup: function() {
      this.$('.credit-card-checkout').html(this.ccCheckoutTemplate({
        subtotal: accounting.formatMoney(this.ticket.get('total')),
        tax: accounting.formatMoney(this.ticketTax),
        total: accounting.formatMoney(this.ticketTotal)
      }));
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
            that.closeCheckoutDialog();
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
      var total = this.ticketTotal;
      if(_.isUndefined(this.available_credit) || _.isUndefined(this.term_limit) || total > this.available_credit) {
        alert("Insufficient credit limit. Transaction could not be completed.");
        this.closeCheckoutDialog(e);
      } else {
        var cuid = this.activeCustomer.get('id');
        var creditCheckoutRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId'), total: total, customer: cuid, term_limit: this.term_limit, register_id: this.fetchRegisterID()});

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
              that.closeCheckoutDialog();
              ticket.trigger('ticket:preloader', false);
              ticket.employeeSession.set('login', false);
            }
        });
      }
    },
    cashCheckout: function(e) {
      var that = this;

      if(!_.isUndefined(this.change_left) && !_.isUndefined(this.change_value) && !_.isUndefined(this.cash_paid)) {
        var formattedChange = accounting.formatNumber(this.change_left, 2, "");
        if(this.change_left > 0 && formattedChange != "0.00") {
          alert("Customer still owes amount: "+accounting.formatMoney(this.change_left));
        } else {
          var ticket = this.ticket;
          var cuid = this.activeCustomer.get('id');
          var cashCheckoutRequest = JSON.stringify({token: sessionStorage.token,
                                                    ticketId: ticket.get('ticketId'),
                                                    total: that.ticketTotal,
                                                    cash: this.cash_paid,
                                                    change: this.change_value,
                                                    customer: cuid,
                                                    cash_val: this.$('input.cash-paid').val(),
                                                    check: this.$('input#check-payment').is(':checked'),
                                                    check_val: this.$('input.check-amount').val(),
                                                    check_number: this.$('input.check-number').val(),
                                                    check_post_dated: this.$('input#post-dated').is(':checked'),
                                                    check_date: this.$('input#cash-date').val(),
                                                    mo: this.$('input#mo-payment').is(':checked'),
                                                    mo_val: this.$('input.mo-amount').val(),
                                                    mo_ref: this.$('input.mo-ref').val(),
                                                    credit: this.$('input#cc-payment').is(':checked'),
                                                    credit_val: this.$('input.charge-amount').val(),
                                                    transac_id: this.$('input#transaction-id').val(),
                                                    register_id: this.fetchRegisterID()
                                                  });

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
                var formattedChange = accounting.formatNumber(that.change_value, 2, "");
                if(formattedChange == "0.00") {
                  alert("Checkout Complete. No CHANGE.");
                } else {
                  alert("Checkout Complete. Please make change for amount: "+accounting.formatMoney(that.change_value));
                }
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
              that.closeCheckoutDialog();
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

      //if(index == 0 || index == 1) {
        //$.cardswipe('enable');
      //} else {
        //$.cardswipe('disable');
      //}

      if(index == 1) {
        this.$('.ticket-checkout-continue').hide();
      } else {
        this.$('.ticket-checkout-continue').show();
      }
    },
    focusCash: function() {
      this.$('.cash-paid').focus();
      this.$('.change-due-value').html(accounting.formatMoney(this.ticket.get('total')));
      this.$('.tax-due-value').html(accounting.formatMoney(this.ticketTax));
      this.$('.total-left-value').html(accounting.formatMoney(this.ticketTotal));
      this.$('.change-left-value').html(accounting.formatMoney(this.ticketTotal));
      this.$('.change-value').html(accounting.formatMoney(0));
      this.$('.credit-amount span.value').html(accounting.formatMoney(this.ticket.get('total')));
      this.$('.credit-tax span.value').html(accounting.formatMoney(this.ticketTax));
      this.$('.credit-total span.value').html(accounting.formatMoney(this.ticketTotal));
    },
    closeCheckoutDialog: function(e) {
      if(e) {
        e.preventDefault();
      }
      $.cardswipe('disable');
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
      var total = this.ticketTotal;
      var val = this.$('input.cash-paid').val();
      var paid;
      if(val == '') {
        paid = 0;
      } else {
        paid = parseFloat(val);
      }

      var check = this.$('input#check-payment');
      val = this.$('input.check-amount').val();
      if(check.is(':checked') && val != '') {
        paid += parseFloat(val);
      }

      check = this.$('input#mo-payment');
      val = this.$('input.mo-amount').val();
      if(check.is(':checked') && val != '') {
        paid += parseFloat(val);
      }

      check = this.$('input#cc-payment');
      val = this.$('input.charge-amount').val();

      if(check.is(':checked') && val != '') {
        paid += parseFloat(val);
      }

      var change = total - paid;

      if(change > 0) {
        total = change;
        change = 0;
      } else if(change < 0) {
        total = 0;
        change = -change;
      } else {
        total = 0;
        change = 0;
      }

      this.change_left = total;
      this.change_value = change;
      this.cash_paid = paid;

      this.$('.change-left-value').html(accounting.formatMoney(total));
      this.$('.change-value').html(accounting.formatMoney(change));
    },
    checkboxToggle: function(e) {
      if(e.currentTarget.checked) {
        this.$(e.currentTarget).parent().children('.hidden-child').show();
      } else {
        this.$(e.currentTarget).parent().children('.hidden-child').hide();
      }

      this.$('input.cash-paid').trigger('keyup');
    },
    changeModeToSwipe: function(e) {
      if(e.currentTarget.checked) {
        this.$('.manual-cc').hide();
        this.$('input.charge-amount').val('').trigger('keyup');
      } else {
        this.$('.manual-cc').show();
      }
    },
    creditCardParser: function(rawData) {
      var p = new SwipeParserObj(rawData);
      return p.dump();
    },
    creditCardScan: function (cardData) {
      //Temporary Sample data
      /*
      cardData = {
          "name": "HASAN/ASAD",
          "first_name": "ASAD",
          "last_name": "HASAN",
          "account": "5108406364897057",
          "exp_month": "05",
          "exp_year": "2017",
          "hasTrack1": true,
          "hasTrack2": false,
          "track1": "B5108406364897057^HASAN/ASAD^17051010000000884000000?",
          "track2": ";5108406364897057=1705111111111111?",
          "raw": "%B5108406364897057^HASAN/ASAD^17051010000000884000000?"
      };
      */
      var ticket = this.ticket;
      var that = this;
      var cuid = this.activeCustomer.get('id');

      if(this.currentTab == 0) {
        var cc_payment = this.$('#cc-payment').is(":checked");
        var split = this.$('#cc-payment-split').is(":checked");
        if(split && cc_payment) {
          var formattedChange = accounting.formatNumber(this.change_left, 2, "");
          if(formattedChange == "0.00") {
            alert("There are no remaining payments to be placed on the card. Please continue with regular checkout.");
          } else {
            var partialSwipeRequest = JSON.stringify({token: sessionStorage.token,
                                                    ticketId: ticket.get('ticketId'),
                                                    total: that.ticketTotal,
                                                    remaining_balance: this.change_left,
                                                    cash: that.cash_paid,
                                                    change: that.change_value,
                                                    customer: cuid,
                                                    cardData: cardData,
                                                    cash_val: this.$('input.cash-paid').val(),
                                                    check: this.$('input#check-payment').is(':checked'),
                                                    check_val: this.$('input.check-amount').val(),
                                                    check_number: this.$('input.check-number').val(),
                                                    check_post_dated: this.$('input#post-dated').is(':checked'),
                                                    check_date: this.$('input#cash-date').val(),
                                                    mo: this.$('input#mo-payment').is(':checked'),
                                                    mo_val: this.$('input.mo-amount').val(),
                                                    mo_ref: this.$('input.mo-ref').val(),
                                                    register_id: this.fetchRegisterID()
                                                  });

            that.$('.status-message').addClass('in-progress');
            $.cardswipe('disable');

            $.ajax({
              type: 'POST',
              url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/partial-swipe-checkout',
              data: {request: partialSwipeRequest},
              timeout: 15000,
              success: function(res, status, xhr) {
                that.$('.status-message').removeClass('in-progress');
                $.cardswipe('enable');
                if(res.status) {
                  //Close ticket
                  ticket.set('status_en', 'Closed Ticket');
                  ticket.set('status', 'pos_completed');
                  alert(res.message);
                  that.closeCheckoutDialog();
                } else {
                  that.$('.status-message').removeClass('in-progress');
                  alert(res.error);
                }
              },
              error: function(xhr, errorType, error) {
                $.cardswipe('enable');
                that.$('.status-message').removeClass('in-progress');
                that.closeCheckoutDialog();
                ticket.employeeSession.set('login', false);
              }
            });
          }
        } else {
          alert('Please select "Credit Card Payment" and "Swipe Remaining Amount" before swiping a card.');
        }
      } else if(this.currentTab == 1) {
        var swipeCheckoutRequest = JSON.stringify({
          token: sessionStorage.token,
          ticketId: ticket.get('ticketId'),
          total: that.ticketTotal,
          register_id: this.fetchRegisterID(),
          customer: this.activeCustomer.get('id'),
          cardData: cardData
        });

        that.$('.status-message').addClass('in-progress');
        $.cardswipe('disable');

        $.ajax({
          type: 'POST',
          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/swipe-checkout',
          data: {request: swipeCheckoutRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            that.$('.status-message').removeClass('in-progress');
            $.cardswipe('enable');
            if(res.status) {
              //Close ticket
              ticket.set('status_en', 'Closed Ticket');
              ticket.set('status', 'pos_completed');
              alert(res.message);
              that.closeCheckoutDialog();
            } else {
              that.$('.status-message').removeClass('in-progress');
              alert(res.error);
            }
          },
          error: function(xhr, errorType, error) {
            $.cardswipe('enable');
            that.$('.status-message').removeClass('in-progress');
            that.closeCheckoutDialog();
            ticket.employeeSession.set('login', false);
          }
        });
      } else {
        alert('Credit Card swipes are not allowed in this mode.');
      }
    },
    creditCardScanFail: function() {
      alert('We could not read this card, please try again.');
    }
  });
});
