jQuery(function($) {
	searchTicketView = Backbone.View.extend({
		events: {
			"typeahead:selected .ticket-search": 'itemSelected',
			"click .checkout a.checkout-button": 'checkout',
			"click a.lock-toggle": 'managerUnlockClosedTicket'
		},
		tagName: 'div',
		selectedTicketWrapTemplate: _.template($('#selected-ticket-wrap').html()),
    	selectedTicketTemplate: _.template($('#selected-ticket').html()),
		searchBoxTemplate: _.template($('#ticket-search-components').html()),
		ticketSearchBadge: _.template($('#ticket-search-badge').html()),
		checkoutButtons: _.template($('#checkout-buttons').html()),
		initialize: function(attributes, options) {
			this.employeeSession = attributes['employeeSession'];
		},
		checkout: function(e) {
			e.preventDefault();
			this.checkoutDialogModal.display(true);
		},
		changeTicket: function(ticket, ticketId, options) {
			if(ticketId) {
				this.$('.selected-ticket').html(this.selectedTicketTemplate(ticket.attributes));
			} else {
				this.$('.selected-ticket').empty();
			}

			this.$('.progress').hide();
    	},
    	managerUnlockClosedTicket: function(e) {
    		e.preventDefault();
    		//Perform permission checks and dialongs here
    		this.unlockTicket();
    	},
    	changeTicketStatus: function(ticket, ticketStatus, options) {
    		$('.ticket-status span.value').text(ticket.get('status_en'));

    		//Enable Disable Checkout Button
    		if(ticketStatus == 'pos_in_progress') {
    			this.$('.checkout').show();
    			$('.item-search input.search').focus();
    		} else {
    			this.$('.checkout').hide();
    		}

    		//Lock unlock ticket if closed using Global Selectors for now, need to be namespaced.
    		if(ticketStatus == 'pos_completed') {
    			this.lockTicket();
    		} else {
    			this.unlockTicket();
    			$('.item-search input.search').focus();
    		}
    	},
    	lockTicket: function() {
    		$('a.clear-customer').addClass('forceHide');
    		$('.customer-search input.tt-query, .item-search input.tt-query').attr('disabled', true);
    		$('.activeTicket').addClass('lockedTicket');
    		$('.lock-indicator').show();
    	},
    	unlockTicket: function() {
    		if(this.employeeSession.get('privileged')) {
	    		$('a.clear-customer').removeClass('forceHide');
	    		$('.customer-search input.tt-query, .item-search input.tt-query').attr('disabled', false);
	    		$('.activeTicket').removeClass('lockedTicket');
	    		$('.lock-indicator').hide();
    		}
    	},
    	mouseTrapCatch: function(e) {
    		var ticket = this.ticket;
      		this.$('.progress').toggle();

			var updateZoneRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId')});
            $.ajax({
	          type: 'POST',
	          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/delivery',
	          data: {request: updateZoneRequest},
	          timeout: 15000,
	          success: function(res, status, xhr) {
	            if(!res.status) {
	              ticket.employeeSession.set('login', false);
	            }
	          },
	          error: function(xhr, errorType, error) {
	            ticket.employeeSession.set('login', false);
	          }
	        });
    	},
		itemSelected: function(e, datum) {
			var ticket = this.ticket;
			this.$searchbox.typeahead('setQuery', '');
			/*
			ticket.set({
                status: datum['ticketStatus'],
                status_en: datum['ticketStatus_en'],
                ticketId: datum['ticketId'],
                customerUid: datum['customerUid']
            });*/

			ticket.trigger('ticket:preloader', true);
            //Get Latest Customer UID on ticket, incase cache is dirty.
            var currentTicketRequest = JSON.stringify({token: sessionStorage.token, ticketId: datum['ticketId']});
            $.ajax({
	          type: 'POST',
	          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/get-current',
	          data: {request: currentTicketRequest},
	          timeout: 15000,
	          success: function(res, status, xhr) {
	            if(res.status) {
	              ticket.set(res.ticket);
	            } else {
	              ticket.employeeSession.set('login', false);
	            }
	            ticket.trigger('ticket:preloader', false);
	          },
	          error: function(xhr, errorType, error) {
	          	this.trigger('ticket:preloader', false);
	            ticket.employeeSession.set('login', false);
	          }
	        });
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
			//Preprocess URL: Strip forward slashes to make compatible with Drupal GET arg syntax, Decouple later via POST. 
      		var newurl = url + '/' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
      		return newurl;
    	},
		render: function() {
			this.$ticket_search = this.$('.ticket-search');
			this.$ticket_search.append(this.selectedTicketWrapTemplate());
			this.$ticket_search.append(this.searchBoxTemplate());
			this.$ticket_search.append(this.ticketSearchBadge());
			this.$searchbox = this.$('.ticket-search input.search');

			this.$checkoutButtons = this.$('.checkout');
			this.$checkoutButtons.append(this.checkoutButtons());

			//Create TypeaheadJs Box
			this.$searchbox.typeahead({
		      valueKey: 'ticketId',
		      name: 'search-tickets',
		      remote: {
		         url: this.employeeSession.get('apiServer')+'/pos-api/tickets/'+this.employeeSession.get("token"),
		         replace: _.bind(this.resolveSearchRPC, this)
		      },
		      limit: 8,
		      template: _.template($('#ticket-search-result').html())
		    });

		    Mousetrap.bind('shift+d p', _.bind(this.mouseTrapCatch, this));
		},
		demolish: function() {
			Mousetrap.unbind('shift+d p');
			this.$('.ticket-search input.search').typeahead('destroy');
			this.$('.ticket-search').empty();
			this.$('.category-breakdown').empty();
			this.$('.checkout').empty();
		}
	});
});