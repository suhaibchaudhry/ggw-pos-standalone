jQuery(function($) {
  //Product Model
  ticketProduct = Backbone.Model.extend({
  	initialize: function(attributes, options) {
      var activeCustomer = this.get('activeTicketView').activeCustomerView.activeCustomer;
  		if(activeCustomer.get('id')) {
        //Perform role checks, listen on active customer for changing roles.
        this.set('retail', false);
        this.set('price', 25);
      } else {
        this.set('retail', true);
        this.set('price', attributes['sell_price']);
      }

      this.listenTo(activeCustomer, 'change:id', this.customerChanged);
  	},
    customerChanged: function(model, value, options) {
      console.log('Changed');
      if(value) {
        //Perform role checks, listen on active customer for changing roles.
        this.set('retail', false);
        this.set('price', 25);
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