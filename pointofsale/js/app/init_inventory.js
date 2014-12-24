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
      //Setup Alertify
      alertify.defaults = {
          // dialogs defaults
          modal: true,
          movable: true,
          resizable: true,
          closable: true,
          maximizable: true,
          pinnable: true,
          pinned: true,
          padding: true,
          overflow: true,
          maintainFocus: false,
          transition:'pulse',

          // notifier defaults
          notifier:{
              // auto-dismiss wait time (in seconds)  
              delay: 5,
              // default position
              position:'bottom-right'
          },

          // language resources 
          glossary:{
              // dialogs default title
              title:'General Goods Wholesale',
              // ok button text
              ok: 'OK',
              // cancel button text
              cancel: 'Cancel'
          },

          // theme settings
          theme: {
              // class name attached to prompt dialog input textbox.
              input:'ajs-input',
              // class name attached to ok button
              ok:'ajs-ok',
              // class name attached to cancel button 
              cancel:'ajs-cancel'
          }
      };

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