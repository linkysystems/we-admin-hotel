import Component from '@ember/component';

export default Component.extend({
  actions: {
    changePublishedStatus() {
      this.get('changePublishedStatus')(...arguments);
    },
    deleteRecord() {
      this.get('deleteRecord')(...arguments);
    }
  }
});
