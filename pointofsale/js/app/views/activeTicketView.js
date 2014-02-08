jQuery(function($) {
  activeTicketView = Backbone.View.extend({
    tagName: 'div',
    events: {
      "typeahead:selected .item-search": 'itemSelected',
      "click .line-item a.delete-item": 'removeLineItem',
      "click .line-item .qty a.increase": 'incrementQty',
      "click .line-item .qty a.decrease": 'decreaseQty',
      "click": 'activateScanFocus'
    },
    //Ticket Templates
    searchBoxTemplate: _.template($('#item-search-components').html()),
    lineItemTemplate: _.template($('#ticket-line-item').html()),
    labelizeTemplate: _.template($('#labelize-data').html()),
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

      this.listenTo(this.ticket.get('productCollection'), 'add', this.addItem);
      this.listenTo(this.ticket.get('productCollection'), 'remove', this.removeItem);
      this.listenTo(this.ticket.get('productCollection'), 'reset', this.clearTicket);

      this.listenTo(this.ticket.get('productCollection'), 'change:qty', this.changeQuantyDisplay);
      this.listenTo(this.ticket.get('productCollection'), 'change:price', this.priceUpdate);

      this.listenTo(this.ticket, 'change:total', this.updateTotal);
    },

    //Backbone Event Handlers
    addItem: function(product) {
      this.$ticketContainer.find('.product-table').append(this.lineItemTemplate(product.attributes));
      if(product.get('retail')) {
        this.$('#line-item-'+product.id+' .price').html(accounting.formatMoney(product.get('price')));
      } else {
        this.$('#line-item-'+product.id+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }
    },
    removeItem: function(model) {
      this.$ticketContainer.find('#line-item-'+model.get('id')).remove();
    },
    clearTicket: function() {
      this.$ticketContainer.get(0).innerHTML = '<div class="product-table">'+$("#ticket-line-item-heading").html()+'</div>';
      this.$registerDisplay.find('.calculation').empty();
    },
    changeQuantyDisplay: function(product, qty, options) {
      this.$('#line-item-'+product.id+' .qty span.value').text(qty);
    },
    priceUpdate: function(product, value, options) {
      //Update physical view price of item.
      if(product.get('retail')) {
        this.$('#line-item-'+product.id+' .price').html(accounting.formatMoney(product.get('price')));
      } else {
        this.$('#line-item-'+product.id+' .price').html('<span class="orig">'+accounting.formatMoney(product.get('sell_price'))+'</span>'+'<span class="special">'+accounting.formatMoney(product.get('price'))+'</span>');
      }

      //Update Total
      var total = 0;
      this.ticket.get('productCollection').each(function(product) {
        total += product.get('qty')*product.get('price');
      });

      this.ticket.set('total', total);
    },
    updateTotal: function(model, value, options) {
      //Update other totals here
      this.$registerDisplay.find('.subtotal').html(this.labelizeTemplate({
        label: 'Subtotal',
        value: accounting.formatMoney(value)
      }));
    },

    //DOM Event Controllers
    activateScanFocus: function(e) {
      this.$searchbox.focus();
    },
    itemSelected: function(e, datum) {
      var product = this.ticket.get('productCollection').get(datum['id']);
      this.$searchbox.typeahead('setQuery', '');
      if(product) {
        this.ticket.incrementQty(product);
      } else {
        datum['qty'] = 1;
        datum['activeTicketView'] = this;
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
    //Event handlers for kinectic, to stop typeahead box interfering with drag scroll.
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

    //Render and demolish logic
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