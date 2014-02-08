jQuery(function($) {
	activeCustomerView = Backbone.View.extend({
		events: {
			"typeahead:selected .customer-search": 'itemSelected'
		},
		tagName: 'div',
		searchBoxTemplate: _.template($('#customer-search-components').html()),
		defaultUserBadgeTemplate: _.template($('#default-customer-badge').html()),
		selectedCustomerTemplate: _.template($('#selected-customer').html()),
		defaultCustomerTemplate: _.template($('#default-customer').html()),
		defaultCustomerWrapTemplate: _.template($('#default-customer-wrap').html()),
		initialize: function(attributes, options) {
			this.employeeSession = attributes['employeeSession'];
			this.$customer_search = this.$('.customer-search');
			this.activeCustomer = new activeCustomer();
			this.listenTo(this.activeCustomer, 'change:id', this.customerChanged);
		},
		customerChanged: function(model, value, options) {
			if(value) {
				this.$('.selected-customer').html(this.selectedCustomerTemplate(model.attributes));
			} else {
				this.$('.selected-customer').html(this.defaultCustomerTemplate());
			}
		},
		itemSelected: function(e, datum) {
			this.$searchbox.typeahead('setQuery', '');
			this.activeCustomer.set(datum);
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
			//Preprocess URL: Strip forward slashes to make compatible with Drupal GET arg syntax, Decouple later via POST. 
      		var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      		return newurl;
    	},
		render: function() {
			this.$customer_search.append(this.defaultCustomerWrapTemplate());
			this.$('.selected-customer').html(this.defaultCustomerTemplate());

			this.$customer_search.append(this.searchBoxTemplate());
			this.$customer_search.append(this.defaultUserBadgeTemplate());

			this.$searchbox = this.$('.customer-search input.search');

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
		    });
		},
		demolish: function() {
			/*Demolish cannot be called before a render has been called,
			and a render shouldn't be called twice before calling a demolish.*/

			//Destroy Typeaheadjs Box
			this.$searchbox.typeahead('destroy');
			this.$customer_search.empty();
		}
	});
});