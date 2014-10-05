jQuery(function($) {

	activeInventoryView = Backbone.View.extend({
    	tagName: 'div',
    	events: {
    		"keyup .item-search input.search": 'searchKeyUp',
    		"click .item-search a.clear-search": 'clearProductSearch',
    		"typeahead:selected .item-search": 'itemSelected'
    	},
    	searchBoxTemplate: _.template($('#item-search-components').html()),
    	inventoryOutterTemplate: _.template($('#inventory-line-item-heading').html()),
    	initialize: function(attributes, options) {
    		this.api_server = "http://test.general-goods.com:7000";
    		this.token = "c5f30936df73a4614c83690deb972d483372ce7f";

    		this.render();
    		this.focusSearch();
    		$('body').on('click', _.bind(this.focusSearch, this));
    	},
    	focusSearch: function() {
    		this.$el.find('input.search').focus();
    	},
    	render: function() {
	      this.$('.item-search').append(this.searchBoxTemplate());
	      this.$searchbox = this.$('.item-search input.search');
	      this.$clearSearch = this.$('.item-search a.clear-search');

	      this.$searchbox.typeahead({
	        valueKey: 'id',
	        name: 'search-items',
	        remote: {
	            url: this.api_server+'/pos-api/products/'+this.token,
	            replace: _.bind(this.resolveSearchRPC, this)
	        },
	        limit: 48,
	        hint: false,
	        minLength: 3,
	        template: _.template($('#item-search-result').html())
	      });

	      this.loadInventoryEntries();
	    },
	    resolveSearchRPC: function(url, uriEncodedQuery) {
	      var keyword = this.$searchbox.val().replace(/\//g, '');
	      var barcode = new RegExp('^[0-9]+$');

	      if(barcode.test(keyword)) {
	        return false;
	      } else {
	        var newurl = url + '?searchQuery=' + encodeURIComponent(keyword);
	        return newurl;
	      }
	    },
	    searchKeyUp: function(e) {
	      if(e.target.value == '') {
	        this.$clearSearch.hide();
	      } else {
	        this.$clearSearch.show();
	        if(e.keyCode != '37' && e.keyCode != '38' && e.keyCode != '39' && e.keyCode != '40') {
	          this.lastSuggestion = e.target.value;
	        }
	      }

	      //Process barcode scan
	      if(e.keyCode == '13') {
	        var value = e.target.value.trim();

	        if(value != '') {
	          this.scanItem(value);

	          this.$searchbox.typeahead('setQuery', '');
	          this.$clearSearch.hide();
	        }
	      }

	      if(e.keyCode == '38' && e.target.value == '' && this.lastSuggestion != '') {
	        this.$searchbox.typeahead('setQuery', this.lastSuggestion);
	        this.$clearSearch.show();
	      }
	    },
	    clearProductSearch: function(e) {
	      e.preventDefault();
	      this.$searchbox.typeahead('setQuery', '');
	      this.$clearSearch.hide();
	    },
	    //Render and demolish logic, and other view methods.
	    scanItem: function(barcode) {
	      var qty = 1;
	      var that = this;

	      var scanRequest = JSON.stringify({
	        token: this.token,
	        barcode: barcode
	      });

	      var ticket = this;

	      $.ajax({
	        type: 'POST',
	        url: this.api_server+'/pos-api/product-scan',
	        data: {request: scanRequest},
	        timeout: 10000,
	        success: function(res, status, xhr) {
	          if(res.scan) {
	          	console.log(res.product);
	          } else {
	            //$.jGrowl("Could not find item with barcode: <strong>"+barcode+"</strong>");
	            alert("Could not find item with barcode: "+barcode);
	          }
	        },
	        error: function(xhr, errorType, error) {
	          alert("Could not connect to the network. Please check connection.");
	        }
	      });

	      this.$searchbox.typeahead('setQuery', '');
	    },
	    loadInventoryEntries: function() {
	      var inventoryRequest = JSON.stringify({
	        token: this.token
	      });
	      var that = this;

	      $.ajax({
	        type: 'POST',
	        url: this.api_server+'/pos-api/inventory/list',
	        data: {request: inventoryRequest},
	        timeout: 10000,
	        success: function(res, status, xhr) {
	          that.loadInventoryList(res.inventory_list);
	        },
	        error: function(xhr, errorType, error) {
	          alert("Could not connect to the network. Please check connection.");
	        }
	      });
	    },
	    loadInventoryList: function(inventoryList) {
	    	var that = this;
	    	$.each(inventoryList, function(key, e) {
	    		that.getItemByNid(key, e);
	    		console.log(key);
	    		console.log(e);
	    	});
	    },
	    itemSelected: function(e, datum) {
	    	this.$searchbox.typeahead('setQuery', '');
	    	this.$clearSearch.hide();
	    	console.log(datum);
	    },
	    getItemByNid: function(nid, log_events) {
	      var itemRequestByNid = JSON.stringify({
	        token: this.token,
	        product_nid: nid
	      });

	      var that = this;

	      $.ajax({
	        type: 'POST',
	        url: this.api_server+'/pos-api/inventory/lookup',
	        data: {request: itemRequestByNid},
	        timeout: 10000,
	        success: function(res, status, xhr) {
	          console.log(res);
	          that.$('.ticket-container').append(that.inventoryOutterTemplate({nid: nid, product: res.product, log_events: log_events}));
	        },
	        error: function(xhr, errorType, error) {
	          alert("Could not connect to the network. Please check connection.");
	        }
	      });
	    }
	});
});