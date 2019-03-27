import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('user');

  this.route('login');
  this.route('forgot-password');
  this.route('logout');

  this.route('profile', function() {
    this.route('change-password');
  });

  this.route('contents', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('news', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('hotel-rooms', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });


  this.route('hotel-cards', function() {
    this.route('create');
    this.route('conditions');
    this.route('item', { path: ':id' }, function(){

    });
  });


  this.route('hotel-event-structures', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('hotel-infrastructures', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('simple-events', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('site-contacts', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){});
  });

  this.route('users', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('url-alia', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){

    });
  });

  this.route('menus', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){
      this.route('add-link');
      this.route('edit-link', { path: ':linkid' }, function(){

      });
    });
  });

  this.route('slides', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){});
  });

  this.route('vocabulary', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function() {
      this.route('terms', function() {
        this.route('create');
        this.route('item', { path: ':id' }, function(){});
      });
    });
  });

  this.route('permissions');
  this.route('roles');

  this.route('settings', function() {
    this.route('project');
    this.route('integrations');
    this.route('theme', function() {
      this.route('change', function() {
        this.route('color', { path: ':id' });
      });
    });
  });

  this.route('site-contact-forms', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){});
  });

  this.route('email-templates', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){});
  });

  this.route('t', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){});
  });

  this.route('widgets');

  this.route('d-forms', function() {
    this.route('create');
    this.route('item', { path: ':id' }, function(){
      this.route('edit');
      this.route('use');
      this.route('answers', function() {
        this.route('item', { path: ':answer_id' }, function(){});
      });
    });
  });

  this.route('comments', function() {
    this.route('item', { path: ':id' }, function(){});
  });


  this.route('not-found', { path: '/*path' });
});

export default Router;
