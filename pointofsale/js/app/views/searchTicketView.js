jQuery(function($) {
	searchTicketView = Backbone.View.extend({
		events: {
			"typeahead:selected .ticket-search": 'itemSelected',
			"click .checkout a.checkout-button": 'checkout',
			"click .rma-process a.rma-process-button": 'rma_process_credit_return',
			"click .rma-process a.rma-cash-button": 'rma_process_cash_return',
			"click a.lock-toggle": 'managerUnlockClosedTicket',
			"click .status_change a": 'changeStatusOpen'
		},
		tagName: 'div',
		selectedTicketWrapTemplate: _.template($('#selected-ticket-wrap').html()),
    	selectedTicketTemplate: _.template($('#selected-ticket').html()),
		searchBoxTemplate: _.template($('#ticket-search-components').html()),
		ticketSearchBadge: _.template($('#ticket-search-badge').html()),
		checkoutButtons: _.template($('#checkout-buttons').html()),
		rmaButtons: _.template($('#rma-buttons').html()),
		fetchRegisterID: _.template($('#register-id').html()),
		lastScanItemTpl: _.template($('#last-scan-item-template').html()),

		initialize: function(attributes, options) {
			this.lockInterval = false;
			this.employeeSession = attributes['employeeSession'];
			this.ticketStatusDialogModal = attributes['ticketStatusDialogModal'];
			this.rma_process_debounced = _.debounce(this.rma_process, 2000, true);
			var authCallback = _.bind(this.authorizedCallback, this);
			this.authorizationModal = new authorizationModal({authorizedCallback: authCallback, employeeSession: attributes['employeeSession'], el: $('.unlockAuthorizationOverlay'), title: 'Admin Authorization'});
			this.lastScannedItemDebounced = _.debounce(this.lastScannedItem, 500);
			this.lastItemScanned = this.$('.last-scan-item');
		},
		setActiveTicket: function(activeTicketView) {
			this.activeTicketView = activeTicketView;
		},
		checkout: function(e) {
			e.preventDefault();
			if(this.ticket.get('productCount') > 0) {
				this.checkoutDialogModal.display(true);
			} else {
				alert("Please scan products before continuing with checkout.");
			}
		},
		changeTicket: function(ticket, ticketId, options) {
			var previous_ticketId = ticket.previous('ticketId');

			if(this.lockInterval) {
				clearInterval(this.lockInterval);
			}

			if(ticketId) {
				this.$('.selected-ticket').html(this.selectedTicketTemplate(ticket.attributes));
				this.ticketSpecialButtons(ticket);
				this.lockInterval = setInterval(function() {
					$.ajax({
			          type: 'GET',
			          url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+ticketId+'&register_id='+$('#register-id').html()+'&op=renew',
			          timeout: 1000,
			          error: function(xhr, errorType, error) {
			            ticket.employeeSession.set('login', false);
			          }
			        });
				}, 30000);
			} else {
				this.$('.selected-ticket').empty();
			}

			if(previous_ticketId > 0) {
				$.ajax({
		          type: 'GET',
		          url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+previous_ticketId+'&register_id='+$('#register-id').html()+'&op=unlock',
		          timeout: 1000,
		          error: function(xhr, errorType, error) {
		            ticket.employeeSession.set('login', false);
		          }
		        });
			}

			this.$('.progress').hide();
    	},
    	managerUnlockClosedTicket: function(e) {
    		e.preventDefault();
    		var locked = this.activeTicketView.ticket.get('locked');
    		var status = this.ticket.get('status');
    		//Perform permission checks and dialongs here
    		if(this.employeeSession.get('admin')) {
    			this.toggleTicketLock(locked);
    		} else {
    			if(locked) {
    				this.authorizationModal.display(true);

    				if(status == 'pos_return') {
    					$('.unlockAuthorizationOverlay h3.title').text('Manager Authorization');
    				} else {
    					$('.unlockAuthorizationOverlay h3.title').text('Admin Authorization');
    				}
    			} else {
    				this.lockTicket();
    			}
    		}
    	},
    	authorizedCallback: function(res) {
    		var status = this.ticket.get('status');
    		if(status == 'pos_return') {
    			if(res.login && res.privileged) {
    				this.unlockTicket();
    			} else {
    				alert('Provided manager login/password were invalid.');
    			}
    		} else {
    			if(res.admin) {
	    			this.unlockTicket();
	    		} else {
	        		alert('Provided admin login/password were invalid.');
	      		}
    		}
    	},
    	toggleTicketLock: function(locked) {
			if(locked) {
				this.unlockTicket();
			} else {
				this.lockTicket();
			}
    	},
    	changeTicketStatus: function(ticket, ticketStatus, options) {
    		this.$('.selected-ticket').html(this.selectedTicketTemplate(ticket.attributes));
    		this.ticketSpecialButtons(ticket);
    	},
    	ticketSpecialButtons: function(ticket) {
    		//Enable Disable Checkout Button
    		var status = ticket.get('status');
    		if(status == 'pos_in_progress') {
    			this.$('.checkout').show();
    			$('.item-search input.search').focus();
    		} else {
    			this.$('.checkout').hide();
    		}

    		if(status == 'pos_return') {
    			this.$('.rma-process').show();
    		} else {
    			this.$('.rma-process').hide();
    		}

    		//Lock unlock ticket if closed using Global Selectors for now, need to be namespaced.
    		if(status == 'pos_completed' || status == 'pos_return' || status == 'pos_return_closed') {
    			$('.lock-indicator').show();
    			this.lockTicket();
    		} else {
    			$('.lock-indicator').hide();
    			this.unlockTicket();
    			$('.item-search input.search').focus();
    		}

    		if(status == 'pos_quote' || status == 'pos_return_closed') {
    			$('.lock-indicator').show();
    			$('.lock-indicator a.lock-toggle').hide();
    		} else {
    			$('.lock-indicator a.lock-toggle').show();
    		}
    	},
    	lockTicket: function() {
    		$('a.clear-customer').addClass('forceHide');
    		$('.customer-search input.tt-query, .item-search input.tt-query').attr('disabled', true);
    		$('.item-search input.tt-query').attr('disabled', true);
    		$('.activeTicket').addClass('lockedTicket');
    		this.activeTicketView.ticket.set('locked', true);
    		//$('.lock-indicator a.lock-toggle').show();
    	},
    	unlockTicket: function() {
    		if(this.employeeSession.get('admin')) {
	    		$('a.clear-customer').removeClass('forceHide');
	    		$('.customer-search input.tt-query, .item-search input.tt-query').attr('disabled', false);
	    	}

	    	$('.item-search input.tt-query').attr('disabled', false);
	    	$('.activeTicket').removeClass('lockedTicket');
	    	this.activeTicketView.ticket.set('locked', false);
	    	//$('.lock-indicator a.lock-toggle').hide();
    	},
    	mouseTrapCatch: function(e) {
    		var ticket = this.ticket;
    		var that = this;
    		var status = ticket.get('status');
    		if(status == 'pos_in_progress' || status == 'pos_quote') {
	      		ticket.trigger('ticket:preloader', true);
				var updateZoneRequest = JSON.stringify({token: sessionStorage.token, ticketId: ticket.get('ticketId')});
	            $.ajax({
		          type: 'POST',
		          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/delivery',
		          data: {request: updateZoneRequest},
		          timeout: 15000,
		          success: function(res, status, xhr) {
		            if(res.status) {
		              var zone = ticket.get('zone');
		              if(zone == 0) {
		              	var zone = ticket.set('zone', 1);
		              } else {
		              	var zone = ticket.set('zone', 0);
		              }
		            } else {
		              ticket.employeeSession.set('login', false);
		            }
		            ticket.trigger('ticket:preloader', false);
		          },
		          error: function(xhr, errorType, error) {
		            ticket.employeeSession.set('login', false);
		            ticket.trigger('ticket:preloader', false);
		          }
		        });
        	}
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
			
			$.ajax({
	          type: 'GET',
	          url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+datum['ticketId']+'&register_id='+$('#register-id').html()+'&op=acquire',
	          timeout: 1000,
	          success: function(res) {
	          	if(res.status) {
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
			          	ticket.trigger('ticket:preloader', false);
			            ticket.employeeSession.set('login', false);
			          }
			        });
	          	} else {
	          		alert(res.message);
	          	}
	          },
	          error: function(xhr, errorType, error) {
	            ticket.employeeSession.set('login', false);
	          }
	        });
		},
		resolveSearchRPC: function(url, uriEncodedQuery) {
			//Preprocess URL: Strip forward slashes to make compatible with Drupal GET arg syntax, Decouple later via POST. 
      		var newurl = url + '?searchQuery=' + encodeURIComponent(this.$searchbox.val().replace(/\//g, ''));
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

			this.$rmaButtons = this.$('.rma-process');
			this.$rmaButtons.append(this.rmaButtons());

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
		rma_process_credit_return: function(e) {
			e.preventDefault();
			if(this.ticket.get('productCount') > 0) {
				this.rma_process_debounced(true);
			} else {
				alert("Cannot process an empty RMA ticket.");
			}
		},
		rma_process_cash_return: function(e) {
			e.preventDefault();
			if(this.ticket.get('productCount') > 0) {
				this.rma_process_debounced(false);
			} else {
				alert("Cannot process an empty RMA ticket.");
			}
		},
		rma_process: function(credit_return) {
			var ticket = this.ticket;
			var ticketId = ticket.get('ticketId');
			var customer_uid = ticket.get('activeCustomer').get('id');

			var that = this;

		    var rmaReprocessReq = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid, ticketId: ticketId, register_id: this.fetchRegisterID(), credit_return: credit_return});
   	        ticket.trigger('ticket:preloader', true);
		    $.ajax({
		      type: 'POST',
		      url: this.employeeSession.get('apiServer')+'/pos-api/ticket/process-rma',
		      data: {request: rmaReprocessReq},
		      timeout: 15000,
		      success: function(res, status, xhr) {
		        if(res.status) {
		          alert(res.message);
		          ticket.set('status_en', 'Closed RMA Ticket');
              	  ticket.set('status', 'pos_return_closed');
		        } else {
		          that.employeeSession.set('login', false);
		        }
		        ticket.trigger('ticket:preloader', false);
		      },
		      error: function(xhr, errorType, error) {
		        //stop pre loader and logout user.
		        ticket.trigger('ticket:preloader', false);
		      }
		    });
		},
		changeStatusOpen: function(e) {
			e.preventDefault();
			this.ticketStatusDialogModal.switch(true);
		},
		demolish: function() {
			//Avoid mutex renewal on logout.
			var ticket = this.ticket;
			var previous_ticket_id = ticket.get('ticketId');
			if(this.lockInterval) {
				clearInterval(this.lockInterval);
			}

			if(previous_ticket_id > 0) {
				$.ajax({
		          type: 'GET',
		          url: ticket.employeeSession.get('apiServer')+'/lock/index.php?ticket_id='+previous_ticket_id+'&register_id='+$('#register-id').html()+'&op=unlock',
		          timeout: 1000,
		          error: function(xhr, errorType, error) {
		            ticket.employeeSession.set('login', false);
		          }
		        });
			}

			Mousetrap.unbind('shift+d p');
			this.$('.ticket-search input.search').typeahead('destroy');
			this.$('.ticket-search').empty();
			this.$('.category-breakdown').empty();
			this.$('.checkout').empty();
			this.$('.rma-process').hide().empty();
			this.$('.last-scan-item').empty();
			this.$('.lock-indicator').hide();
		},
		lastScannedItem: function(product) {
			this.$('.last-scan-item').html(this.lastScanItemTpl(product['attributes']));
		}
	});
});
