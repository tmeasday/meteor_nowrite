if (Meteor.is_client) {
  Meteor.subscribe('data-value');
  Data = new Meteor.Collection('data-value');
  
  Template.current_value.value = function () {
    var data = Data.findOne();
    return data ? data.value : 'connecting...';
  };
  
  Template.current_value.events = {
    'click input[type=button]': function() {
      Meteor.call('setDataValue', $('input[type=text]').val());
    }
  }
}

if (Meteor.is_server) {
  // this data object is obviously incomplete, but works
  var data = {value: 'initial', observers: {changed: []}};
  data.observe = function(callbacks) {
    data.observers.changed.push(callbacks.changed);
  };
  data.changeValue = function(new_value) {
    this.value = new_value;
    _.each(this.observers.changed, function(o) { o('value', 0); });
  }
  
  Meteor.methods({setDataValue: function(value) {
    data.changeValue(value);
  }});
  
  Meteor.publish('data-value', function() {
    var self = this;
    // a uuid for this subscription
    var uuid = Meteor.uuid();
    
    // set the initial value
    self.set('data-value', uuid, {'value': data.value});
    self.flush();
    
    // refresh whenever the value changes
    data.observe({changed: function() {
      self.set('data-value', uuid, {'value': data.value});
      self.flush();
    }});
    
    // clean up on unsub
    self.onStop(function() {
      handle.stop();
      self.unset('data-value', uuid, 'value');
      self.flush();
    });
  });
}