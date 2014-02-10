jQuery(function($) {
	searchTicketView = Backbone.View.extend({
		/*
		events: {
			"typeahead:selected .customer-search": 'itemSelected',
			"click .customer-search a.clear-customer": 'clearCustomer'
		},
		*/
		tagName: 'div',
		searchBoxTemplate: _.template($('#ticket-search-components').html()),
		ticketSearchBadge: _.template($('#ticket-search-badge').html()),
		initialize: function(attributes, options) {
			this.employeeSession = attributes['employeeSession'];
		},
		/*
		itemSelected: function(e, datum) {
			this.$searchbox.typeahead('setQuery', '');
			this.activeCustomer.set(datum);
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
			//Preprocess URL: Strip forward slashes to make compatible with Drupal GET arg syntax, Decouple later via POST. 
      		var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      		return newurl;
    	},*/
		render: function() {
			this.$ticket_search = this.$('.ticket-search');	
			this.$ticket_search.append(this.searchBoxTemplate());
			this.$ticket_search.append(this.ticketSearchBadge());
			//this.$searchbox = this.$('.customer-search input.search');

			/*
			//Create TypeaheadJs Box
			this.$searchbox.typeahead({
		      valueKey: 'id',
		      name: 'search-customers',
		      remote: {
		         url: this.employeeSession.get('apiServer')+'/pos-api/customers/'+this.employeeSession.get("token"),
		         replace: _.bind(this.resolveSearchRPC, this)
		      },
		      limit: 8,
		      template: _.template($('#customer-search-result').html())
		    });*/
		},
		demolish: function() {
			this.$('.ticket-search').empty();
		}
	});
});