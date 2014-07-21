jQuery(function($) {
  Ticket = Backbone.Model.extend({
    initialize: function(attributes) {
      this.employeeSession = attributes['employeeSession'];

      this.set({
        productCollection: new ticketProductCollection([],
          {activeCustomer: attributes['activeCustomer'], ticket: this})
      });

      this.set('activeTicketView', attributes['activeTicketView']);
      this.set('activeCustomerView', attributes['activeCustomerView']);
      this.set('updateExtPrice',  _.bind(attributes['activeTicketView'].updateExtPrice, attributes['activeTicketView']));

      this.listenTo(this.get('productCollection'), 'add', this.addToTotals);
      this.listenTo(this.get('productCollection'), 'remove', this.subtractFromTotals);
      this.listenTo(this.get('productCollection'), 'change:price', this.priceUpdate);

      //Make sure to send new quantity to server it has stabalized for a few ms.
      this.listenTo(this.get('productCollection'), 'change:qty', _.debounce(this.changeProductQuantity, 1000));

      //Update Category breakdown
      this.listenTo(this.get('productCollection'), 'change:qty', this.updateCategoryBreakdown);
      this.listenTo(this.get('productCollection'), 'add', this.addToCategoryBreakdown);
      this.listenTo(this.get('productCollection'), 'remove', this.removeFromCategoryBreakdown);

      //Listen for changes in total and product count and update on server
      this.listenTo(this, 'change:total', _.debounce(this.updateTotal, 2000));

      //Listen for changing ticket status on ui to update on server
      this.listenTo(this, 'change:status', this.updateTicketStatus);

      //Load ticket stasuses and product categories on login.
      this.listenTo(this.employeeSession, 'change:login', this.fetchTicketStasuses);

      //Listen for ticket change to load new products.
      this.listenTo(this, 'change:ticketId', this.changeTicketProducts);
    },
    updateCategoryBreakdown: function(product, qty, options) {
      var last_qty = product.previous("qty");

      var categories = this.get('categories');
      var cat = product.get('category');

      if(!cat) {
        cat = 'Misc';
      }

      var count = categories[cat];
      count += qty - last_qty;
      categories[cat] = count;
      this.triggerCategoryBreakdown(categories);
    },
    addToCategoryBreakdown: function(product) {
      var qty = product.get('qty');
      var categories = this.get('categories');
      var cat = product.get('category');
       if(!cat) {
        cat = 'Misc';
      }

      categories[cat] += qty;
      this.triggerCategoryBreakdown(categories);
    },
    removeFromCategoryBreakdown: function(product) {
      var qty = product.get('qty');
      var categories = this.get('categories');
      var cat = product.get('category');
      if(!cat) {
        cat = 'Misc';
      }
      categories[cat] -= qty;
      this.triggerCategoryBreakdown(categories);
    },
    triggerCategoryBreakdown: function(categories) {
      this.set('categories', null);
      this.set('categories', categories);
    },
    resetCategoryBreakdown: function() {
      var categories = this.get('categories');
      for(cat in categories) {
        if(cat) {
          categories[cat] = 0;
        }
      }

      this.triggerCategoryBreakdown(categories);
    },
    fetchTicketStasuses: function(session, login, options) {
      var ticket = this;
      if(login) {
        var getStasuses = JSON.stringify({token: sessionStorage.token});
        //Start preloader
        this.trigger('ticket:preloader', true);
        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket-statuses',
          data: {request: getStasuses},
          timeout: 15000,
          success: function(res, status, xhr) {
            //stop preloader
            ticket.trigger('ticket:preloader', false);
            if(res.status) {
              ticket.set('ticketStasuses', res.stasuses);
              ticket.set('categories', res.categories);
              ticket.set('productCount', 0);
              ticket.set('total', 0);
              //Create a new ticket on server on login
              ticket.createTicketOnServer(login);
            } else {
              ticket.employeeSession.set('login', false);
            }
          },
          error: function(xhr, errorType, error) {
            //stop pre loader and logout user.
            ticket.trigger('ticket:preloader', false);
            ticket.employeeSession.set('login', false);
          }
        });
      } else {
        ticket.set('ticketStasuses', {});
        ticket.set('productCount', 0);
        ticket.set('total', 0);
      }
    },
    createTicketOnServer: function(login) {
      var ticket = this;
      if(login) {
        var last_ticket = this.employeeSession.get('last_ticket');
        var stasuses = ticket.get('ticketStasuses');

        if(last_ticket) {
          ticket.set({
            status: "pos_quote",
            status_en: stasuses[last_ticket.order_status],
            ticketId: 0,
            customerUid: 0
          });

          ticket.set({
            status: last_ticket.order_status,
            status_en: stasuses[last_ticket.order_status],
            ticketId: last_ticket.ticket_id,
            customerUid: last_ticket.uid
          });
        } else {
          var generateNewTicket = JSON.stringify({token: sessionStorage.token});
          //Start preloader
          this.trigger('ticket:preloader', true);
          $.ajax({
            type: 'POST',
            url: this.employeeSession.get('apiServer')+'/pos-api/new-ticket',
            data: {request: generateNewTicket},
            timeout: 15000,
            success: function(res, status, xhr) {
              ticket.trigger('ticket:preloader', false);
              if(res.status) {
                var stasuses = ticket.get('ticketStasuses');
                //Change without silent to populate active customer and ticket products (Empty on create ticket command).
                ticket.set({
                  status: res.ticketStatus,
                  status_en: stasuses[res.ticketStatus],
                  ticketId: res.ticketId,
                  customerUid: res.customerUid
                });
              } else {
                ticket.employeeSession.set('login', false);
              }
            },
            error: function(xhr, errorType, error) {
              //stop pre loader and logout user.
              ticket.trigger('ticket:preloader', false);
              ticket.employeeSession.set('login', false);
            }
          });
        }
      } else {
        ticket.set('ticketId', 0);
      }
    },
    //Detect debounced Updates on ticket totals and product counts on server.
    updateTotal: function(ticket, total, options) {
      var ticket = this;
      var status = ticket.get('status');
      if(status != 'pos_completed' && status != 'pos_return_closed' || !ticket.get('locked')) {
        var updateTotalRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId'), productCount: ticket.get('productCount')});
        //Start preloader
        //this.trigger('ticket:preloader', true);
        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/update-total',
          data: {request: updateTotalRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(!res.status) {
              ticket.employeeSession.set('login', false);
            }
            //ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            //stop pre loader and logout user.
            //ticket.trigger('ticket:preloader', false);
            ticket.employeeSession.set('login', false);
          }
        });
      }
    },
    //Product Collection Event Handlers
    addToTotals: function(product) {
      this.set('total', this.get('total')+(accounting.unformat(product.get('price'))*product.get('qty')));
      this.set('productCount', this.get('productCount')+product.get('qty'));
    },
    subtractFromTotals: function(product) {
      var product_total = product.get('qty')*accounting.unformat(product.get('price'));
      this.set('total', this.get('total')-product_total);
      this.set('productCount', this.get('productCount')-product.get('qty'));
    },
    //Backbone Events
    priceUpdate: function(product, value, options) {
      var total = this.get('total');
      var updateExtPrice = this.get('updateExtPrice');
      updateExtPrice(product);
      total = total - accounting.unformat(product.previous('price'))*product.get('qty');
      total = total + accounting.unformat(product.get('price'))*product.get('qty');
      this.set('total', total);
    },
    //Product Model Methods
    changeTicketProducts: function(ticket, ticketId, options) {
      if(ticketId) {
        //Only removing current ticket products at the moment. Need to still load new ones, and sync current ticket.
        this.get('productCollection').reset();
        //Reset Category breakdown count
        this.resetCategoryBreakdown();
        this.set('total', 0);
        this.set('productCount', 0);
        this.loadTicket(ticketId);
      }
    },
    changeProductQuantity: function(product, qty, options) {
      //Debounce and update product quantity on server.
      var ticket = this;
      var qtyGraph = this.get('productCollection').map(function(item) {
        return {productId: item.get('id'), qty: item.get('qty')};
      });

      var updateQuantityRequest = JSON.stringify({token: sessionStorage.token, qtyGraph: qtyGraph, ticketId: this.get('ticketId')});
      //Start preloader
      //this.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/update-qty',
        data: {request: updateQuantityRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          if(!res.status) {
            ticket.employeeSession.set('login', false);
          }
          //ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
          ticket.employeeSession.set('login', false);
        }
      });
    },
    updateTicketStatus: function(ticket, ticketStatus, options) {
      var ticket = this;
      var updateStatusRequest = JSON.stringify({token: sessionStorage.token, ticketId: this.get('ticketId'), ticketStatus: this.get('status')});

      ticket.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/ticket/update-status',
        data: {request: updateStatusRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          ticket.trigger('ticket:preloader', false);
          if(!res.status) {
            ticket.employeeSession.set('login', false);
          }
        },
        error: function(xhr, errorType, error) {
          ticket.trigger('ticket:preloader', false);
          ticket.employeeSession.set('login', false);
        }
      });
    },
    incrementQty: function(product, increment) {
      product.set('qty', product.get('qty')+increment);
      this.set('total', this.get('total')+(accounting.unformat(product.get('price'))*increment));
      this.set('productCount', this.get('productCount')+increment);

      var updateExtPrice = this.get('updateExtPrice');
      updateExtPrice(product);
    },
    decrementQty: function(product) {
      product.set('qty', product.get('qty')-1);
      this.set('total', this.get('total')-accounting.unformat(product.get('price')));
      this.set('productCount', this.get('productCount')-1);

      var updateExtPrice = this.get('updateExtPrice');
      updateExtPrice(product);
    },
    addItem: function(productAttributes, callback) {
      var ticket = this;
      //Add Item to database
      var addItemToTicketRequest = JSON.stringify({
                              token: sessionStorage.token,
                              ticketId: this.get('ticketId'),
                              productId: productAttributes['id'],
                              name: productAttributes['name'],
                              sku: productAttributes['sku'],
                              price: productAttributes['sell_price']
                            });

      productAttributes['locked'] = false;

      $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/add-product',
          data: {request: addItemToTicketRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              var id = productAttributes['id'];
              productAttributes['id'] = res.ticketProductId;
              var product = ticket.get('productCollection').add(productAttributes);
              productAttributes['id'] = id;
              if(typeof callback == "function") {
                callback(product);
              }
            } else {
              //User token is rejected by server server.
              ticket.employeeSession.set('login', false);
            }
          },
          error: function(xhr, errorType, error) {
            //Something is wrong log user out.
            ticket.employeeSession.set('login', false);
          }
      });
    },
    removeItem: function(productId) {
      this.get('productCollection').remove(productId);
      //Remove Item from database
      var ticket = this;
      var removeTicketItemRequest = JSON.stringify({
                              token: sessionStorage.token,
                              ticketId: this.get('ticketId'),
                              productId: productId
                            });

      $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/remove-product',
          data: {request: removeTicketItemRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(!res.status) {
              //User token is rejected by server server.
              ticket.employeeSession.set('login', false);
            }
          },
          error: function(xhr, errorType, error) {
            //Something is wrong log user out.
            ticket.employeeSession.set('login', false);
          }
      });
    },
    clearTicket: function() {
      //Clear ticket on ui
      this.get('productCollection').reset();
      this.resetCategoryBreakdown();
      this.set('total', 0);
      this.set('productCount', 0);
    },
    emptyTicket: function() {
      //Empty ticket on server and ui use clearTicket
      this.clearTicket();
    },
    loadTicket: function(ticketId) {
      this.get('activeCustomerView').$searchbox.typeahead('setQuery', '');
      //Load another Ticket from database
      var ticket = this;
      var loadTicketProductsRequest = JSON.stringify({
                                token: sessionStorage.token,
                                ticketId: ticketId,
                              });
      this.trigger('ticket:preloader', true);
      $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/load-ticket',
          data: {request: loadTicketProductsRequest},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              _.each(res.products, function(product) {
                product['nid'] = product['id'];
                product['id'] = product['order_product_id'];
                ticket.get('productCollection').add(product);
              });
              if(ticket.get('status') == 'pos_completed') {
                ticket.get('activeTicketView').populateReturnItems();
              }
            } else {
              //User token is rejected by server server.
              ticket.employeeSession.set('login', false);
            }
            ticket.trigger('ticket:preloader', false);
          },
          error: function(xhr, errorType, error) {
            ticket.trigger('ticket:preloader', false);
            //Something is wrong log user out.
            ticket.employeeSession.set('login', false);
          }
      });
    }
  });
});