import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  i18n: Ember.inject.service(),
  model() {
    const i18n = this.get('i18n');

    return  Ember.RSVP.hash({
      records: this.get('store').query('hotel-card', {}),
      columns: [
        {
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        },
        {
          propertyName: 'creator.fullName',
          disableSorting: true,
          disableFiltering: true,
          title: 'Nome',
          className: 'mt-c-name text-cell'
        },
        {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        },
        {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-cards'
        }
      ]
    });
  }
});
