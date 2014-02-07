jQuery(function($) {
  //Product Model
  ticketProduct = Backbone.Model.extend({
  	initialize: function(attributes, options) {
      var activeCustomer = this.get('activeTicketView').activeCustomerView.activeCustomer;
  		console.log(activeCustomer.attributes);
      console.log(this.attributes);
      if(activeCustomer.get('id')) {
        //Perform role checks.
        this.set('retail', false);
        this.set('price', this.getRolePrice());
      } else {
        this.set('retail', true);
        this.set('price', attributes['sell_price']);
      }

      //listen on active customer for changing customers.
      this.listenTo(activeCustomer, 'change:id', this.customerChanged);
  	},
    customerHasRole: function(rid) {
      var activeCustomer = this.get('activeTicketView').activeCustomerView.activeCustomer;
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
      var activeCustomer = this.get('activeTicketView').activeCustomerView.activeCustomer;
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
        return this.get('sell_price');
      } else {
        return min_role_price;
      }
    },
    customerChanged: function(model, value, options) {
      if(value) {
        //Perform role checks, listen on active customer for changing roles.
        this.set('retail', false);
        this.set('price', this.getRolePrice());
      } else {
        this.set('retail', true);
        this.set('price', attributes['sell_price']);
      }
    }
  });

  ticketProductCollection = Backbone.Collection.extend({
    model: ticketProduct
  });
});