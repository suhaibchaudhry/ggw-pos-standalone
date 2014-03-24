jQuery(function($) {
	rmaTicket = Backbone.Model.extend({
		labelizeTemplate: _.template($('#labelize-data').html()),
		initialize: function(attributes, options) {
			this.set({
				dialog: attributes["dialog"],
				rmaItemsCollection: attributes["rmaItemsCollection"],
				total: attributes["total"]
			});

			this.listenTo(this, "change:total", this.renderTotal);
		},
		renderTotal: function(model, value) {
			this.get('dialog').$('.return-summary').html(this.labelizeTemplate({
				label: 'Refund Total',
				value: accounting.formatMoney(value)
			}));
		}
	});
});