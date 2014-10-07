jQuery(function($) {
  //Application Views
  modifyStockView = Backbone.View.extend({
    tagName: 'div',
    className: 'modifyProductStock',
    events: {
      "click a.price-override-cancel": "cancelOverride"
    },
    /*labelizeData: _.template($('#labelize-data').html()),*/
    initialize: function(attributes, option) {
      this.api_server = attributes['api_server'];
      this.token = attributes['token'];
      this.modal = attributes['modal'];
    },
    template: _.template($('#modify-stock-dialog').html()),
    render: function() {
      return this;
    },
    cancelOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});