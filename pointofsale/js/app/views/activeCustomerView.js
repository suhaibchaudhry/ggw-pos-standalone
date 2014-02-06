jQuery(function($) {
	activeCustomerView = Backbone.View.extend({
		//Implement ActiveCustomer model, and typeahead customer search.
		tagName: 'div',
		searchBoxTemplate: _.template($('#customer-search-components').html()),
		render: function() {
			this.$('.customer-search').append(this.searchBoxTemplate());
			this.$searchbox = this.$('.item-search input.search');
		},
		demolish: function() {
			//Destroy Typeaheadjs Box
			this.$('.customer-search').empty();
		}
	});
});