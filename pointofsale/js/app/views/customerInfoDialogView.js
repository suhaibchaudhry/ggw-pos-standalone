jQuery(function($) {
  //Application Views
  customerInfoDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'customerInfoOverlay',
    events: {
      "click a.customer-info-continue": 'continueProcess',
      "click a.customer-info-cancel": 'closeCheckoutDialog',
      "click a.ticket-rma-return": 'ticket_rma_return',
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
      "keyup .credit-payments-checkout input.cash-paid": 'calculateCashChange',
      "keyup .toggle-payment input.check-amount": 'calculateCashChange',
      "keyup .toggle-payment input.mo-amount": 'calculateCashChange',
      "keyup .toggle-payment input.charge-amount": 'calculateCashChange',
      'change .toggle-payment input[type="checkbox"]': 'checkboxToggle',
      "change #cc-payment-split": 'changeModeToSwipe'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
      this.ticket = attributes['ticket'];
      this.rmaDialogModal = attributes['rmaDialogModal'];
      this.rmaItemsCollection = new rmaItemsCollection();
      this.rmaItemsCollectionFinal = new rmaItemsCollection();
      this.rmaTicket = new rmaTicket({rmaItemsCollection: this.rmaItemsCollectionFinal, total: 0, dialog: this});
      this.listenTo(this.rmaItemsCollectionFinal, 'add', this.addItemToRMA);
      this.listenTo(this.rmaItemsCollectionFinal, 'remove', this.removeItemFromRMA);
      this.listenTo(this.rmaItemsCollectionFinal, 'change', this.changeReturnQty);
    },
    template: _.template($('#customer-info-modal').html()),
    paymentTemplate: _.template($('#credit-payments-checkout').html()),
    RMAFormTemplate: _.template($('#process-rma-form').html()),
    RMAFinalTemplate: _.template($('#rma-final-line-item').html()),
    fetchRegisterID: _.template($('#register-id').html()),
    loadUserProfile: function(uid) {
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
            that.setupPaymentForm(res.payments);
            that.pending_payments = res.payments;
            //that.$('.payment-history').html(res.payments);

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
    setupPaymentForm: function(payments) {
      this.$('.payment-history').html(this.paymentTemplate(payments));
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
          //Seems to be a forgivabale error, perhaps no need to logout.
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
          //that.employeeSession.set('login', false);
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

      if((e.keyCode < 48 || e.keyCode > 57) && e.keyCode != 46 && e.keyCode != 8 && e.keyCode != 190) {
        e.preventDefault();
      }
    },
    calculateCashChange: function(e) {
      if(_.isUndefined(this.pending_payments)) {
        alert("Could not load customer. Please close and try again.");
      } else {
        var total = this.pending_payments.pending_payments;
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
                                                    mo_ref: this.$('input.mo-ref').val(),
                                                    credit: this.$('input#cc-payment').is(':checked'),
                                                    credit_val: this.$('input.charge-amount').val(),
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
                  alert("Payment Complete. Please make change for amount: "+accounting.formatMoney(that.change_value));
                }
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
    ticket_rma_return: function(e) {
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

          if(status == 'pos_return') {
            that.scanItemRegular(product.get('sku'), qty);
          }
        });

        if(status == 'pos_return') {
          that.record_rma_transaction(products, this.ticket.get('ticketId'));
          that.closeCheckoutDialog(e);
        } else {
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

                that.record_rma_transaction(products, res.ticketId);
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
        }
      } else {
          alert('No items to refund on RMA.');
      }
    },
    record_rma_transaction: function(products) {
      var ticket = this.ticket;
      var customer_uid = this.customer_uid;
      var total = this.rmaTicket.get('total');
      var that = this;

      var rmaRecordRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid, total: total, products: products, register_id: this.fetchRegisterID()});
      ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/rma-checkout',
        data: {request: rmaRecordRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(res.status) {
            alert(res.message);
          } else {
            that.employeeSession.set('login', false);
          }
          ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          ticket.trigger('ticket:preloader', false);
        }
      });
    },
    scanItemRegular: function(barcode, qty) {
      var that = this;

      var scanRequest = JSON.stringify({
        token: this.employeeSession.get("token"),
        barcode: barcode
      });

      var ticket = this.ticket.get('activeTicketView');

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/product-scan',
        data: {request: scanRequest},
        timeout: 10000,
        success: function(res, status, xhr) {
          if(res.scan) {
            ticket.addItemToCollection(res.product, qty);
          } else {
            //$.jGrowl("Could not find item with barcode: <strong>"+barcode+"</strong>");
            alert("Could not find item with barcode: "+barcode);
          }
        },
        error: function(xhr, errorType, error) {
          $.jGrowl("Could not connect to the network. Please check connection.");
          //Something is wrong log user out.
          that.employeeSession.set('login', false);
        }
      });
    }
  });
});