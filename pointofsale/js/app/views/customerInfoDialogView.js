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
          if(res.status) {
            //Customer Info Tab
            that.$('.profile-content').html(res.content);
            var company = that.$('h2').remove().text();
            that.$('.bbm-modal__title').text(company);
            that.$('.profile-content fieldset legend').append('<span></span>');
            that.adjustBlockHeights();
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
    adjustBlockHeights: function() {
      var fieldsets = this.$('.profile-content fieldset');
      var height = 0;
      var current_height = 0;
      fieldsets.each(function() {
        current_height = $(this).height();
        if(current_height > height) {
          height = current_height;
        }
      });
      fieldsets.height(height);
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