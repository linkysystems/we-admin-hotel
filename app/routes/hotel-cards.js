import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

let ENV;

export default Ember.Route.extend(AuthenticatedRouteMixin, {

  init(){
    this._super(...arguments);

    ENV = Ember.getOwner(this).resolveRegistration('config:environment');
  },

  actions: {
    deleteRecord(record) {
      if (confirm(`Tem certeza que deseja deletar a ficha "${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
        record.destroyRecord()
        .then( ()=> {
          this.get('notifications').success(`A ficha "${record.get('id')}" foi descadastrada.`);
          this.transitionTo('hotel-cards.index');
          return null;
        });
      }
    },
    save(record) {
      record.save()
      .then( (r)=> {
        this.get('notifications')
        .success('Dados salvos.');
        // move scroll to top:
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        // success
        return r;
      })
      .catch( (err)=> {
        this.send('queryError', err);
        return err;
      });
    },

    saveConditions(c) {
      let s = this.get('settings');

      s.setSystemSettings({
        hotelCardConditions: c
      })
      .then( (result) => {
        Ember.set(s, 'systemSettings', result.settings);
        this.get('notifications')
            .success('Condições do hotel salvas com sucesso.');
        this.send('scrollToTop');
      })
      .fail( (err)=> {
        this.send('queryError', err);
      });
    },

    print(record) {
      let headers = { Accept: 'application/json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return Ember.$.ajax({
        url: `${ENV.API_HOST}/hotel-card/${record.id}/print`,
        type: 'POST',
        headers: headers
      })
      .then( (data) => {
        console.log('result>', data);
      })
      .fail( (err)=> {
        this.sendAction('queryError', err);
        return null;
      });
    }
  }
});
