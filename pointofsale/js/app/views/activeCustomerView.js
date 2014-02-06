jQuery(function($) {
	activeCustomerView = Backbone.View.extend({
		//Implement ActiveCustomer model, and typeahead customer search.
		tagName: 'div',
		searchBoxTemplate: _.template($('#customer-search-components').html()),
		render: function() {
			this.$('.customer-search').append(this.searchBoxTemplate());
		},
		demolish: function() {

		}
	});
});