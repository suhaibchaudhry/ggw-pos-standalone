jQuery(function($) {
  //Application Views
  managerPriceView = Backbone.View.extend({
    tagName: 'div',
    className: 'managerPrice',
    events: {
      "click a.price-override-cancel": "cancelOverride",
      "click a.price-override-continue": "continueOverride"
    },
    initialize: function(attributes, option) {
      this.employeeSession = attributes['employeeSession'];
      this.modal = attributes['modal'];
    },
    template: _.template($('#manager-price-modal').html()),
    render: function() {
      return this;
    },
    openDialog: function() {
      this.modal.display(true);
    },
    cancelOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    continueOverride: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});