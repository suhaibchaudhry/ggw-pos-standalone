jQuery(function($) {
  //Product Model
  ticketProduct = Backbone.Model.extend({
  	initialize: function(attributes, options) {
  		//Perform role checks, listen on active customer for changing roles.
  		this.set('price', attributes['sell_price']);
  		this.set('retail', true);
  	}
  });

  ticketProductCollection = Backbone.Collection.extend({
    model: ticketProduct
  });
});