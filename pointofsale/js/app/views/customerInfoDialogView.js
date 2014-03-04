jQuery(function($) {
  //Application Views
  customerInfoDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'customerInfoOverlay',
    events: {
      "click a.customer-info-continue": 'closeCheckoutDialog'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.employeeSession = attributes['employeeSession'];
    },
    template: _.template($('#customer-info-modal').html()),
    loadUserProfile: function() {
      var that = this;
      var activeCustomer = this.activeCustomer;
      var customer_uid = activeCustomer.get('id');

      var customerInfoRequest = JSON.stringify({token: sessionStorage.token, customer_uid: customer_uid});
      //Start preloader
      //this.trigger('ticket:preloader', true);
      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/customer/info',
        data: {request: customerInfoRequest},
        timeout: 15000,
        success: function(res, status, xhr) {
          console.log(res);
          if(res.status) {
            that.$('.profile-content').html(res.content);
          } else {
            that.employeeSession.set('login', false);
          }
          //ticket.trigger('ticket:preloader', false);
        },
        error: function(xhr, errorType, error) {
          //stop pre loader and logout user.
          //ticket.trigger('ticket:preloader', false);
          that.employeeSession.set('login', false);
        }
      });
    },
    render: function() {
      return this;
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    }
  });
});