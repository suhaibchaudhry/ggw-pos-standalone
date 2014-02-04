jQuery(function($) {
  employeeOperationsView = Backbone.View.extend({
    tagName: 'div',

    events: {
      "click a.logout": "logout",
      "click a.clock-in": "clockRecord",
      "click a.lunch-in": "lunchRecord"
    },

    template: _.template($('#employee-operations-buttons').html()),

    initialize: function(attributes, options) {
      this.employeeSession = attributes['employeeSession'];
      this.listenTo(this.employeeSession, 'change:clock', this.clockStateChange);
      this.listenTo(this.employeeSession, 'change:lunch', this.lunchStateChange);
    },

    clockRecord: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var lunch_in = this.employeeSession.get("lunch");
      if(lunch_in) {
        this.lunchRecord(e);
      }

      var token = this.employeeSession.get("token");
      var clockEvent = JSON.stringify({
        token: token,
        event_type: 'clock'
      });

      var session = this.employeeSession;

      $.ajax({
        type: 'POST',
        url: this.employeeSession.get('apiServer')+'/pos-api/clock',
        data: {request: clockEvent},
        timeout: 15000,
        success: function(res, status, xhr) {
          session.set({clock: res.checkin});
        },
        error: function(xhr, errorType, error) {
          session.set({clock: false});
        }
      });
    },

    lunchRecord: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var clocked_in = this.employeeSession.get("clock");

      if(clocked_in) {
        var token = this.employeeSession.get("token");
        var clockEvent = JSON.stringify({
          token: token,
          event_type: 'lunch'
        });

        var session = this.employeeSession;

        $.ajax({
          type: 'POST',
          url: this.employeeSession.get('apiServer')+'/pos-api/clock',
          data: {request: clockEvent},
          timeout: 15000,
          success: function(res, status, xhr) {
            session.set({lunch: res.checkin});
          },
          error: function(xhr, errorType, error) {
            session.set({lunch: false});
          }
        });
      } else {
        alert("You must be clocked in before starting lunch.");
      }
    },

    clockStateChange: function(session, clock, options) {
      if(clock) {
        //User is clocked in display clockout button
        this.$('a.clock-in').text('Clock Out').removeClass('pure-button-success').addClass('pure-button-error');
      } else {
        //User is clocked out display clockout button
        this.$('a.clock-in').text('Clock In').removeClass('pure-button-error').addClass('pure-button-success');
      }
    },

    lunchStateChange: function(session, lunch, options) {
      if(lunch) {
        //User is clocked in display clockout button
        this.$('a.lunch-in').text('Lunch Out').removeClass('pure-button-success').addClass('pure-button-error');
      } else {
        //User is clocked out display clockout button
        this.$('a.lunch-in').text('Lunch In').removeClass('pure-button-error').addClass('pure-button-success');
      }
    },

    computeAMPM: function(hours) {
      if(hours >= 12) {
        return "PM";
      } else {
        return "AM";
      }
    },

    formatTwoDigit: function(number) {
      return ("0"+number).slice(-2); //Convert to double digit
    },

    formatHour: function(hours) {
      if(hours > 12) {
        hours -= 12;
      } else if(hours == 0) {
        hours = 12;
      }

      return this.formatTwoDigit(hours); //Convert to double digit
    },

    fetchCurrentTime: function() {
      var date = new Date();
      var time = {
        hours: date.getHours(),
        minutes: date.getMinutes()
      }

      return this.formatHour(time.hours)+":"+this.formatTwoDigit(time.minutes)+" "+this.computeAMPM(time.hours);
    },

    render: function() {
      this.$clock = this.$('.clock');

      var view = this;
      view.$clock.text(view.fetchCurrentTime());
      this.clockIntervalId = setInterval(function() {
        view.$clock.text(view.fetchCurrentTime());
      }, 2000);

      if(sessionStorage.account) {
        this.$('.greeting').append('<span class="label">Employee ID: </span>'+sessionStorage.account);
      }

      this.$('.controls').html(this.template());

      return this;
    },

    demolish: function() {
      if(this.$clock) {
        this.$clock.empty();
      }

      this.$('.greeting').empty();

      clearInterval(this.clockIntervalId);
      this.$('.controls').empty();

      return this;
    },

    logout: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.employeeSession.logout();
    }

  });
});