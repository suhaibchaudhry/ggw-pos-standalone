jQuery(function($) {
	activeCustomer = Backbone.Model.extend({
		  setActiveTicketViewSingleton: function(ticketView) {
			    this.set('ticket', ticketView.ticket);
			    //Listen for customer id changes on ticket.
      		this.listenTo(this.get('ticket'), 'change:customerUid', this.changeTicketCustomerUid);
      },
      changeTicketCustomerUid: function(ticket, uid) {
      		//Load entire customer object from server and set it to as default
      		//When user is changed by gui change customerUid with silent flag, and update customer Uid on server.
      		if(uid == 0) {
            this.unlockTicketCustomer();
            this.set({
              id: 0
            });
          } else {
      			var ticket = this.get('ticket');

      			if(ticket.employeeSession.get('admin')) {
      				this.unlockTicketCustomer();
      			} else {
      				this.lockTicketCustomer();
      			}

      			var customer = this;
      			var loadCustomer = JSON.stringify({token: sessionStorage.token, customerUid: uid});
      			ticket.trigger('ticket:preloader', true);
      			$.ajax({
		          type: 'POST',
		          url: ticket.employeeSession.get('apiServer')+'/pos-api/customer',
		          data: {request: loadCustomer},
		          timeout: 15000,
		          success: function(res, status, xhr) {
		            if(res.status) {
		              customer.set(res.customer);
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
      	lockTicketCustomer: function() {
      		$('a.clear-customer').addClass('forceHide');
    		$('.customer-search input.tt-query').attr('disabled', true);
      	},
      	unlockTicketCustomer: function() {
      		$('a.clear-customer').removeClass('forceHide');
	    	$('.customer-search input.tt-query').attr('disabled', false);
      	},
      	updateTicketCustomerUidOnServer: function(uid) {
      		var ticket = this.get('ticket');
      		if(ticket.employeeSession.get('admin')) {
  				  this.unlockTicketCustomer();
  			  } else {
    				if(uid == 0) {
    					this.unlockTicketCustomer();
    				} else {
              this.lockTicketCustomer();
    				}
  			  }
      		ticket.set('customerUid', uid, {silent: true});
      		var updateTicketCustomerId = JSON.stringify({token: sessionStorage.token, customerUid: uid, ticketId: ticket.get('ticketId')});

      		//Update Ticket Customer id on Server
      		ticket.trigger('ticket:preloader', true);
      		$.ajax({
	          type: 'POST',
	          url: ticket.employeeSession.get('apiServer')+'/pos-api/ticket/update-customer',
	          data: {request: updateTicketCustomerId},
	          timeout: 15000,
	          success: function(res, status, xhr) {
	            if(!res.status) {
	              ticket.employeeSession.set('login', false);
	            }
	            ticket.trigger('ticket:preloader', false);
	          },
	          error: function(xhr, errorType, error) {
	            ticket.employeeSession.set('login', false);
	            ticket.trigger('ticket:preloader', false);
	          }
	        });
      	},
      	changeTicketStatusToOpen: function() {
      		var status = 'pos_in_progress';
      		var ticket = this.get('ticket');
      		var stasuses = ticket.get('ticketStasuses');
      		ticket.set({status: status, status_en: stasuses[status]});
      	}
	});
});