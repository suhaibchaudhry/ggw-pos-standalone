jQuery(function($) {
  Ticket = Backbone.Model.extend({
    initialize: function() {
      this.set({
        total: 0,
        productCollection: new ticketProductCollection()
      });

      this.listenTo(this.get('productCollection'), 'add', this.addToTotals);
      this.listenTo(this.get('productCollection'), 'remove', this.subtractFromTotals);
    },
    addToTotals: function(product) {
      this.set('total', this.get('total')+accounting.unformat(product.get('sell_price')));
    },
    incrementQty: function(product) {
      product.set('qty', product.get('qty')+1);
      this.set('total', this.get('total')+accounting.unformat(product.get('sell_price')));
    },
    decrementQty: function(product) {
      product.set('qty', product.get('qty')-1);
      this.set('total', this.get('total')-accounting.unformat(product.get('sell_price')));
    },
    subtractFromTotals: function(product) {
      var product_total = product.get('qty')*accounting.unformat(product.get('sell_price'));
      this.set('total', this.get('total')-product_total);
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