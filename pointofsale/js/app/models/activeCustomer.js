jQuery(function($) {
	activeCustomer = Backbone.Model.extend({
		setActiveTicketViewSingleton: function(ticketView) {
			this.ticket = ticketView.ticket;
			//Listen for customer id changes on ticket.
      		this.listenTo(this.ticket, 'change:customerUid', this.changeTicketCustomerUid);
      	},
      	changeTicketCustomerUid: function(ticket, uid) {
      		//Load entire customer object from server and set it to as default
      		//When user is changed by gui change customerUid with silent flag, and update customer Uid on server.
      		if(uid) {
      			var ticket = this.ticket;
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
      		} else {
      			this.set('id', uid);
      		}
      	},
      	updateTicketCustomerUidOnServer: function(uid) {
      		var ticket = this.ticket;
      		this.ticket.set('customerUid', uid, {silent: true});
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
      	}
	});
});