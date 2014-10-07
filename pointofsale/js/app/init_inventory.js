jQuery(function($) {
  var applicationFrame = Backbone.View.extend({
  	tagName: 'div',
    events: {
      'click .exit-app': 'closeApp'
    },
    closeApp: function(e) {
      e.preventDefault();
      window.close();
    },
  	initialize: function() {
      this.activeInventoryRegion = new activeInventoryView({
        appFrame: this,
        el: $('div.activeInventory')
      });
  	}
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.inventory-manager').get(0)
  	});
  }

  appBootstrap();
});