jQuery(function($) {
  //Product Model
  ticketProduct = Backbone.Model.extend({
  	initialize: function(attributes, options) {
      var activeCustomer = options['collection'].activeCustomer;
      var ticket = options['collection'].ticket;

      this.set('activeCustomer', activeCustomer);
      this.set('ticket', ticket);
      this.set('retail', true);
      //Set last price before triggering price change to subtract from totals.
      //this.set('last_price', this.get('price'));
      if(attributes['local_price_set'] && activeCustomer.get('id') && ticket.get('status') != 'pos_return_closed' && ticket.get('status') != 'pos_completed') {
        //Perform role checks, and set the smallest price for current user.
        this.set('price', this.getRolePrice());
      } else {
        //Set products price to default sellprice received from server.
        this.set('price', attributes['sell_price']);
      }

      var price = this.get('manager_price');
      if(price) {
        this.set('price', price);
      }

      //listen on active customer for changing customer ids on customer singleton, so we can update the price.
      this.listenTo(activeCustomer, 'change:id', this.customerChanged);
  	},
    customerChanged: function(model, customer_id, options) {
      //this.set('last_price', this.get('price'));
      var price = this.get('manager_price');
      var ticket = this.get('ticket');
      if(price) {
        this.set('price', price);
      } else if(customer_id && ticket.get('status') != 'pos_return_closed' && ticket.get('status') != 'pos_completed') {
        //Perform role checks, listen on active customer for changing roles.
        this.set('price', this.getRolePrice());
      } else {
        //Walk-in User
        this.set('retail', true);
        this.set('price', this.get('sell_price'));
      }
    },
    customerHasRole: function(rid) {
      //Check whether a customer has a given role, given a rid.
      var activeCustomer = this.get('activeCustomer');
      var product = this;
      var roleExists = false;
      _.each(activeCustomer.get('roles'), function(role) {
        if(role == rid) {
          roleExists = true;
          return false;
        }
      });

      return roleExists;
    },
    getRolePrice: function() {
      var activeCustomer = this.get('activeCustomer');
      var roles = activeCustomer.get('roles');
      var min_role_price = 0;
      var product = this;
      _.each(this.get('special_prices'), function(spo) {
        if(product.customerHasRole(spo.role)) {
          var price = accounting.unformat(spo.price);
          if(min_role_price == 0 || price < min_role_price) {
            min_role_price = price;
          }
        }
      });

      if(min_role_price == 0) {
        //return the default sell price
        this.set('retail', true);
        return this.get('sell_price');
      } else {
        //Return special role based price
        this.set('retail', false);
        if(this.attributes['local_price_set']) {
          return min_role_price;
        } else {
          return this.get('sell_price');
        }
      }
    }
  });

  //Product Collection
  ticketProductCollection = Backbone.Collection.extend({
    model: ticketProduct,
    initialize: function(models, options) {
      this.activeCustomer = options['activeCustomer'];
      this.ticket = options['ticket'];
    }
  });
});