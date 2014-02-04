jQuery(function($) {
  //Split visible ticket and ticket ui operation in to different views
  activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      "click .line-item a.delete-item": 'removeLineItem',
    },
    //Event Controllers
    itemSelected: function(e, datum) {
      datum['qty'] = 1;
      this.ticket.addItem(datum);
    },
    removeLineItem: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.ticket.removeItem(e.currentTarget.parentNode.parentNode.dataset.id);
    },
    //View Callbacks
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.$registerDisplay = attributes['registerDisplay'];

      this.ticket = new Ticket();
      this.ticketRegionClicked = false;
      this.ticketRegionClickY = 0;
      this.$ticketContainer = this.$('.ticket-container');
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$mouseTrap = this.$('.mousetrap');

      this.listenTo(this.ticket.get('productCollection'), 'add', this.addItem);
      this.listenTo(this.ticket.get('productCollection'), 'remove', this.removeItem);
      this.listenTo(this.ticket.get('productCollection'), 'reset', this.clearTicket);

      this.listenTo(this.ticket, 'change:total', this.updateTotal);
    },
    updateTotal: function(model, value, options) {
      this.$registerDisplay.find('.subtotal').html(this.labelizeTemplate({
        label: 'Subtotal',
        value: accounting.formatMoney(value)
      }));
    },
    addItem: function(model) {
      this.$ticketContainer.find('.product-table').append(this.lineItemTemplate(model.attributes));
    },
    removeItem: function(model) {
      this.$ticketContainer.find('#line-item-'+model.get('id')).remove();
    },
    clearTicket: function() {
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$registerDisplay.find('.calculation').empty();
    },
    searchResultTemplate: _.template($('#item-search-components').html()),
    lineItemTemplate: _.template($('#ticket-line-item').html()),
    labelizeTemplate: _.template($('#labelize-data').html()),
    panTicket: function() {
      this.$mouseTrap.css('z-index', 2);
    },
    stopPanTicket: function() {
      this.$mouseTrap.css('z-index', 0);
    },
    resolveSearchRPC: function(url, uriEncodedQuery) {
      var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      return newurl;
    },
    render: function() {
      this.$('.item-search').append(this.searchResultTemplate());
      this.$searchbox = this.$('.item-search input.search');

      //Avoid re-initialization or figure out how to destroy in demolish, or move a level up in view hiearchy.
      this.$ticketContainer.kinetic({
        moved: _.bind(this.panTicket, this),
        stopped: _.bind(this.stopPanTicket, this)
      });
      
      this.$searchbox.typeahead({
        valueKey: 'name',
        name: 'search-items',
        remote: {
            url: this.employeeSession.get('apiServer')+'/pos-api/products/'+this.employeeSession.get("token"),
            replace: _.bind(this.resolveSearchRPC, this)
        },
        limit: 12,
        template: _.template($('#item-search-result').html())
      });
    },
    demolish: function() {
       this.$('.item-search input.search').typeahead('destroy');
       this.$('.item-search').empty();
       //this.$ticketContainer.kinetic('detach');
       this.ticket.clearTicket();
    }
  });
});