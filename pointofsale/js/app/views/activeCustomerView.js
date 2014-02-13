jQuery(function($) {
	activeCustomerView = Backbone.View.extend({
		events: {
			"typeahead:selected .customer-search": 'itemSelected',
			"click .customer-search a.clear-customer": 'clearCustomer'
		},
		tagName: 'div',
		searchBoxTemplate: _.template($('#customer-search-components').html()),
		defaultUserBadgeTemplate: _.template($('#default-customer-badge').html()),
		selectedCustomerTemplate: _.template($('#selected-customer').html()),
		defaultCustomerTemplate: _.template($('#default-customer').html()),
		defaultCustomerWrapTemplate: _.template($('#default-customer-wrap').html()),
		initialize: function(attributes, options) {
			this.employeeSession = attributes['employeeSession'];
			this.activeCustomer = new activeCustomer();
			this.listenTo(this.activeCustomer, 'change:id', this.customerChanged);
		},
		clearCustomer: function(e) {
			e.preventDefault();
			this.activeCustomer.set('id', false);
			this.activeCustomer.updateTicketCustomerUidOnServer(0);
		},
		customerChanged: function(model, value, options) {
			if(value) {
				this.$('.selected-customer').html(this.selectedCustomerTemplate(model.attributes));
				this.$customer_search.find('a.clear-customer').show();
			} else {
				this.$('.selected-customer').html(this.defaultCustomerTemplate());
				this.$customer_search.find('a.clear-customer').hide();
			}
		},
		itemSelected: function(e, datum) {
			this.$searchbox.typeahead('setQuery', '');
			this.activeCustomer.set(datum);
			this.activeCustomer.updateTicketCustomerUidOnServer(datum['id']);
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
			//Preprocess URL: Strip forward slashes to make compatible with Drupal GET arg syntax, Decouple later via POST. 
      		var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      		return newurl;
    	},
		render: function() {
			this.$customer_search = this.$('.customer-search');
			this.$customer_search.append(this.defaultCustomerWrapTemplate());
			this.$('.selected-customer').html(this.defaultCustomerTemplate());
			this.$customer_search.find('a.clear-customer').hide();			

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
			this.$('.customer-search input.search').typeahead('destroy');
			this.$('.customer-search').empty();
		}
	});
});