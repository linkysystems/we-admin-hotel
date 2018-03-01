import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {

  model() {
    return {
      record: this.store.createRecord('hotel-card', {}),
      genderOptions: ['F', 'M']
    };
  },
  actions: {
    save(record) {
      record.save()
      .then( (r)=> {
        this.get('notifications')
            .success('Ficha registrada com sucesso.');

        this.transitionTo('hotel-cards.item', r.id);
        this.send('scrollToTop');
        // success
        return r;
      })
      .catch( (err)=> {
        this.send('queryError', err);
        return null;
      });
    }
  }
});