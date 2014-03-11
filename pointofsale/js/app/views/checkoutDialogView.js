jQuery(function($) {
  //Application Views
  checkoutDialogView = Backbone.View.extend({
    tagName: 'div',
    className: 'checkoutOverlay',
    events: {
      "click a.ticket-checkout-continue": 'checkoutProcess',
      "click a.ticket-checkout-cancel": 'closeCheckoutDialog',
      "click .info-menu-tabs a": 'changeTab',
      "keypress .cash-checkout input.cash-paid": 'cashInputValidate'
    },
    initialize: function(attributes, options) {
      this.activeCustomer = attributes['activeCustomer'];
      this.modal = attributes['modal'];
      this.ticket = attributes['ticket'];
    },
    template: _.template($('#ticket-checkout-modal').html()),
    render: function() {
      return this;
    },
    checkoutProcess: function(e) {
      this.closeCheckoutDialog(e);
      //Close ticket
      this.ticket.set('status_en', 'Closed Ticket');
      this.ticket.set('status', 'pos_completed');
    },
    changeTab: function(e) {
      e.preventDefault();

      //Detect index of selected tab
      this.$('li.pure-menu-selected').removeClass('pure-menu-selected');
      var list_element = e.currentTarget.parentNode;
      list_element.className = 'pure-menu-selected';
      var index = this.$('.info-menu-tabs ul li').index(list_element);
      
      //Activate corrosponding tab
      var tabs = this.$('.tabs .tab');
      tabs.hide();
      tabs.eq(index).show();
    },
    focusCash: function() {
      this.$('.cash-paid').focus();
      this.$('.change-due-value').html(accounting.formatMoney(this.ticket.get('total')));
    },
    closeCheckoutDialog: function(e) {
      e.preventDefault();
      this.modal.display(false);
    },
    cashInputValidate: function(e) {
      if(e.currentTarget.value == e.currentTarget.defaultValue) {
        e.currentTarget.value = '';
      }

      if((e.keyCode < 48 || e.keyCode > 57) && e.keyCode != 46 && e.keyCode != 8 && e.keyCode != 190) {
        e.preventDefault();
      } else {
        var cash_paid = this.$('input.cash-paid');
        var total = this.ticket.get('total');

        var paid = parseFloat(e.currentTarget.value);

        var change = total - paid;

        if(change < 0) {
           total = -change;
          change = 0;
        } else {
          total = 0;
        }

        this.$('.change-due-value').html(accounting.formatMoney(total));
        this.$('.change-value').html(accounting.formatMoney(change));
      }
    }
  });
});