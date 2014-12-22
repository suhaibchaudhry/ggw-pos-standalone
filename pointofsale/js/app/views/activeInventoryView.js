jQuery(function($) {

	activeInventoryView = Backbone.View.extend({
    	tagName: 'div',
    	events: {
    		"keyup .item-search input.search": 'searchKeyUp',
    		"click .item-search a.clear-search": 'clearProductSearch',
    		"typeahead:selected .item-search": 'itemSelected',
    		"click .inventory-item": 'inventoryItemSelected',
    		"click .item-pagination ul li a": 'changeInventoryPage'
    	},
    	searchBoxTemplate: _.template($('#item-search-components').html()),
    	inventoryOutterTemplate: _.template($('#inventory-line-item-heading').html()),
    	paginationTemplate: _.template($('#pagination-template').html()),
    	initialize: function(attributes, options) {
    		var data = JSON.parse(decodeURIComponent(this.getUrlVars()['data']));

    		this.api_server = data.api_server;
    		this.token = data.token;

    		this.modifyStockDialog = new modifyStockDialog({}, {api_server: this.api_server, token: this.token});

    		this.render();
    		this.focusSearch();
    		$('.app-wrap').on('click', _.bind(this.focusSearch, this));
    	},
    	getUrlVars: function() {
		    var vars = {};
		    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
		        vars[key] = value;
		    });

		    return vars;
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
	        barcode: $.trim(barcode)
	      });

	      var ticket = this;

	      $.ajax({
	        type: 'POST',
	        url: this.api_server+'/pos-api/product-scan',
	        data: {request: scanRequest},
	        timeout: 10000,
	        success: function(res, status, xhr) {
	          if(res.scan) {
	          	that.modifyStockDialog.openDialog(res.product.id, res.product.name, res.product.packaging, res.product.thumbnail);
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
	    loadInventoryEntries: function(currentPage) {
	      if(typeof currentPage == "undefined") {
	      	currentPage = '1';
	      }

	      var inventoryRequest = JSON.stringify({
	        token: this.token
	      });
	      var that = this;

	      $.ajax({
	        type: 'POST',
	        url: this.api_server+'/pos-api/inventory/list?page='+currentPage,
	        data: {request: inventoryRequest},
	        timeout: 10000,
	        success: function(res, status, xhr) {
	          that.loadInventoryList(res.inventory_list, res.total_pages, currentPage);
	        },
	        error: function(xhr, errorType, error) {
	          alert("Could not connect to the network. Please check connection.");
	        }
	      });
	    },
	    loadInventoryList: function(inventoryList, total_pages, currentPage) {
	    	var that = this;
	    	var $container = this.$('.ticket-container');
	    	$container.empty().append(this.paginationTemplate({total_pages: total_pages, currentPage: currentPage}));
	    	$.each(inventoryList, function(key, e) {
	    		that.getItemByNid(key, e);
	    	});
	    	$container.append(this.paginationTemplate({total_pages: total_pages, currentPage: currentPage}));
	    	$container.scrollTop(0);
	    },
	    itemSelected: function(e, datum) {
	    	this.$searchbox.typeahead('setQuery', '');
	    	this.$clearSearch.hide();
	    	this.modifyStockDialog.openDialog(datum['id'], datum['name'], datum['packaging'], datum['thumbnail']);
	    },
	    inventoryItemSelected: function(e) {
	    	this.modifyStockDialog.openDialog(e.currentTarget.dataset.productNid, e.currentTarget.dataset.productName, e.currentTarget.dataset.productPackaging, e.currentTarget.dataset.productImage);
	    },
	    getItemByNid: function(key, element) {
	      this.$('.ticket-container').append(this.inventoryOutterTemplate({nid: element.product_nid, product: element.product, log_events: element.event_logs}));
	    },
	    changeInventoryPage: function(e) {
	    	e.preventDefault();
	    	e.stopPropagation();
	    	this.loadInventoryEntries(e.currentTarget.dataset.pageNum);
	    }
	});
});