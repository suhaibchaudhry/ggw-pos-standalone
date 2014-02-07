jQuery(function($) {
	activeCustomerView = Backbone.View.extend({
		//Implement ActiveCustomer model, and typeahead customer search.
		tagName: 'div',
		searchBoxTemplate: _.template($('#customer-search-components').html()),
		initialize: function(attributes, options) {
			this.employeeSession = attributes['employeeSession'];
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
      		var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      		return newurl;
    	},
		render: function() {
			this.$('.customer-search').append(this.searchBoxTemplate());
			this.$searchbox = this.$('.customer-search input.search');

			//Create TypeaheadJs Box
			this.$searchbox.typeahead({
		      valueKey: 'id',
		      name: 'search-customers',
		      remote: {
		         url: this.employeeSession.get('apiServer')+'/pos-api/customers/'+this.employeeSession.get("token"),
		         replace: _.bind(this.resolveSearchRPC, this)
		      },
		      limit: 12,
		      template: _.template($('#customer-search-result').html())
		    });
		},
		demolish: function() {
			//Destroy Typeaheadjs Box
			this.$('.item-search input.search').typeahead('destroy');
			this.$('.customer-search').empty();
		}
	});
});