jQuery(function($) {
  Ticket = Backbone.Model.extend({
    initialize: function(attributes) {
      this.employeeSession = attributes['employeeSession'];

      this.set({
        total: 0,
        productCollection: new ticketProductCollection()
      });

      this.listenTo(this.get('productCollection'), 'add', this.addToTotals);
      this.listenTo(this.get('productCollection'), 'remove', this.subtractFromTotals);

      //Load ticket stasuses
      this.listenTo(this.employeeSession, 'change:login', this.fetchTicketStasuses);
      //Create a new ticket on server on login
      this.listenTo(this.employeeSession, 'change:login', this.createTicketOnServer);
    },
    fetchTicketStasuses: function(session, login, options) {
      var ticket = this;
      if(login) {
        var getStasuses = JSON.stringify({token: sessionStorage.token});

        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/ticket-statuses',
          data: {request: getStasuses},
          timeout: 15000,
          success: function(res, status, xhr) {
            if(res.status) {
              ticket.set('ticketStasuses', res.stasuses);
            } else {
              ticket.employeeSession.set('login', false);
            }
          },
          error: function(xhr, errorType, error) {
            ticket.employeeSession.set('login', false);
          }
        });
      } else {
        ticket.set('ticketStasuses', {});
      }
    },
    createTicketOnServer: function(session, login, options) {
      var ticket = this;
      if(login) {
        var generateNewTicket = JSON.stringify({token: sessionStorage.token});

        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/new-ticket',
          data: {request: generateNewTicket},
          timeout: 15000,
          success: function(res, status, xhr) {
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
            ticket.employeeSession.set('login', false);
          }
        });
      } else {
        ticket.set('ticketId', 0);
      }
    },
    //Product Collection Event Handlers
    addToTotals: function(product) {
      this.set('total', this.get('total')+accounting.unformat(product.get('price')));
    },
    subtractFromTotals: function(product) {
      var product_total = product.get('qty')*accounting.unformat(product.get('price'));
      this.set('total', this.get('total')-product_total);
    },

    //Product Model Methods
    incrementQty: function(product, increment) {
      product.set('qty', product.get('qty')+increment);
      this.set('total', this.get('total')+(accounting.unformat(product.get('price'))*increment));
    },
    decrementQty: function(product) {
      product.set('qty', product.get('qty')-1);
      this.set('total', this.get('total')-accounting.unformat(product.get('price')));
    },
    addItem: function(productAttributes) {
      this.get('productCollection').add(productAttributes);
      //Add Item to database
    },
    removeItem: function(productId) {
      this.get('productCollection').remove(productId);
      //Remove Item from database
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
    loadTicket: function() {
      //Load another Ticket from database
    },
    unloadTicket: function() {
      //Unload current ticket from client
    }
  });
});