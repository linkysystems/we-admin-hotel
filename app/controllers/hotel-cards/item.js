import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  ajax: inject(),
  actions: {
    changeDate(record, field, dates) {
      if (!dates || !dates[0]) {
        return;
      }
      this.get('model.record').set(field, dates[0]);
    }
  }
});
