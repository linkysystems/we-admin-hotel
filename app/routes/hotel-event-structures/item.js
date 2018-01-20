import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  term: Ember.inject.service(),
  model(params) {
    return Ember.RSVP.hash({
      record: this.get('store')
                  .findRecord('hotel-event-structure', params.id),
      categories: this.get('term')
                      .getSystemCategories(),
      alias: this.get('store').query('url-alia', {
        target: '/hotel-event-structure/'+params.id,
        limit: 1,
        order: 'id DESC'
      })
      .then( (r)=> { // get only one alias:
        if (r && r.objectAt && r.objectAt(0)) {
          return r.objectAt(0);
        } else {
          return null;
        }
      }),
    });
  },

  afterModel(model) {
    let id = Ember.get(model, 'record.id');

    if (
      model.alias && model.alias.alias && model.record && model.record.id
    ) {
      Ember.set(model.record, 'setAlias', Ember.get(model.alias,'alias'));
    } else {
      model.alias = this.get('store').createRecord('url-alia', {
        target: '/hotel-event-structure/'+id,
        alias: '/estrutura-para-eventos/'+id
      });
    }
  }
});