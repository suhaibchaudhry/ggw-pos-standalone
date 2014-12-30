jQuery(function($) {
  activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      "click .line-item a.delete-item": 'removeLineItem',
      "click .line-item .qty a.increase": 'incrementQty',
      "click .line-item .qty a.decrease": 'decreaseQty',
      "click .line-item .price": 'managerPriceOverride',
      "click .item-search a.clear-search": 'clearProductSearch',
      //"mouseup .mousetrap": 'mouseTrapRelease',
      "keyup .item-search input.search": 'searchKeyUp',
      "click": 'activateScanFocus'
    },
    //Ticket Templates
    searchBoxTemplate: _.template($('#item-search-components').html()),
    lineItemTemplate: _.template($('#ticket-line-item').html()),
    labelizeTemplate: _.template($('#labelize-data').html()),
    rmaListHeading: _.template($('#return-line-item-list-heading').html()),
    rmaListTotal: _.template($('#return-line-item-total').html()),
    categoryBreakdownTemplate: _.template($('#category-breakdown-template').html()),
    lastSuggestion: '',

    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.$registerDisplay = attributes['registerDisplay'];
      this.activeCustomerView = attributes['activeCustomerView'];
      this.activeCustomer = this.activeCustomerView.activeCustomer;
      this.searchTicketView = attributes['searchTicketView'];
      this.appFrame = attributes['appFrame'];

      this.ticket = new Ticket({
        employeeSession: attributes['employeeSession'],
        activeCustomer: this.activeCustomerView.activeCustomer,
        activeTicketView: this,
        activeCustomerView: this.activeCustomerView
      });

      //Initialize Checkout Dialog
      this.checkoutDialogModal = new checkoutDialogModal({activeCustomer: this.activeCustomer, ticket: this.ticket, employeeSession: attributes['employeeSession']});

      //Initialize Manager Price Override Dialog
      this.managerPriceDialog = new managerPriceDialog({
        employeeSession: attributes['employeeSession'],
        activeCustomer: this.activeCustomerView.activeCustomer,
        ticket: this.ticket
      });

      //Initialize Customer Info Dialog
      this.customerInfoDialogModal = new customerInfoDialogModal({activeCustomer: this.activeCustomer, employeeSession: this.employeeSession, ticket: this.ticket, activeCustomerView: this.activeCustomerView, appFrame: this.appFrame});
      this.activeCustomerView.customerInfoDialogModal = this.customerInfoDialogModal;

      //Initialize Invoices List dialog
      this.invoiceDialog = new invoiceDialogModal({employeeSession: this.employeeSession, ticket: this.ticket, activeCustomerView: this.activeCustomerView});

      //Set ticket and CheckoutModal singleton on searchTicket View.
      this.searchTicketView.ticket = this.ticket;
      this.searchTicketView.checkoutDialogModal = this.checkoutDialogModal;

      //Notify Search Ticket view to update the status
      this.searchTicketView.listenTo(this.ticket, 'change:status', _.bind(this.searchTicketView.changeTicketStatus, this.searchTicketView));

      //Update product category count asynchronously.
      this.listenTo(this.ticket, 'change:categories', this.categoryBreakdownDraw);

      //Notify Search Ticket view to update the ticket id.
      this.listenTo(this.ticket, 'change:ticketId', _.bind(this.searchTicketView.changeTicket, this.searchTicketView));

      //Create ticket product table on UI, and activate mousetrap.
      this.ticketRegionClicked = false;
      this.ticketRegionClickY = 0;
      this.$ticketContainer = this.$('.ticket-container');
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      //this.$mouseTrap = this.$('.mousetrap');

      //Handle events when products are added and removed from ticket product collection, and ticket attrs are changed.
      this.listenTo(this.ticket.get('productCollection'), 'add', this.addItem);
      this.listenTo(this.ticket.get('productCollection'), 'remove', this.removeItem);
      this.listenTo(this.ticket.get('productCollection'), 'reset', this.clearTicket);

      this.listenTo(this.ticket.get('productCollection'), 'change:qty', this.changeQuantyDisplay);
      this.listenTo(this.ticket.get('productCollection'), 'change:price', this.priceUpdate);

      //Update the ticket values on View when model is changed.
      this.listenTo(this.ticket, 'change:total', this.updateTotal);
      this.listenTo(this.ticket, 'change:productCount', this.updateProductCount);
      this.listenTo(this.ticket, 'ticket:preloader', _.bind(this.appFrame.ticketPreloader, this.appFrame));
      this.listenTo(this.ticket, 'ticket:checkoutHide', _.bind(this.appFrame.checkoutHidePreloader, this.appFrame));
      this.listenTo(this.ticket, 'ticket:lockModifications', _.bind(this.appFrame.ticketLockModifications, this.appFrame));

      //AppFrame Buttons
      this.appFrame.$('a.new-ticket-button').on('click', _.bind(this.createNewTicket, this));

      //Focus on product scan on click to register display (outside of this view dom scope).
      this.$registerDisplay.on('click', _.bind(this.activateScanFocus, this));
    },
    categoryBreakdownDraw: function(ticket, categories, options) {
      this.$registerDisplay.find('.category-breakdown').html(this.categoryBreakdownTemplate({categories: categories}));
    },
    //Backbone Event Handlers
    addItem: function(product) {
      this.searchTicketView.lastItemScanned.empty();
      this.searchTicketView.lastScannedItemDebounced(product);
      this.$ticketContainer.find('.product-table').append(this.lineItemTemplate(product.attributes));
      //if(product.get('retail')) {
      this.$('#line-item-'+product.get('id')+' .price').html(accounting.formatMoney(product.get('price')));
      /*
      } else {
        this.$('#line-item-'+product.get('id')+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }*/

      if(product.get('manager_price')) {
        this.$('#line-item-'+product.get('id')+' .price').addClass('manager-overriden');
      } else {
        this.$('#line-item-'+product.get('id')+' .price').removeClass('manager-overriden');
      }

      this.$('#line-item-'+product.get('id')+' .extprice').text(accounting.formatMoney(product.get('price')*product.get('qty')));
    },
    removeItem: function(model) {
      this.$ticketContainer.find('#line-item-'+model.get('id')).remove();
    },
    clearTicket: function() {
      this.searchTicketView.lastItemScanned.empty();
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      //this.$registerDisplay.find('.calculation').empty();
    },
    changeQuantyDisplay: function(product, qty, options) {
      this.$('#line-item-'+product.get('id')+' .qty span.value').text(qty);
    },
    priceUpdate: function(product, value, options) {
      //Update physical view price of an item when price changes on product model.
      //if(product.get('retail')) {
      this.$('#line-item-'+product.get('id')+' .price').html(accounting.formatMoney(product.get('price')));
      /*} else {
        this.$('#line-item-'+product.get('id')+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }*/

      if(product.get('manager_price')) {
        this.$('#line-item-'+product.get('id')+' .price').addClass('manager-overriden');
      } else {
        this.$('#line-item-'+product.get('id')+' .price').removeClass('manager-overriden');
      }
    },
    updateExtPrice: function(product) {
      this.$('#line-item-'+product.get('id')+' .extprice').text(accounting.formatMoney(product.get('price')*product.get('qty')));
    },
    updateProductCount: function(model, value, options) {
      this.$registerDisplay.find('.product-count').html(this.labelizeTemplate({
        label: 'Item Count',
        value: value
      }));
    },
    updateTotal: function(model, value, options) {
      //Update other totals here
      this.$registerDisplay.find('.subtotal').html(this.labelizeTemplate({
        label: 'Subtotal',
        value: accounting.formatMoney(value)
      }));
    },
    //DOM Event Controllers
    createNewTicket: function(e) {
      e.preventDefault();

      var that = this;
      var status = this.ticket.get('status');
      var total = this.ticket.get('total');
      var customer = this.activeCustomer.get('id');

      if(status != 'pos_quote' || customer != 0) {
        if(this.appFrame.checkoutHideSemaphore == 0 && !this.appFrame.modificationsLock) {
          this.ticket.createTicketOnServer(this.employeeSession.get('login'), true);
          $('.customer-search input.tt-query').attr('disabled', false);
        } else {
          alertify.alert("Cannot switch ticket while current ticket is loading or updating. Try again later.", function() {
            that.$searchbox.focus();
          });
        }
      } else {
        that.$searchbox.focus();
      }
    },
    activateScanFocus: function(e) {
      this.$searchbox.focus();
    },
    clearProductSearch: function(e) {
      e.preventDefault();
      this.$searchbox.typeahead('setQuery', '');
      this.$clearSearch.hide();
    },
    itemSelected: function(e, datum) {
      this.$searchbox.typeahead('setQuery', '');
      this.$clearSearch.hide();
      this.addItemToCollection(datum, 1);
    },
    removeLineItem: function(e) {
      e.preventDefault();
      e.stopPropagation(); //Allow propagation to select text box.
      var that = this;
      var name = $('.name', e.currentTarget.parentNode.parentNode).text();
      var packaging = $('.packaging', e.currentTarget.parentNode.parentNode).text();
      var confirm_message = "Are you sure you want to remove '"+name+"'";
      if(packaging) {
        confirm_message += " - "+packaging;
      }
      alertify.confirm(confirm_message, function() {
        that.ticket.removeItem(e.currentTarget.parentNode.parentNode.dataset.id);
      });
    },
    incrementQty: function(e) {
      e.preventDefault();
      //e.stopPropagation();
      var product = this.ticket.get('productCollection').get(e.currentTarget.parentNode.parentNode.dataset.id);
      this.ticket.incrementQty(product, 1);
    },
    decreaseQty: function(e) {
      e.preventDefault();
      //e.stopPropagation();
      var product = this.ticket.get('productCollection').get(e.currentTarget.parentNode.parentNode.dataset.id);
      if(product.get('qty') > 1) {
        this.ticket.decrementQty(product);
      }
    },
    searchKeyUp: function(e) {
      var that = this;
      if(e.target.value == '') {
        this.$clearSearch.hide();
      } else {
        this.$clearSearch.show();
        if(e.keyCode != '37' && e.keyCode != '38' && e.keyCode != '39' && e.keyCode != '40') {
          this.lastSuggestion = e.target.value;
        }
      }

      //Process barcode scan
      if(e.keyCode == '13') {
        var value = e.target.value.trim();

        if(value.charAt(0) == '?') {
          this.findItem(value);

          this.$searchbox.typeahead('setQuery', '');
          this.$clearSearch.hide();
        } else if(value.charAt(0) == '+' || value.charAt(0) == '.') {
          that.$searchbox.blur();
          alertify.alert("Please insert a quantity: i.e. quantity+barcode", function() {
            that.$searchbox.focus();
          });
        } else if(value != '') {
          this.scanItem(value);

          this.$searchbox.typeahead('setQuery', '');
          this.$clearSearch.hide();
        }
      }

      if(e.keyCode == '38' && e.target.value == '' && this.lastSuggestion != '') {
        this.$searchbox.typeahead('setQuery', this.lastSuggestion);
        this.$clearSearch.show();
      }
    },
    //Event handlers for kinectic, to stop typeahead box interfering with drag scroll.
    /*
    panTicket: function() {
      if(this.$searchbox.val() == '') {
        //this.$mouseTrap.css('z-index', 50);
      } else {
        this.stopPanTicket();
        this.activateScanFocus();
      }
    },
    */
    //stopPanTicket: function() {
      //this.$mouseTrap.css('z-index', 0);
    //},
    //mouseTrapRelease: function(e) {
      //this.activateScanFocus();
    //},
    resolveSearchRPC: function(url, uriEncodedQuery) {
      var keyword = this.$searchbox.val().replace(/\//g, '');
      var barcode = new RegExp('^[0-9]+$');

      if(barcode.test(keyword)) {
        return false;
      } else {
        var newurl = url + '?searchQuery=' + encodeURIComponent(keyword);
        return newurl;
      }
    },
    findItem: function(input) {
      var barcode = input.substr(1);
      var products = this.ticket.findItemByBarcode(barcode);
      var that = this;

      if(products.length > 0) {
        _.each(products, function(p, i) {
          var item = this.$('.product-table').find('#line-item-'+p.get('id'));
          if(i == 0) {
            that.$ticketContainer.scrollTop(0);
            that.$ticketContainer.scrollTop(item.position().top);
          }

          item.addClass('item-highlight');
          setTimeout(function() {
            item.removeClass('item-highlight');
          }, 3000);
        });
      } else {
        that.$searchbox.blur();
        alertify.alert("No items could be found for barcode: "+barcode, function() {
          that.$searchbox.focus();
        });
      }
    },
    //Render and demolish logic, and other view methods.
    scanItem: function(barcode) {
      var qty = 1;
      var components = barcode.split('+', 2);
      var that = this;

      if(components[1]) {
        qty = parseInt(components[0]);
        barcode = components[1];
      }

      var scanRequest = JSON.stringify({
        token: this.employeeSession.get("token"),
        barcode: $.trim(barcode)
      });

      var ticket = this;

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
            that.$searchbox.blur();
            alertify.alert("Could not find item with barcode: "+barcode, function() {
              that.$searchbox.focus();
            });
          }
        },
        error: function(xhr, errorType, error) {
          $.jGrowl("Could not connect to the network. Please check connection.");
          //Something is wrong log user out.
          that.employeeSession.set('login', false);
        }
      });
    },
    addItemToCollection: function(datum, qty) {
      //Add Base Product
      var that = this;
      var ticket = this.ticket;
      datum['qty'] = 1;
      datum['activeTicketView'] = this;
      ticket.addItem(datum, function(product) {
        if(qty > 1) {
          ticket.incrementQty(product, qty-1);
        }

        //Scroll to bottom
        that.$ticketContainer.scrollTop(that.$ticketContainer.get(0).scrollHeight);
      });
    },
    render: function() {
      //Render Cascaded Views
      this.activeCustomerView.render();
      this.searchTicketView.render();

      this.$('.item-search').append(this.searchBoxTemplate());
      this.$searchbox = this.$('.item-search input.search');
      this.$clearSearch = this.$('.item-search a.clear-search');

      this.$searchbox.typeahead({
        valueKey: 'id',
        name: 'search-items',
        remote: {
            url: this.employeeSession.get('apiServer')+'/pos-api/products/'+this.employeeSession.get("token"),
            replace: _.bind(this.resolveSearchRPC, this)
        },
        limit: 48,
        hint: false,
        minLength: 3,
        template: _.template($('#item-search-result').html())
      });
    },
    demolish: function() {
       //Demolish Cascaded view
       this.activeCustomerView.demolish();
       this.searchTicketView.demolish();

       this.$('.item-search input.search').typeahead('destroy');
       this.$('.item-search').empty();
       this.ticket.clearTicket();
    },
    printTicket: function() {
      var ticketId = this.ticket.get('ticketId');
      //Print Ticket
      //window.open(this.employeeSession.get('apiServer')+'/admin/invoice/print/'+ticketId+'?token='+this.employeeSession.get("token"));
      $.ajax({
          url: 'http://127.0.0.1:3000/', 
          type: 'POST', 
          contentType: 'application/json', 
          data: JSON.stringify({ticket : this.employeeSession.get('apiServer')+'/admin/invoice/print/'+ticketId+'?token='+this.employeeSession.get("token")}),
          success: function(data) {
            alertify.alert(data);
          },
          error: function() {
            alertify.alert("Failed to send ticket to printer.");
          }
      });
    },
    managerPriceOverride: function(e) {
      this.managerPriceDialog.openDialog(e);
    },
    populateReturnItems: function() {
      //Load another Ticket from database
      var that = this;
      var ticket = this.ticket;
      var loadRMAProductsRequest = JSON.stringify({
                                token: sessionStorage.token,
                                ticketId: ticket.get('ticketId'),
                              });
      //To be moved to the view.
      var product_table = this.$('.product-table');

      ticket.trigger('ticket:preloader', true);
      $.ajax({
          type: 'POST',
          url: that.employeeSession.get('apiServer')+'/pos-api/ticket/rma-products',
          data: {request: loadRMAProductsRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              product_table.append(that.rmaListHeading());
             _.each(res.products, function(product) {
                product_table.append(that.lineItemTemplate(product));
              });

              product_table.append(that.rmaListTotal(res));
            } else {
              //User token is rejected by server server.
              ticket.employeeSession.set('login', false);
            }
            ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            ticket.trigger('ticket:preloader', false);
            //Something is wrong log user out.
            that.employeeSession.set('login', false);
          }
      });
    }
  });
});
