jQuery(function($) {
  modifyStockDialog = Backbone.Modal.extend({
    template: function() {
      return this.modifyStockView.template();
    },
    initialize: function(attributes, options) {
      this.modifyStockView = new modifyStockView({
        el: $('.modifyProductStock').get(0),
        api_server: options['api_server'],
        token: options['token'],
        modal: this
      });

      //$('.modifyProductStock').on('click', function(e) {
      //  e.preventDefault();
      //});

      this.token = options['token'];
      this.api_server = options['api_server'];
    },
    beforeCancel: function() {
      return false;
    },
    display: function(state) {
      if(state) {
        $('.modifyProductStock').stop().show().html(this.render().el);
        this.modifyStockView.render();
        //that.focusCash(); - This is done when total is echoed from the server now.
      } else {
        $('.modifyProductStock').stop().fadeOut(function() {
          $(this).empty();
        });
      }
    },
    openDialog: function(productNid, name, packaging, image) {
      var that = this;

      var inventoryRequest = JSON.stringify({
        token: this.token,
        product_nid: productNid
      });

      $.ajax({
        type: 'POST',
        url: this.api_server+'/pos-api/inventory/get-form',
        data: {request: inventoryRequest},
        timeout: 10000,
        success: function(res, status, xhr) {
          if(res.status) {
            that.display(true);
            $('.modifyProductStock .add-to-stock-form').html(res.form_markup);
            $('.modifyProductStock h3.title').html('<div class="title">'+name+'  ...  '+packaging+'</div><div class="thumb"><img src="'+image+'" alt="" /></div>');
            that.productNid = false;
            if(productNid) {
              that.productNid = productNid;
            }
            $('.modifyProductStock .add-to-stock-form').on("submit", _.bind(that.submitStockForm, that));
          }
        },
        error: function(xhr, errorType, error) {
          alert("Could not connect to the network. Please check connection.");
        }
      });
    },
    submitStockForm: function(e) {
      e.preventDefault();
      var vendor = $('#edit-vendor').val();
      var quantity = $('#edit-quantity-purchased').val();
      var unit_cost = $('#edit-unit-cost').val();
      var stock_comment = $('#edit-stock-comment').val();
      var reset = $('#edit-reset').is(':checked');

      if(this.productNid && quantity) {
        var that = this;
        var inventoryPopulateRequest = JSON.stringify({
          token: this.token,
          product_nid: this.productNid,
          quantity_purchased: quantity,
          vendor: vendor,
          unit_cost: unit_cost,
          stock_comment: stock_comment,
          reset: reset
        });

        $.ajax({
          type: 'POST',
          url: this.api_server+'/pos-api/inventory/add-stock',
          data: {request: inventoryPopulateRequest},
          timeout: 10000,
          success: function(res, status, xhr) {
            if(res.status) {
              window.location.reload();
            }
          },
          error: function(xhr, errorType, error) {
            alert("Could not connect to the network. Please check connection.");
          }
        });
      } else {
        alert("Please make sure to set unit cost and quanity.");
      }
    }
  });
});