jQuery(function($) {
  //Product Model
  ticketProduct = Backbone.Model.extend({

  });

  ticketProductCollection = Backbone.Collection.extend({
    model: ticketProduct
  });
});