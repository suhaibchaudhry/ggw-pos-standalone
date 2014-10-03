jQuery(function($) {
	activeInventoryView = Backbone.View.extend({
    	tagName: 'div',
    	searchBoxTemplate: _.template($('#item-search-components').html()),
    	initialize: function(attributes, options) {
    		this.render();
    	},
    	render: function() {
    	  var api_server = "http://test.general-goods.com:7000";
    	  //var api_server = "http://www.general-goods.com";
    	  var tmp_token = "c5f30936df73a4614c83690deb972d483372ce7f";

	      this.$('.item-search').append(this.searchBoxTemplate());
	      this.$searchbox = this.$('.item-search input.search');
	      this.$clearSearch = this.$('.item-search a.clear-search');

	      this.$searchbox.typeahead({
	        valueKey: 'id',
	        name: 'search-items',
	        remote: {
	            url: api_server+'/pos-api/products/'+tmp_token,
	            replace: _.bind(this.resolveSearchRPC, this)
	        },
	        limit: 48,
	        hint: false,
	        minLength: 3,
	        template: _.template($('#item-search-result').html())
	      });
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
	    }
	});
});