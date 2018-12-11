import Component from '@ember/component';

export default Component.extend({
  actions: {
    changePublishedStatus() {
      this.sendAction('changePublishedStatus', ...arguments);
    },
    deleteRecord() {
      this.sendAction('deleteRecord', ...arguments);
    }
  }
});
