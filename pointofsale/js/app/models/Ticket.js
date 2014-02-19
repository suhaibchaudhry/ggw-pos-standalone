jQuery(function($) {
  Ticket = Backbone.Model.extend({
    initialize: function(attributes) {
      this.employeeSession = attributes['employeeSession'];

      this.set({
        total: 0,
        productCount: 0,
        productCollection: new ticketProductCollection([],
          {activeCustomer: attributes['activeCustomer']})
      });

      this.listenTo(this.get('productCollection'), 'add', this.addToTotals);
      this.listenTo(this.get('productCollection'), 'remove', this.subtractFromTotals);
      this.listenTo(this.get('productCollection'), 'change:price', this.priceUpdate);
      //Make sure to send new quantity to server it has stabalized for a few ms.
      this.listenTo(this.get('productCollection'), 'change:qty', _.debounce(this.changeProductQuanty, 500));
      //Load ticket stasuses
      this.listenTo(this.employeeSession, 'change:login', this.fetchTicketStasuses);

      //Listen ticket change to load new products.
      this.listenTo(this, 'change:ticketId', this.changeTicketProducts);
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
      }
    },
    createTicketOnServer: function(login) {
      var ticket = this;
      if(login) {
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
      } else {
        ticket.set('ticketId', 0);
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
      total = total - accounting.unformat(product.get('last_price'))*product.get('qty');
      total = total + accounting.unformat(product.get('price'))*product.get('qty');
      this.set('total', total);
    },
    //Product Model Methods
    changeTicketProducts: function(ticket, ticketId, options) {
      if(ticketId) {
        //Only removing current ticket products at the moment. Need to still load new ones, and sync current ticket.
        this.get('productCollection').reset();
        this.set('total', 0);
        this.set('productCount', 0);
        this.loadTicket(ticketId);
      }
    },
    changeProductQuanty: function(product, qty, options) {
      //Debounce and update product quantity on server.
      var ticket = this;
      var updateQuantityRequest = JSON.stringify({token: sessionStorage.token, qty: qty, ticketId: this.get('ticketId'), productId: product.get('id')});
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
    incrementQty: function(product, increment) {
      product.set('qty', product.get('qty')+increment);
      this.set('total', this.get('total')+(accounting.unformat(product.get('price'))*increment));
      this.set('productCount', this.get('productCount')+increment);
    },
    decrementQty: function(product) {
      product.set('qty', product.get('qty')-1);
      this.set('total', this.get('total')-accounting.unformat(product.get('price')));
      this.set('productCount', this.get('productCount')-1);
    },
    addItem: function(productAttributes) {
      var ticket = this;
      var product = this.get('productCollection').add(productAttributes);
      //Add Item to database
      var addItemToTicketRequest = JSON.stringify({
                              token: sessionStorage.token,
                              ticketId: this.get('ticketId'),
                              productId: productAttributes['id'],
                              name: productAttributes['name'],
                              sku: productAttributes['sku'],
                              price: product.get('price')
                            });

      $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket/add-product',
          data: {request: addItemToTicketRequest},
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
      this.set('total', 0);
    },
    emptyTicket: function() {
      //Empty ticket on server and ui use clearTicket
      this.clearTicket();
    },
    deleteTicket: function() {
      //Delete ticket and clear on ui

    },
    loadTicket: function(ticketId) {
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
                ticket.get('productCollection').add(product);
              });
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
    },
    unloadTicket: function() {
      //Unload current ticket from client
    }
  });
});