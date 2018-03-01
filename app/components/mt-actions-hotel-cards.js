import Ember from 'ember';

export default Ember.Component.extend({
  init(){
    this._super(...arguments);

    this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
  },
  actions: {
    deleteRecord() {
      this.sendAction('deleteRecord', ...arguments);
    },
    print() {
      this.sendAction('print', ...arguments);
    }
  }
});
