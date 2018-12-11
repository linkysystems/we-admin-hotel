import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { hash } from 'rsvp';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  i18n: inject(),
  model() {
    const i18n = this.get('i18n');

    return hash({
      records: this.get('store').query('hotel-room', {}),
      columns: [
        {
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        },
        {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        },
        {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        },
        {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        },
        {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        },
        {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-rooms'
        }
      ]
    });
  }
});
