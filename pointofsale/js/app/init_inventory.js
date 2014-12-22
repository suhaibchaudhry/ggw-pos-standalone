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
      this.preloaderSemaphore = 0;
      this.activeInventoryRegion = new activeInventoryView({
        appFrame: this,
        el: $('div.activeInventory')
      });

      $('.loaderOverlay a.refresh').on('click', _.bind(this.reload, this));
  	},
    reload: function(e) {
      e.preventDefault();
      location.reload();
    },
    inventoryPreloader: function(preloader) {
      if(preloader) {
        this.preloaderSemaphore = this.preloaderSemaphore+1;
      } else {
        this.preloaderSemaphore = this.preloaderSemaphore-1;
      }

      if(this.preloaderSemaphore > 0) {
        $('.loaderOverlay').show();
      } else {
        $('.loaderOverlay').hide();
      }
    }
  });

  var appBootstrap = function() {
  	var app = new applicationFrame({
  		el: $('div.inventory-manager').get(0)
  	});
  }

  appBootstrap();
});