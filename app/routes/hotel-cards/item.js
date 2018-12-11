import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  model(params) {
    return hash({
      record: this.get('store')
                  .findRecord('hotel-card', params.id),
      genderOptions: ['F', 'M']
    });
  }
});