import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  actions: {
    deleteRecord(record) {
      if (confirm(`Tem certeza que deseja deletar a notícia "${record.get('title')}"? \nEssa ação não pode ser desfeita.`)) {
        record.destroyRecord()
        .then( ()=> {
          this.get('notifications').success(`A notícia "${record.get('title')}" foi deletada.`);
          this.transitionTo('hotel-news.index');
          return null;
        });
      }
    },
    changePublishedStatus(record, status) {
      record.published = status;
      record.save()
      .then( (r)=> {
        if (status) {
          this.get('notifications').success('Notícia publicada.');
        } else {
          this.get('notifications').success('Notícia despublicada.');
        }
        // success
        return r;
      })
      .catch( (err)=> {
        this.send('queryError', err);
      });
    },
    save(record, alias) {
      record.save()
      .then( function saveAlias(content) {
        return alias.save()
        .then( ()=> {
          return content;
        });
      })
      .then( (r)=> {
        this.get('notifications').success('Notícia salvas.');
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
    changeDate(x, y, z) {
      console.log('>', x, y, z);
    }
  }
});
