jQuery(function($) {
  //Split visible ticket and ticket ui operation in to different views
  activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      //Move to product line item view
      "click .line-item a.delete-item": 'removeLineItem',
      "click .line-item .qty a.increase": 'incrementQty',
      "click .line-item .qty a.decrease": 'decreaseQty',
      "click": 'activateScanFocus'
    },
    activateScanFocus: function(e) {
      this.$searchbox.focus();
    },
    //Event Controllers
    itemSelected: function(e, datum) {
      var product = this.ticket.get('productCollection').get(datum['id']);
      this.$searchbox.val('');
      if(product) {
        this.ticket.incrementQty(product);
      } else {
        datum['qty'] = 1;
        this.ticket.addItem(datum);
      }
    },
    removeLineItem: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.ticket.removeItem(e.currentTarget.parentNode.parentNode.dataset.id);
    },
    incrementQty: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var product = this.ticket.get('productCollection').get(e.currentTarget.parentNode.parentNode.dataset.id);
      this.ticket.incrementQty(product);
    },
    decreaseQty: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var product = this.ticket.get('productCollection').get(e.currentTarget.parentNode.parentNode.dataset.id);
      if(product.get('qty') > 1) {
        this.ticket.decrementQty(product);
      }
    },
    changeQuantyDisplay: function(product, qty, options) {
      this.$('#line-item-'+product.id+' .qty span.value').text(qty);
    },
    //View Callbacks
    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.$registerDisplay = attributes['registerDisplay'];
      this.activeCustomerView = attributes['activeCustomerView'];

      this.ticket = new Ticket();
      this.ticketRegionClicked = false;
      this.ticketRegionClickY = 0;
      this.$ticketContainer = this.$('.ticket-container');
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$mouseTrap = this.$('.mousetrap');

      //Avoided re-initialization
      this.$ticketContainer.kinetic({
        moved: _.bind(this.panTicket, this),
        stopped: _.bind(this.stopPanTicket, this)
      });

      this.listenTo(this.ticket.get('productCollection'), 'add', this.addItem);
      this.listenTo(this.ticket.get('productCollection'), 'remove', this.removeItem);
      this.listenTo(this.ticket.get('productCollection'), 'reset', this.clearTicket);

      this.listenTo(this.ticket.get('productCollection'), 'change:qty', this.changeQuantyDisplay);

      this.listenTo(this.ticket, 'change:total', this.updateTotal);
    },
    updateTotal: function(model, value, options) {
      //Update other totals here
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
    searchBoxTemplate: _.template($('#item-search-components').html()),
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
      this.activeCustomerView.render();
      this.$('.item-search').append(this.searchBoxTemplate());
      this.$searchbox = this.$('.item-search input.search');
      
      this.$searchbox.typeahead({
        valueKey: 'id',
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
       this.activeCustomerView.demolish();
       this.$('.item-search input.search').typeahead('destroy');
       this.$('.item-search').empty();
       this.ticket.clearTicket();
    }
  });
});