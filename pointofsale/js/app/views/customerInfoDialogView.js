jQuery(function($) {
  //Application Views
  customerInfoDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'customerInfoOverlay',
    events: {
      "click a.customer-info-continue": 'continueProcessDebouncedTrigger',
      "click a.customer-info-cancel": 'closeCheckoutDialog',
      "click a.ticket-rma-return": 'ticket_rma_return',
      "click a.ticket-rma-empty": 'ticket_create_rma_empty',
      "click .info-menu-tabs a": 'changeTab',
      "click .invoice-history a": 'invoiceDataRefresh',
      "click .invoice-history table.uc-order-history tbody tr": 'selectInvoice',
      "click": 'focusScanner',
      "click .returning-items a.delete-item": 'rmaDeleteItem',
      "click .returning-items a.decrease": 'rmaDecrease',
      "click .returning-items a.increase": 'rmaIncrease',
      "keyup input.rma-scan": 'searchKeyUp',
      "keypress .credit-payments-checkout input.cash-paid": 'cashInputValidate',
      "keypress .toggle-payment input.check-amount": 'cashInputValidate',
      "keypress .toggle-payment input.mo-amount": 'cashInputValidate',
      "keypress .toggle-payment input.charge-amount": 'cashInputValidate',
      "keypress .toggle-payment input.rma-amount": 'cashInputValidate',
      "keyup .credit-payments-checkout input.cash-paid": 'calculateCashChange',
      "keyup .toggle-payment input.check-amount": 'calculateCashChange',
      "keyup .toggle-payment input.mo-amount": 'calculateCashChange',
      "keyup .toggle-payment input.charge-amount": 'calculateCashChange',
      "keyup .toggle-payment input.rma-amount": 'calculateCashChange',
      'change .toggle-payment input[type="checkbox"]': 'checkboxToggle',
      "change #cc-payment-split": 'changeModeToSwipe',
      "click a.reload-payments": 'reloadPaymentHistory',
      "click ul.pager a": 'changeSettlementsPage',
      "click .history .checkout-label": 'toggleUsageDisplay',
      "click div.payment-history-print": 'printPaymentHistory',
      "click div.invoice-history-print": 'printInvoiceHistory',
      "click div.customer-statement-print": 'printCustomerHistory',
      "click .history a": 'ignoreLinkClick',
      "click a.block-current-customer": 'blockCustomerUid',
      "click a.block-edit-customer": 'editFormInitiate'
    },
    editCustomer: _.template($('#edit-customer').html()),
    editFormInitiate: function(e) {
      e.preventDefault();
      if(_.isUndefined(this.customer_uid)) {
        var cuid = this.activeCustomer.get('id');            
      } else {
        var cuid = this.customer_uid;
      }

      $('.calcOverlay').html(this.editCustomer({
        api_server: this.employeeSession.get('apiServer'),
        token: this.employeeSession.get("token"),
        customer_uid: cuid
      })).show();
      $('.calcOverlay a.clear-calculator').on('click', _.bind(this.clearCalculator, this));
      $('.calcOverlay iframe').focus();
    },
    clearCalculator: function(e) {
      e.preventDefault();
      $('.calcOverlay').empty().hide();
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.activeCustomerView = attributes['activeCustomerView'];
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
      this.rmaDialogModal = attributes['rmaDialogModal'];
      this.appFrame = attributes['appFrame'];
      this.rmaItemsCollection = new rmaItemsCollection();
      this.rmaItemsCollectionFinal = new rmaItemsCollection();
      this.rmaTicket = new rmaTicket({rmaItemsCollection: this.rmaItemsCollectionFinal, total: 0, dialog: this});
      
      this.continueProcessDebounced = _.debounce(this.continueProcess, 2000, true);

      this.listenTo(this.rmaItemsCollectionFinal, 'add', this.addItemToRMA);
      this.listenTo(this.rmaItemsCollectionFinal, 'remove', this.removeItemFromRMA);
      this.listenTo(this.rmaItemsCollectionFinal, 'change', this.changeReturnQty);
      this.currentTab = 0; //Start with 0th tab.
      this.requests = new Array();
    },
    template: _.template($('#customer-info-modal').html()),
    paymentTemplate: _.template($('#credit-payments-checkout').html()),
    RMAFormTemplate: _.template($('#process-rma-form').html()),
    RMAFinalTemplate: _.template($('#rma-final-line-item').html()),
    fetchRegisterID: _.template($('#register-id').html()),
    labelizeTemplate: _.template($('#labelize-data').html()),
    noPendingPaymentsMessage: _.template($('#no-pending-payments').html()),
    continueProcessDebouncedTrigger: function(e) {
      e.preventDefault();
      this.calculateCashChange(false);
      this.continueProcessDebounced(e);
    },
    loadUserProfile: function(uid, default_tab_flag) {
      var that = this;
      if(uid) {
        var customer_uid = uid;
        this.customer_uid = customer_uid;
      } else {
        var activeCustomer = this.activeCustomer;
        var customer_uid = activeCustomer.get('id');
        this.customer_uid = undefined;
      }

      this.customer_uid = customer_uid;

      var customerInfoRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
      //Start preloader
      //this.trigger('ticket:preloader', true);
      var request = $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/info',
        data: {request: customerInfoRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            //Customer Info Tab
            that.$('.profile-content').html(res.customer_info);
            var company = that.$('h2').remove().text();
            that.$('.bbm-modal__title').text(company);
            that.$('.profile-content fieldset legend').append('<span></span>');

            //Invoices
            that.populateInvoices(that.$('.invoice-history'), res.invoices);

            //Payments
            that.pending_payments = res.payments;
            that.rma_credits = res.rma_credits;
            if(res.payments.pending_payments > 0) {
              that.setupPaymentForm(res.payments, res.rma_credits, true);
            } else {
              that.setupPaymentForm(res.payments, res.rma_credits, false);
            }

            that.$('.rma-credits').html(that.labelizeTemplate({
              label: 'RMA Credit',
              value: accounting.formatMoney(res.rma_credits)
            }));

            that.$('.loader').hide();
            that.$('.tabs').show();
            that.adjustBlockHeights();

            if(default_tab_flag == 1) {
              $('.info-menu-tabs li:eq(2) a').trigger('click');
            } else if(default_tab_flag == 2) {
              $('.info-menu-tabs li:eq(3) a').trigger('click');
            }
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

      this.requests.push(request);
    },
    printPaymentHistory: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var win = window.open(this.employeeSession.get('apiServer')+'/user/'+this.customer_uid+'/term-credits/payment-history/pos?token='+sessionStorage.token, '_blank');
      win.focus();
    },
    printInvoiceHistory: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var win = window.open(this.employeeSession.get('apiServer')+'/user/'+this.customer_uid+'/term-credits/invoice-history/pos?token='+sessionStorage.token, '_blank');
      win.focus();
    },
    printCustomerHistory: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var win = window.open(this.employeeSession.get('apiServer')+'/user/'+this.customer_uid+'/term-credits/customer-statement/pos?token='+sessionStorage.token, '_blank');
      win.focus();
    },
    reloadPaymentHistory: function(e) {
      e.preventDefault();
      var that = this;
      this.$('.loader').show();
      this.$('.tabs').hide();

      var customerPaymentInfoRequest = JSON.stringify({token: sessionStorage.token, customer_uid: this.customer_uid});
      var request = $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/info-payments',
        data: {request: customerPaymentInfoRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            //Payments
            that.pending_payments = res.payments;
            that.rma_credits = res.rma_credits;
            if(res.payments.pending_payments > 0) {
              that.setupPaymentForm(res.payments, res.rma_credits, true);
            } else {
              that.setupPaymentForm(res.payments, res.rma_credits, false);
            }

            that.$('.loader').hide();
            that.$('.tabs').show();
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
      this.requests.push(request);
    },
    blockCustomerUid: function(e) {
      e.preventDefault();
      var customerName = this.$('.bbm-modal__title').text();
      this.activeCustomerView.$searchbox.typeahead('clearCache');
      if(confirm('Are you sure you want to disable customer: '+customerName+'?')) {
        var that = this;
        var customer_uid = this.customer_uid;
        var ticket = this.ticket;
        var blockCustomerUidRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
        ticket.trigger('ticket:preloader', true);
        var request = $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/customer/block',
          data: {request: blockCustomerUidRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              alert(res.message);
            } else {
              that.employeeSession.set('login', false);
            }
            that.modal.display(false);
            ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            //Seems to be a forgivabale error, perhaps no need to logout.
            //stop pre loader and logout user.
            ticket.trigger('ticket:preloader', false);
            that.employeeSession.set('login', false);
            that.modal.display(false);
          }
        });

        this.requests.push(request);
      }
    },
    changeSettlementsPage: function(e) {
      e.preventDefault();

      var that = this;
      var query = this.removeURLParameter(e.currentTarget.search, 'request');
      var customerPaymentInfoRequest = JSON.stringify({token: sessionStorage.token, customer_uid: this.customer_uid});
      var request = $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/settlement-list'+query,
        data: {request: customerPaymentInfoRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.$('.credit-usages').html(res.payments);
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

      this.requests.push(request);
    },
    populateInvoices: function(invoices, ahah) {
      invoices.html(ahah);
    },
    setupPaymentForm: function(payments, rma_credits, flag) {
      if(flag) {
        payments.rma_credits = rma_credits;
        this.$('.payment-history').html(this.paymentTemplate(payments));
      } else {
        var usages = {usages: payments.usages};
        this.$('.payment-history').html(this.noPendingPaymentsMessage(usages));
      }
    },
    changeTab: function(e) {
      e.preventDefault();

      //Detect index of selected tab
      this.$('li.pure-menu-selected').removeClass('pure-menu-selected');
      var list_element = e.currentTarget.parentNode;
      list_element.className += ' pure-menu-selected';
      var index = this.$('.info-menu-tabs ul li').index(list_element);
      
      //Activate corrosponding tab
      var tabs = this.$('.tabs .tab');
      tabs.hide();
      tabs.eq(index).show();

      if(index == 2) {
        this.$('a.customer-info-cancel').show();
      } else {
        this.$('a.customer-info-cancel').hide();
      }

      this.currentTab = index;
    },
    invoiceDataRefresh: function(e) {
      e.preventDefault();
      var query = this.removeURLParameter(e.currentTarget.search, 'request');

      var that = this;
      //var activeCustomer = this.activeCustomer;
      //var customer_uid = activeCustomer.get('id');
      var customer_uid = this.customer_uid;

      var customerInvoicesRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
      var request = $.ajax({
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
          //Seems to be a forgivabale error, perhaps no need to logout.
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
          //that.employeeSession.set('login', false);
        }
      });
      this.requests.push(request);
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
      this.$('.rma-form').html(this.RMAFormTemplate());
      this.rmaItemsCollectionFinal.reset();
      this.rmaTicket.set('total', 0);
      
      this.pending_payments = undefined;
      this.change_left = undefined; 
      this.change_value = undefined;
      this.cash_paid = undefined;

      this.$('a.customer-info-cancel').hide();

      this.remaining = 0;
      return this;
    },
    cashInputValidate: function(e) {
      if(e.currentTarget.value == e.currentTarget.defaultValue) {
        e.currentTarget.value = '';
      }

      var charCode = e.keyCode || e.which;
      var charStr = String.fromCharCode(charCode);

      var reg = /^\d|\.$/;
      if(!reg.test(charStr)) {
        e.preventDefault();
      }
    },
    calculateCashChange: function(e) {
      if(_.isUndefined(this.pending_payments)) {
        alert("Could not load customer. Please close and try again.");
      } else {
        var total = this.pending_payments.pending_payments;
        var input_field = this.$('input.cash-paid');
        var val = input_field.val().replace('..', '.');
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

        check = this.$('input#rma-payment');
        val = this.$('input.rma-amount').val();

        if(check.is(':checked') && val != '' && !isNaN(val)) {
          val = parseFloat(val);
          var rma_credits = parseFloat(this.rma_credits);
          if(val <= rma_credits) {
            paid += val;
          } else {
            paid += rma_credits;
            if(e) {
              e.currentTarget.value = rma_credits;
            }
          }
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

        if(e) {
          var reg = /^\d$/;
          var charCode = e.keyCode || e.which;
          var charStr = String.fromCharCode(charCode);

          if(reg.test(charStr) || charCode == 190 || charCode == 110 || (e.keyCode >= 96 && e.keyCode <= 105)) {
            var start = e.currentTarget.selectionStart,
            end = e.currentTarget.selectionEnd;
            e.currentTarget.value = accounting.formatNumber(e.currentTarget.value, 2, '');
            e.currentTarget.setSelectionRange(start, end);
          }
          if((e.keyCode == 8 || e.keyCode == 190 || charCode == 110) && e.currentTarget.value == '') {
            e.currentTarget.value = '0.00';
            e.currentTarget.setSelectionRange(0, 0);
          }
        }

        this.$('.payment-made-value').html(accounting.formatMoney(paid));
        this.$('.remaining-due-value').html(accounting.formatMoney(total));
        this.$('.change-due-value').html(accounting.formatMoney(change));
      }
    },
    changeModeToSwipe: function(e) {
      if(e.currentTarget.checked) {
        this.$('.manual-cc').hide();
        this.$('input.charge-amount').val('').trigger('keyup');
      } else {
        this.$('.manual-cc').show();
      }
    },
    checkboxToggle: function(e) {
      if(e.currentTarget.checked) {
        this.$(e.currentTarget).parent().children('.hidden-child').show();
      } else {
        this.$(e.currentTarget).parent().children('.hidden-child').hide();
      }

      this.$('input.cash-paid').trigger('keyup');
    },
    continueProcess: function(e) {
      if(this.currentTab == 2) {
        this.cashCheckout(e);
      } else {
        this.closeCheckoutDialog(e);
      }
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      e.stopPropagation(); //Stop bubbling click to focus on the secondary rma scanner, so focus can goes to primary scanner
      this.currentTab = 0; //reset current tab
      _.each(this.requests, function(request) {
        request.abort();
      });
      this.requests = [];
      this.modal.display(false);
    },
    cashCheckout: function(e) {
      e.preventDefault();
      var that = this;

      if(!_.isUndefined(this.change_left) && !_.isUndefined(this.change_value) && !_.isUndefined(this.cash_paid)) {
        var formatedCash = accounting.formatNumber(this.cash_paid, 2, "");
        if(formatedCash == "0.00") {
          alert("Please enter a cash amount higher than $0.00 to continue.");
        } else {
          var ticket = this.ticket;
          if(_.isUndefined(this.customer_uid)) {
            var cuid = this.activeCustomer.get('id');            
          } else {
            var cuid = this.customer_uid;
          }

          var creditCashCheckoutRequest = JSON.stringify({token: sessionStorage.token,
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
                                                    stash_change: this.$('input.stash-change').is(':checked'),
                                                    mo_ref: this.$('input.mo-ref').val(),
                                                    credit: this.$('input#cc-payment').is(':checked'),
                                                    credit_val: this.$('input.charge-amount').val(),
                                                    rma: this.$('input#rma-payment').is(':checked'),
                                                    rma_value: this.$('input.rma-amount').val(),
                                                    transac_id: this.$('input#transaction-id').val(),
                                                    register_id: this.fetchRegisterID()
                                                  });

          ticket.trigger('ticket:preloader', true);
          $.ajax({
            type: 'POST',
            url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/credit-cash-checkout',
            data: {request: creditCashCheckoutRequest},
            timeout: 15000,
            success: function(res, status, xhr) {
              //stop preloader
              ticket.trigger('ticket:preloader', false);
              if(res.status) {
                var formattedChange = accounting.formatNumber(that.change_value, 2, "");
                if(formattedChange == "0.00") {
                  alert("Payment Complete. No CHANGE.");
                } else {
                  if(that.$('input.stash-change').is(':checked')) {
                    alert("Payment Complete. Please make NO CHANGE, Customer RMA was credited with amount: "+accounting.formatMoney(that.change_value));
                  } else {
                    alert("Payment Complete. Please make change for amount: "+accounting.formatMoney(that.change_value));
                  }
                }
                that.printReceipt(res);
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
        alert("Please input cash amount before checkout.");
      }
    },
    printReceipt: function(res) {
      var ticketId = this.ticket.get('ticketId');
      //Eject Cash Drawer
      $.ajax({url: 'http://127.0.0.1:3000/drawer', type: 'GET'});

      //Print Ticket
      //window.open(this.employeeSession.get('apiServer')+'/admin/invoice/print/'+ticketId+'?token='+this.employeeSession.get("token"));
      if(confirm('Would you like to print a receipt?')) {
        $.ajax({
            url: 'http://127.0.0.1:3000/', 
            type: 'POST', 
            contentType: 'application/json', 
            data: JSON.stringify({ticket : this.employeeSession.get('apiServer')+'/admin/invoice/print-reciept/'+res.cuid+'/'+res.time+'?token='+this.employeeSession.get("token")}),
            success: function(data) {
              alert("Receipt was sent to printer.");
            },
            error: function() {
              alert("Failed to send receipt to printer.");
            }
        });
      }
    },
    selectInvoice: function(e) {
      if(this.appFrame.checkoutHideSemaphore == 0) {
        var ticketId = $('td:eq(1)', e.currentTarget).text();
        var that = this;
        var ticket = this.ticket;

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
                alert(res.message);
              }
            },
            error: function(xhr, errorType, error) {
              ticket.employeeSession.set('login', false);
            }
          });
        }
      } else {
        alert("Cannot change ticket while product scanning is in progress.");
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
    },
    focusScanner: function(e) {
      if(this.$('li.pure-menu-selected').hasClass('rma')){
        this.$('.rma-scan').focus();
      }
    },
    searchKeyUp: function(e) {
      //Process barcode scan
      if(e.keyCode == 13) {
        var value = e.target.value.trim();
        if(value != '') {
          e.target.value = '';
          this.scanItem(value);
        }
      }
    },
    scanItem: function(value) {
      var ticket = this.ticket;
      var dialog = this;
      var customer_uid = this.customer_uid;
      var rmaRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid, item_barcode: value});

      ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/rma',
        data: {request: rmaRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          ticket.trigger('ticket:preloader', false);
          if(res.status) {
            dialog.rmaItemsCollection.reset();
            dialog.rmaDialogModal.display(true);
            dialog.rmaDialogModal.populateSelections(res.products, dialog, true);
          } else {
            if(res.error_forgive) {
              dialog.rmaItemsCollection.reset();
              dialog.rmaDialogModal.display(true);
              dialog.rmaDialogModal.populateSelections(res.products, dialog, false);
            } else {
              $.jGrowl(res.error);
            }
          }
        },
        error: function(xhr, errorType, error) {
          ticket.employeeSession.set('login', false);
          ticket.trigger('ticket:preloader', false);
        }
      });
    },
    rmaItemSelected: function(product) {
      this.rmaDialogModal.display(false);
      this.rmaItemsCollectionFinal.add(product);
    },
    addItemToRMA: function(model, collection, options) {
      var total = this.rmaTicket.get("total");
      var sell_price = accounting.unformat(model.attributes.sell_price);
      model.set("sell_price", sell_price);
      total += sell_price;
      this.rmaTicket.set("total", total);

      model.set('returning_qty', 1, {silent: true});
      this.$('.returning-items .product-table').append(this.RMAFinalTemplate(model.attributes));
    },
    removeItemFromRMA: function(model) {
      var itemId = model.get('id');
      var total = this.rmaTicket.get("total");
      this.rmaTicket.set("total", total - (model.get("sell_price")*model.get('returning_qty')));
      this.$('.returning-items #line-item-'+itemId).remove();
    },
    rmaDeleteItem: function(e) {
      e.preventDefault();
      var itemId = e.target.parentElement.parentElement.dataset.id;
      this.rmaItemsCollectionFinal.remove(itemId);
    },
    rmaDecrease: function(e) {
      e.preventDefault();
      var itemId = e.target.parentElement.parentElement.parentElement.dataset.id;
      var product = this.rmaItemsCollectionFinal.get(itemId);
      var quantity = product.get('remaining_qty');
      var returning_qty = product.get('returning_qty');
      returning_qty--;
      this.setReturnQty(product, quantity, returning_qty)
    },
    rmaIncrease: function(e) {
      e.preventDefault();
      var itemId = e.target.parentElement.parentElement.parentElement.dataset.id;
      var product = this.rmaItemsCollectionFinal.get(itemId);
      var quantity = product.get('remaining_qty');
      var returning_qty = product.get('returning_qty');
      returning_qty++
      this.setReturnQty(product, quantity, returning_qty)
    },
    setReturnQty: function(product, qty, returning_qty) {
      if(0 < returning_qty && returning_qty <= qty) {
        product.set('returning_qty', returning_qty);
      }
    },
    changeReturnQty: function(product) {
      var previous_qty = product.previous("returning_qty");
      var qty = product.get("returning_qty");
      var price = product.get("sell_price");
      var total = this.rmaTicket.get('total');
      this.rmaTicket.set("total", (total-(price*previous_qty)+(price*qty)));

      //update qty in dom
      var id = product.get('id');
      var qty = product.get('returning_qty');
      this.$('.returning-items #line-item-'+id+' .qty span.return-value').text(qty);
    },
    ticket_create_rma_empty: function(e) {
      if(this.appFrame.checkoutHideSemaphore == 0) {
        var ticket = this.ticket;
        var customer_uid = this.customer_uid;
        var that = this;
        var status = ticket.get('status');
        e.preventDefault();

        var rmaTicketOpenRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid, products: new Array(), register_id: this.fetchRegisterID()});
        ticket.trigger('ticket:preloader', true);
        //console.log(products);
        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/create-rma-ticket',
          data: {request: rmaTicketOpenRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              var stasuses = ticket.get('ticketStasuses');
              //Change without silent to populate active customer and ticket products (Empty on create ticket command).
              ticket.set({
                status: res.ticketStatus,
                status_en: stasuses[res.ticketStatus],
                ticketId: res.ticketId,
                customerUid: customer_uid
              });

              //Unconditionally acquire new rma ticket from lock server.
              if(res.ticketId) {
                $.ajax({
                  type: 'GET',
                  url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+res.ticketId+'&register_id='+$('#register-id').html()+'&op=acquire',
                  timeout: 1000,
                  error: function(xhr, errorType, error) {
                    ticket.employeeSession.set('login', false);
                  }
                });
              }
            }
            alert(res.message);
            that.closeCheckoutDialog(e);
            ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            //stop pre loader and logout user.
            ticket.trigger('ticket:preloader', false);
            that.employeeSession.set('login', false);
            that.closeCheckoutDialog(e);
          }
        });
      } else {
          alert("Cannot open new rma ticket while product scanning is in progress.");
      }
    },
    ticket_rma_return: function(e) {
      if(this.appFrame.checkoutHideSemaphore == 0) {
        var ticket = this.ticket;
        var customer_uid = this.customer_uid;
        var total = this.rmaTicket.get('total');
        var that = this;
        var status = ticket.get('status');
        e.preventDefault();

        if(total > 0) {
          var products = new Array();
          this.rmaItemsCollectionFinal.each(function(product) {
            var historic = product.get('historic');
            var nid;
            if(historic) {
              nid = product.get('nid');
            } else {
              nid = product.get('id');
            }
            var qty = product.get('returning_qty');
            products.push({
              nid: nid,
              name: product.get('name'),
              order_product_id: product.get('id'),
              sku: product.get('sku'),
              qty_returned: qty,
              price: product.get('sell_price'),
              historic: product.get('historic')
            });
          });

          var rmaTicketOpenRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid, products: products, register_id: this.fetchRegisterID()});
          ticket.trigger('ticket:preloader', true);
          //console.log(products);
          $.ajax({
            type: 'POST',
            url: this.employeeSession.get('apiServer')+'/pos-api/ticket/create-rma-ticket',
            data: {request: rmaTicketOpenRequest},
            timeout: 15000,
            success: function(res, status, xhr) {
              if(res.status) {
                var stasuses = ticket.get('ticketStasuses');
                //Change without silent to populate active customer and ticket products (Empty on create ticket command).
                ticket.set({
                  status: res.ticketStatus,
                  status_en: stasuses[res.ticketStatus],
                  ticketId: res.ticketId,
                  customerUid: customer_uid
                });

                //Unconditionally acquire new rma ticket from lock server.
                if(res.ticketId) {
                  $.ajax({
                    type: 'GET',
                    url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+res.ticketId+'&register_id='+$('#register-id').html()+'&op=acquire',
                    timeout: 1000,
                    error: function(xhr, errorType, error) {
                      ticket.employeeSession.set('login', false);
                    }
                  });
                }
              }
              alert(res.message);
              that.closeCheckoutDialog(e);
              ticket.trigger('ticket:preloader', false);
            },
            error: function(xhr, errorType, error) {
              //stop pre loader and logout user.
              ticket.trigger('ticket:preloader', false);
              that.employeeSession.set('login', false);
              that.closeCheckoutDialog(e);
            }
          });
        } else {
            alert('No items to refund on RMA.');
        }
      } else {
        alert("Cannot open new rma ticket while product scanning is in progress.");
      }
    },
    toggleUsageDisplay: function(e) {
      this.$('.history .credit-usages').slideToggle();
    },
    ignoreLinkClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
    }
  });
});