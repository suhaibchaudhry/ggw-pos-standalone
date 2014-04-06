jQuery(function($) {
  activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      "click .line-item a.delete-item": 'removeLineItem',
      "click .line-item .qty a.increase": 'incrementQty',
      "click .line-item .qty a.decrease": 'decreaseQty',
      "click .item-search a.clear-search": 'clearProductSearch',
      "mouseup .mousetrap": 'mouseTrapRelease',
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
        activeTicketView: this
      });

      //Initialize Checkout Dialog
      this.checkoutDialogModal = new checkoutDialogModal({activeCustomer: this.activeCustomer, ticket: this.ticket});

      //Initialize Customer Info Dialog
      this.customerInfoDialogModal = new customerInfoDialogModal({activeCustomer: this.activeCustomer, employeeSession: this.employeeSession, ticket: this.ticket});
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
      this.$mouseTrap = this.$('.mousetrap');

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
      this.$ticketContainer.find('.product-table').append(this.lineItemTemplate(product.attributes));
      if(product.get('retail')) {
        this.$('#line-item-'+product.id+' .price').html(accounting.formatMoney(product.get('price')));
      } else {
        this.$('#line-item-'+product.id+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }
    },
    removeItem: function(model) {
      this.$ticketContainer.find('#line-item-'+model.get('id')).remove();
    },
    clearTicket: function() {
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      //this.$registerDisplay.find('.calculation').empty();
    },
    changeQuantyDisplay: function(product, qty, options) {
      this.$('#line-item-'+product.id+' .qty span.value').text(qty);
    },
    priceUpdate: function(product, value, options) {
      //Update physical view price of an item when price changes on product model.
      if(product.get('retail')) {
        this.$('#line-item-'+product.id+' .price').html(accounting.formatMoney(product.get('price')));
      } else {
        this.$('#line-item-'+product.id+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }
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
      var status = this.ticket.get('status');
      var total = this.ticket.get('total');
      var customer = this.activeCustomer.get('id');

      if(status != 'pos_quote' || total != 0 || customer != 0) {
        this.ticket.createTicketOnServer(this.employeeSession.get('login'));
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
      //e.stopPropagation(); //Allow propagation to select text box.
      this.activateScanFocus();
      this.ticket.removeItem(e.currentTarget.parentNode.parentNode.dataset.id);
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
      if(e.target.value == '') {
        this.$clearSearch.hide();
      } else {
        this.$clearSearch.show();
      }

      //Process barcode scan
      if(e.keyCode == 13) {
        var value = e.target.value.trim();
        if(value.charAt(0) == '+') {
          alert("Please insert a quantity: i.e. quantity+barcode");
        } else if(value != '') {
          this.scanItem(value);

          this.$searchbox.typeahead('setQuery', '');
          this.$clearSearch.hide();
        }
      }
    },
    //Event handlers for kinectic, to stop typeahead box interfering with drag scroll.
    panTicket: function() {
      this.$mouseTrap.css('z-index', 50);
    },
    stopPanTicket: function() {
      this.$mouseTrap.css('z-index', 0);
    },
    mouseTrapRelease: function(e) {
      this.activateScanFocus();
    },
    resolveSearchRPC: function(url, uriEncodedQuery) {
      var keyword = this.$searchbox.val().replace(/\//g, '');
      var barcode = new RegExp('^[0-9]+$');

      if(barcode.test(keyword)) {
        return false;
      } else {
        var newurl = url + '/' + encodeURIComponent(keyword);
        return newurl;
      }
    },

    //Render and demolish logic, and other view methods.
    scanItem: function(barcode) {
      var qty = 1;
      var components = barcode.split('+', 2);

      if(components[1]) {
        qty = parseInt(components[0]);
        barcode = components[1];
      }

      var scanRequest = JSON.stringify({
        token: this.employeeSession.get("token"),
        barcode: barcode
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
            alert("Could not find item with barcode: "+barcode);
          }
        },
        error: function(xhr, errorType, error) {
          $.jGrowl("Could not find item with barcode: <strong>"+barcode+"</strong>");
        }
      });
    },
    addItemToCollection: function(datum, qty) {
      var product = this.ticket.get('productCollection').get(datum['id']);
      if(product) {
        this.ticket.incrementQty(product, qty);
      } else {
        //Add Base Product
        datum['qty'] = 1;
        datum['activeTicketView'] = this;
        this.ticket.addItem(datum);

        if(qty > 1) {
          //Increment product by remaining value
          var product = this.ticket.get('productCollection').get(datum['id']);
          this.ticket.incrementQty(product, qty-1);
        }
      }
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
        limit: 12,
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
      window.open(this.employeeSession.get('apiServer')+'/admin/invoice/print/'+ticketId+'?token='+this.employeeSession.get("token"));
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

      this.trigger('ticket:preloader', true);
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