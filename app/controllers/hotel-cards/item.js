import Ember from 'ember';

export default Ember.Controller.extend({
  ajax: Ember.inject.service(),
  actions: {
    changeDate(record, field, dates) {
      if (!dates || !dates[0]) {
        return;
      }
      this.get('model.record').set(field, dates[0]);
    }
  }
});
