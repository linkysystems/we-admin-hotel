'use strict';



;define('we-admin-hotel/adapters/application', ['exports', 'ember-data', 'ember-simple-auth/mixins/data-adapter-mixin'], function (exports, _emberData, _dataAdapterMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.JSONAPIAdapter.extend(_dataAdapterMixin.default, {
    authorizer: 'authorizer:custom',
    headers: {
      'Accept': 'application/vnd.api+json'
    },
    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('host', ENV.API_HOST);
    },
    /**
      @method pathForType
      @param {String} modelName
      @return {String} path
    **/
    pathForType(modelName) {
      return modelName;
    }
  });
});
;define('we-admin-hotel/adapters/term', ['exports', 'ember-data', 'ember-simple-auth/mixins/data-adapter-mixin', 'ember-inflector'], function (exports, _emberData, _dataAdapterMixin, _emberInflector) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  const inflector = _emberInflector.default.inflector;
  inflector.irregular('modelsterms', 'modelsterm');

  exports.default = _emberData.default.JSONAPIAdapter.extend(_dataAdapterMixin.default, {
    authorizer: 'authorizer:custom',
    headers: {
      'Accept': 'application/vnd.api+json'
    },
    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('host', ENV.API_HOST);
    },

    /**
      @method pathForType
      @param {String} modelName
      @return {String} path
    **/
    pathForType(modelName) {
      return modelName;
    },
    urlForQuery(query) {
      if (!query.vocabularyName) {
        // default vocabulary name:
        query.vocabularyName = 'Tags';
      }
      return `${this.get('host')}/vocabulary/${encodeURIComponent(query.vocabularyName)}/term`;
    },
    urlForFindRecord(id, modelName, snapshot) {
      let vocabularyName = Ember.get(snapshot.record, 'vocabularyName') || Ember.get(snapshot.adapterOptions, 'vocabularyName') || 'Tags';

      return `${this.get('host')}/vocabulary/${vocabularyName}/term/${id}`;
    },
    urlForCreateRecord(modelName, snapshot) {
      let vocabularyName = Ember.get(snapshot.record, 'vocabularyName') || Ember.get(snapshot.adapterOptions, 'vocabularyName') || 'Tags';

      return `${this.get('host')}/vocabulary/${vocabularyName}/term`;
    },
    urlForUpdateRecord(id, modelName, snapshot) {
      return `${this.get('host')}/vocabulary/${Ember.get(snapshot.record, 'vocabularyName')}/term/${id}`;
    },
    urlForDeleteRecord(id, modelName, snapshot) {
      return `${this.get('host')}/vocabulary/${Ember.get(snapshot, 'record.vocabularyName')}/term/${id}`;
    }
  });
});
;define('we-admin-hotel/app', ['exports', 'we-admin-hotel/resolver', 'ember-load-initializers', 'we-admin-hotel/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  Ember.Controller.reopen({
    notifications: Ember.inject.service('notification-messages'),
    settings: Ember.inject.service('settings'),
    session: Ember.inject.service('session'),
    i18n: Ember.inject.service()
  });

  Ember.Route.reopen({
    notifications: Ember.inject.service('notification-messages'),
    settings: Ember.inject.service('settings'),
    i18n: Ember.inject.service(),
    activate: function () {
      this._super.apply(this, arguments);
      window.scrollTo(0, 0);
    },
    // pace loading on route change:
    activatePace: Ember.on('activate', function () {
      return window.Pace.restart();
    }),
    deactivatePace: Ember.on('deactivate', function () {
      return window.Pace.stop();
    })
  });

  // settup ember ajax for this project session store
  if (_environment.default.environment === 'development') {
    Ember.$.ajaxSetup({
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      }
    });
  } else {
    Ember.$.ajaxSetup({
      xhrFields: {
        withCredentials: true
      }
    });
  }

  exports.default = App;
});
;define('we-admin-hotel/authenticators/custom', ['exports', 'ember-simple-auth/authenticators/base'], function (exports, _base) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _base.default.extend({
    ajax: Ember.inject.service(),

    restore(data) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (!Ember.isEmpty(Ember.get(data, 'email')) || !Ember.isEmpty(Ember.get(data, 'id'))) {
          resolve(data);
        } else {
          reject();
        }
      });
    },
    authenticate(email, password, data) {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      if (data) {
        return new Ember.RSVP.Promise(resolve => {
          resolve({ id: data, email: email });
        });
      }

      return this.get('ajax').post(ENV.API_HOST + '/login', {
        data: {
          email: email,
          password: password
        }
      }).then(() => {
        return { email: email };
      });
    },

    invalidate() {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return this.get('ajax').request(ENV.API_HOST + '/auth/logout');
    }
  });
});
;define('we-admin-hotel/authorizers/custom', ['exports', 'ember-simple-auth/authorizers/base'], function (exports, _base) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _base.default.extend({
    authorize: function (jqXHR, requestOptions) {
      requestOptions.contentType = 'application/json;charset=utf-8';
      requestOptions.crossDomain = true;
      requestOptions.xhrFields = {
        withCredentials: true
      };

      var token = this.get('session.token');
      if (this.get('session.isAuthenticated') && !Ember.isEmpty(token)) {
        jqXHR.setRequestHeader('X-CSRF-Token', token);
      }
    }
  });
});
;define('we-admin-hotel/components/acl-btn-create', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    acl: Ember.inject.service('acl'),

    tagName: 'a',
    classNames: ['btn', 'btn-default'],

    goTo: 'goTo',

    model: null,

    isVisible: Ember.computed('model', function () {
      return Boolean(this.get('acl').can('create_' + this.get('model')));
    }),

    click() {
      let url = this.get('url') || '/' + this.get('model') + '/create';

      this.sendAction('goTo', url);
    }
  });
});
;define('we-admin-hotel/components/acl-can', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    acl: Ember.inject.service('acl'),

    permission: null,
    can: Ember.computed('permission', function () {
      const permission = this.get('permission');
      const acl = this.get('acl');

      if (acl.can(permission)) {
        return true;
      } else {
        return false;
      }
    })
  });
});
;define('we-admin-hotel/components/active-link', ['exports', 'we-admin-hotel/mixins/active-link'], function (exports, _activeLink) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend(_activeLink.default, {
    tagName: 'li'
  });
});
;define('we-admin-hotel/components/basic-dropdown', ['exports', 'ember-basic-dropdown/components/basic-dropdown'], function (exports, _basicDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _basicDropdown.default;
    }
  });
});
;define('we-admin-hotel/components/basic-dropdown/content-element', ['exports', 'ember-basic-dropdown/components/basic-dropdown/content-element'], function (exports, _contentElement) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _contentElement.default;
    }
  });
});
;define('we-admin-hotel/components/basic-dropdown/content', ['exports', 'ember-basic-dropdown/components/basic-dropdown/content'], function (exports, _content) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _content.default;
    }
  });
});
;define('we-admin-hotel/components/basic-dropdown/trigger', ['exports', 'ember-basic-dropdown/components/basic-dropdown/trigger'], function (exports, _trigger) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trigger.default;
    }
  });
});
;define('we-admin-hotel/components/bootstrap-loading', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    didInsertElement() {
      const lw = Ember.$('.loading-wrapper');
      lw.width(Ember.$(window).width());
      lw.height(Ember.$(window).height());
    }
  });
});
;define('we-admin-hotel/components/bs-accordion', ['exports', 'ember-bootstrap/components/bs-accordion'], function (exports, _bsAccordion) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsAccordion.default;
    }
  });
});
;define('we-admin-hotel/components/bs-accordion/item', ['exports', 'ember-bootstrap/components/bs-accordion/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define('we-admin-hotel/components/bs-accordion/item/body', ['exports', 'ember-bootstrap/components/bs-accordion/item/body'], function (exports, _body) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
;define('we-admin-hotel/components/bs-accordion/item/title', ['exports', 'ember-bootstrap/components/bs-accordion/item/title'], function (exports, _title) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
;define('we-admin-hotel/components/bs-alert', ['exports', 'ember-bootstrap/components/bs-alert'], function (exports, _bsAlert) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsAlert.default;
    }
  });
});
;define('we-admin-hotel/components/bs-button-group', ['exports', 'ember-bootstrap/components/bs-button-group'], function (exports, _bsButtonGroup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsButtonGroup.default;
    }
  });
});
;define('we-admin-hotel/components/bs-button-group/button', ['exports', 'ember-bootstrap/components/bs-button-group/button'], function (exports, _button) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
;define('we-admin-hotel/components/bs-button', ['exports', 'ember-bootstrap/components/bs-button'], function (exports, _bsButton) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsButton.default;
    }
  });
});
;define('we-admin-hotel/components/bs-carousel', ['exports', 'ember-bootstrap/components/bs-carousel'], function (exports, _bsCarousel) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsCarousel.default;
    }
  });
});
;define('we-admin-hotel/components/bs-carousel/slide', ['exports', 'ember-bootstrap/components/bs-carousel/slide'], function (exports, _slide) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _slide.default;
    }
  });
});
;define('we-admin-hotel/components/bs-collapse', ['exports', 'ember-bootstrap/components/bs-collapse'], function (exports, _bsCollapse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsCollapse.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown', ['exports', 'ember-bootstrap/components/bs-dropdown'], function (exports, _bsDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsDropdown.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/button', ['exports', 'ember-bootstrap/components/bs-dropdown/button'], function (exports, _button) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/menu', ['exports', 'ember-bootstrap/components/bs-dropdown/menu'], function (exports, _menu) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _menu.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/menu/divider', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/divider'], function (exports, _divider) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _divider.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/menu/item', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/menu/link-to', ['exports', 'ember-bootstrap/components/bs-dropdown/menu/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define('we-admin-hotel/components/bs-dropdown/toggle', ['exports', 'ember-bootstrap/components/bs-dropdown/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form', ['exports', 'ember-bootstrap/components/bs-form'], function (exports, _bsForm) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsForm.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element', ['exports', 'ember-bootstrap/components/bs-form/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/control', ['exports', 'ember-bootstrap/components/bs-form/element/control'], function (exports, _control) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _control.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/control/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/control/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/control/input', ['exports', 'ember-bootstrap/components/bs-form/element/control/input'], function (exports, _input) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _input.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/control/textarea', ['exports', 'ember-bootstrap/components/bs-form/element/control/textarea'], function (exports, _textarea) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _textarea.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/errors', ['exports', 'ember-bootstrap/components/bs-form/element/errors'], function (exports, _errors) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _errors.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/feedback-icon', ['exports', 'ember-bootstrap/components/bs-form/element/feedback-icon'], function (exports, _feedbackIcon) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _feedbackIcon.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/help-text', ['exports', 'ember-bootstrap/components/bs-form/element/help-text'], function (exports, _helpText) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _helpText.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/label', ['exports', 'ember-bootstrap/components/bs-form/element/label'], function (exports, _label) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _label.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/horizontal', ['exports', 'ember-bootstrap/components/bs-form/element/layout/horizontal'], function (exports, _horizontal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _horizontal.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/horizontal/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/horizontal/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/inline', ['exports', 'ember-bootstrap/components/bs-form/element/layout/inline'], function (exports, _inline) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inline.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/inline/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/inline/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/vertical', ['exports', 'ember-bootstrap/components/bs-form/element/layout/vertical'], function (exports, _vertical) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _vertical.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/element/layout/vertical/checkbox', ['exports', 'ember-bootstrap/components/bs-form/element/layout/vertical/checkbox'], function (exports, _checkbox) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define('we-admin-hotel/components/bs-form/group', ['exports', 'ember-bootstrap/components/bs-form/group'], function (exports, _group) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _group.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal-simple', ['exports', 'ember-bootstrap/components/bs-modal-simple'], function (exports, _bsModalSimple) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsModalSimple.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal', ['exports', 'ember-bootstrap/components/bs-modal'], function (exports, _bsModal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsModal.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/body', ['exports', 'ember-bootstrap/components/bs-modal/body'], function (exports, _body) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/dialog', ['exports', 'ember-bootstrap/components/bs-modal/dialog'], function (exports, _dialog) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dialog.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/footer', ['exports', 'ember-bootstrap/components/bs-modal/footer'], function (exports, _footer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _footer.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/header', ['exports', 'ember-bootstrap/components/bs-modal/header'], function (exports, _header) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _header.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/header/close', ['exports', 'ember-bootstrap/components/bs-modal/header/close'], function (exports, _close) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _close.default;
    }
  });
});
;define('we-admin-hotel/components/bs-modal/header/title', ['exports', 'ember-bootstrap/components/bs-modal/header/title'], function (exports, _title) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
;define('we-admin-hotel/components/bs-nav', ['exports', 'ember-bootstrap/components/bs-nav'], function (exports, _bsNav) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsNav.default;
    }
  });
});
;define('we-admin-hotel/components/bs-nav/item', ['exports', 'ember-bootstrap/components/bs-nav/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define('we-admin-hotel/components/bs-nav/link-to', ['exports', 'ember-bootstrap/components/bs-nav/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define('we-admin-hotel/components/bs-navbar', ['exports', 'ember-bootstrap/components/bs-navbar'], function (exports, _bsNavbar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsNavbar.default;
    }
  });
});
;define('we-admin-hotel/components/bs-navbar/content', ['exports', 'ember-bootstrap/components/bs-navbar/content'], function (exports, _content) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _content.default;
    }
  });
});
;define('we-admin-hotel/components/bs-navbar/link-to', ['exports', 'ember-bootstrap/components/bs-navbar/link-to'], function (exports, _linkTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define('we-admin-hotel/components/bs-navbar/nav', ['exports', 'ember-bootstrap/components/bs-navbar/nav'], function (exports, _nav) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _nav.default;
    }
  });
});
;define('we-admin-hotel/components/bs-navbar/toggle', ['exports', 'ember-bootstrap/components/bs-navbar/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
;define('we-admin-hotel/components/bs-popover', ['exports', 'ember-bootstrap/components/bs-popover'], function (exports, _bsPopover) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsPopover.default;
    }
  });
});
;define('we-admin-hotel/components/bs-popover/element', ['exports', 'ember-bootstrap/components/bs-popover/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define('we-admin-hotel/components/bs-progress', ['exports', 'ember-bootstrap/components/bs-progress'], function (exports, _bsProgress) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsProgress.default;
    }
  });
});
;define('we-admin-hotel/components/bs-progress/bar', ['exports', 'ember-bootstrap/components/bs-progress/bar'], function (exports, _bar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bar.default;
    }
  });
});
;define('we-admin-hotel/components/bs-tab', ['exports', 'ember-bootstrap/components/bs-tab'], function (exports, _bsTab) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsTab.default;
    }
  });
});
;define('we-admin-hotel/components/bs-tab/pane', ['exports', 'ember-bootstrap/components/bs-tab/pane'], function (exports, _pane) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pane.default;
    }
  });
});
;define('we-admin-hotel/components/bs-tooltip', ['exports', 'ember-bootstrap/components/bs-tooltip'], function (exports, _bsTooltip) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsTooltip.default;
    }
  });
});
;define('we-admin-hotel/components/bs-tooltip/element', ['exports', 'ember-bootstrap/components/bs-tooltip/element'], function (exports, _element) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define('we-admin-hotel/components/btn-assoc-company-content', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Component.extend({
    session: Ember.inject.service(),
    notifications: Ember.inject.service('notification-messages'),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    attributeBindings: ['disabled'],
    disabled: null,

    tagName: 'button',
    companyid: null,

    isLoading: false,

    iconContent: '<i class="glyphicon glyphicon-resize-small"></i>',

    click() {
      if (!this.get('isLoading')) {
        this.set('isLoading', true);
        this.updateContent();

        this.sendRequest().then(() => {

          this.get('notifications').success('Conteúdos associados.');

          this.set('isLoading', false);
          this.updateContent();
          return null;
        }).fail(err => {
          Ember.Logger.error('Error on update company association contents', err);

          this.get('notifications').error('Ocorreu um erro inesperado ao associar os conteúdos à empresa.');

          this.set('isLoading', false);
          this.updateContent();
          return null;
        });
      }

      return false;
    },

    updateContent() {
      if (this.get('isLoading')) {
        this.set('disabled', true);
        this.set('iconContent', '<i class="glyphicon glyphicon-refresh"></i>');
      } else {
        this.set('disabled', false);
        this.set('iconContent', '<i class="glyphicon glyphicon-resize-small"></i>');
      }
    },

    sendRequest() {
      let headers = { Accept: 'application/json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      const companyid = this.get('companyid');

      return Ember.$.ajax({
        url: `${ENV.API_HOST}/company/${companyid}/scan-and-associate-contents`,
        type: 'POST',
        headers: headers
      });
    }
  });
});
;define('we-admin-hotel/components/content-tag-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    terms: null,
    newTerm: null,
    // Event throw after user add one tag
    onAddTag: null,

    actions: {
      onAddTag() {
        if (this.get('onAddTag') && this.get('newTerm')) {
          this.sendAction(this.get('onAddTag'), this.get('newTerm'));
        }
      },
      onRemoveTag(term) {
        const terms = this.get('terms');
        terms.removeObject(term);
      }
    }
  });
});
;define('we-admin-hotel/components/conteudos-table', ['exports', 'ember-models-table/components/models-table-server-paginated'], function (exports, _modelsTableServerPaginated) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _modelsTableServerPaginated.default.extend({
    i18n: Ember.inject.service(),
    /**
     * The property on meta to load the pages count from.
     *
     * @type {string}
     * @name metaPagesCountProperty
     */
    metaPagesCountProperty: 'count',
    /**
     * The property on meta to load the total item count from.
     *
     * @type {string}
     * @name metaItemsCountProperty
     */
    metaItemsCountProperty: 'count',

    /**
     * The pages count is get from the meta information.
     * Set metaPagesCountProperty to change from which meta property this is loaded.
     *
     * @type {number}
     * @name pagesCount
     */
    pagesCount: Ember.computed('filteredContent.meta', function () {
      let total = Ember.get(this, 'filteredContent.meta.count');
      let pageSize = Ember.get(this, 'pageSize');

      return Math.ceil(total / pageSize);
    }),

    showGlobalFilter: false,
    showColumnsDropdown: false,

    filterQueryParameters: {
      globalFilter: 'q',
      sort: 'sort',
      sortDirection: 'sortDirection',
      page: 'page',
      pageSize: 'limit'
    },

    actions: {
      deleteRecord(record) {
        this.sendAction('deleteRecord', record);
      },
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      changeStatus() {
        this.sendAction('changeStatus', ...arguments);
      }
    },

    init() {
      this._super();
      const i18n = this.get('i18n');
      this.set('themeInstance.messages', Ember.Object.create({
        "searchLabel": i18n.t("models.table.search"),
        "searchPlaceholder": "",
        "columns-title": i18n.t("models.table.columns"),
        "columns-showAll": i18n.t("models.table.show.all"),
        "columns-hideAll": i18n.t("models.table.hide.all"),
        "columns-restoreDefaults": i18n.t("models.table.restore.defaults"),
        "tableSummary": String(i18n.t("models.table.restore.table.summary")),
        // "tableSummary": "Show %@ - %@ of %@",
        "allColumnsAreHidden": i18n.t('models.table.all.columns.are.hidden'),
        "noDataToShow": i18n.t('models.table.no.records.to.show')
      }));
    }
  });
});
;define('we-admin-hotel/components/d-form-field-date', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    field: null,

    deleteItem: 'deleteItem',

    'data-viewformat': null,

    viewFormatChanged: Ember.observer('data-viewformat', function () {
      const field = this.get('field');
      let formFieldAttributes = get(this, 'field.formFieldAttributes') || {};

      const v = get(this, 'data-viewformat');
      if (v) {
        formFieldAttributes['data-viewformat'] = v;
      } else {
        delete formFieldAttributes['data-viewformat'];
      }
      field.set('formFieldAttributes', Ember.copy(formFieldAttributes));
    }),

    didReceiveAttrs() {
      this._super(...arguments);
      this.set('data-viewformat', this.get('field.formFieldAttributes.data-viewformat'));
    },

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-description', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;
  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Component.extend({
    field: null,
    deleteItem: 'deleteItem',

    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 200,
          theme: 'modern',
          convert_urls: false,
          branding: false,
          extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
          plugins: ['autolink lists link image hr anchor', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table directionality', 'emoticons paste textcolor codesample'],
          toolbar1: 'undo redo | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),

          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };
        return opts;
      }
    }),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-email', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    field: null,

    deleteItem: 'deleteItem',

    didReceiveAttrs() {
      this._super(...arguments);
      const validate = !this.get('field.validate') || {};
      if (!validate || !validate.isEmail) {
        this.set('field.validate', { 'isEmail': true });
      }
    },

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-number', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    field: null,

    deleteItem: 'deleteItem',

    minValue: null,
    maxValue: null,

    minValueChanged: Ember.observer('minValue', function () {
      const field = this.get('field');
      let formFieldAttributes = get(this, 'field.formFieldAttributes') || {};

      const minValue = get(this, 'minValue');
      if (minValue) {
        formFieldAttributes.min = minValue;
      } else {
        delete formFieldAttributes.min;
      }
      field.set('formFieldAttributes', Ember.copy(formFieldAttributes));
    }),
    maxValueChanged: Ember.observer('maxValue', function () {
      const field = this.get('field');
      let formFieldAttributes = get(this, 'field.formFieldAttributes') || {};

      const maxValue = get(this, 'maxValue');
      if (maxValue) {
        formFieldAttributes.max = maxValue;
      } else {
        delete formFieldAttributes.max;
      }
      field.set('formFieldAttributes', Ember.copy(formFieldAttributes));
    }),

    didReceiveAttrs() {
      this._super(...arguments);

      this.set('minValue', this.get('field.formFieldAttributes.min'));
      this.set('maxValue', this.get('field.formFieldAttributes.max'));
    },

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-select', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    field: null,
    deleteItem: 'deleteItem',
    optionToAdd: null,

    actions: {
      addOption() {
        const field = this.get('field');
        let optionText = this.get('optionToAdd');
        if (!optionText) {
          return;
        }
        const ffo = this.get('field.fieldOptions') || {};
        ffo[optionText] = optionText;
        field.set('fieldOptions', Ember.copy(ffo));
        this.set('optionToAdd', '');
        return null;
      },
      removeOption(optionText) {
        if (!confirm('Tem certeza que deseja deletar essa opção?\nEssa ação não pode ser desfeita.')) {
          return null;
        }

        const ffo = this.get('field.fieldOptions') || {};
        delete ffo[optionText];
        this.set('field.fieldOptions', Ember.copy(ffo));
      },
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-text', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    field: null,

    saveField: 'saveField',
    deleteItem: 'deleteItem',

    actions: {
      save() {
        this.sendAction('saveField', this.get('field'));
      },
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-textarea', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    field: null,
    deleteItem: 'deleteItem',

    rows: 5,
    maxlength: null,

    rowsValueChanged: Ember.observer('rows', function () {
      const field = this.get('field');
      let formFieldAttributes = get(this, 'field.formFieldAttributes') || {};

      const rows = get(this, 'rows');
      if (rows) {
        formFieldAttributes.rows = rows;
      } else {
        delete formFieldAttributes.rows;
      }
      field.set('formFieldAttributes', Ember.copy(formFieldAttributes));
    }),
    maxlengthValueChanged: Ember.observer('maxlength', function () {
      const field = this.get('field');
      let formFieldAttributes = get(this, 'field.formFieldAttributes') || {};

      const maxlength = get(this, 'maxlength');
      if (maxlength) {
        formFieldAttributes.maxlength = maxlength;
      } else {
        delete formFieldAttributes.maxlength;
      }
      field.set('formFieldAttributes', Ember.copy(formFieldAttributes));
    }),

    didReceiveAttrs() {
      this._super(...arguments);

      const ffa = this.get('field.formFieldAttributes');
      if (!ffa.rows) {
        ffa.rows = 5; // set the default value
      }

      this.set('field.formFieldAttributes', ffa);
      this.set('rows', ffa.rows);
      this.set('maxlength', this.get('field.formFieldAttributes.maxlength') || null);
    },

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-title', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    field: null,
    deleteItem: 'deleteItem',

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-field-url', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    field: null,
    deleteItem: 'deleteItem',

    actions: {
      save() {},
      deleteItem() {
        this.sendAction('deleteItem', this.get('field'));
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-fields-sort-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    onSortEnd: 'onSortEnd',
    deleteItem: 'deleteItem',

    field: null,
    hideForm: true,
    group: null,
    parentDepth: 0,
    classNames: ['d-f-list-group-item'],
    formComponentName: Ember.computed('field.type', function () {
      const type = this.get('field.type');
      if (!type) {
        return null;
      }
      return 'd-form-field-' + type;
    }),

    didReceiveAttrs() {
      if (this.get('field.isNew')) {
        this.set('hideForm', false);
      }
    },

    actions: {
      onSortEnd() {
        this.sendAction('onSortEnd', ...arguments);
      },
      deleteItem() {
        this.sendAction('deleteItem', ...arguments);
      },
      toggleEditForm() {
        this.toggleProperty('hideForm');
      },
      openEditForm() {
        this.set('hideForm', false);
      },
      closeEditForm() {
        this.set('hideForm', true);
      }
    }
  });
});
;define('we-admin-hotel/components/d-form-fields-sort-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Sortable = window.Sortable;

  exports.default = Ember.Component.extend({
    fields: [],
    sortedFieldsDesc: ['weight:asc'],
    sortedFields: Ember.computed.sort('fields', 'sortedFieldsDesc'),

    group: 'dFormField',

    onSortEnd: 'onSortEnd',
    deleteItem: 'deleteItem',

    parentDepth: null,
    depth: 0,

    classNames: ['d-f-list-group'],

    didInsertElement() {
      // Simple list
      Sortable.create(this.element, {
        group: this.get('group'),
        handle: ".d-f-list-group-item-label",
        animation: 0, // ms, animation speed moving items when sorting, `0` — without animation
        // handle: ".tile__title", // Restricts sort start click/touch to the specified element
        // draggable: ".tile", // Specifies which items inside the element should be sortable
        onEnd: /**Event*/evt => {
          // var itemEl = evt.item;  // dragged HTMLElement
          // evt.to;    // target list
          // evt.from;  // previous list
          // evt.oldIndex;  // element's old index within old parent
          // evt.newIndex;  // element's new index within new parent

          const viewRegistry = Ember.getOwner(this).lookup('-view-registry:main');

          const toComponent = viewRegistry[evt.to.id];
          const fromComponent = viewRegistry[evt.from.id];
          const itemComponent = viewRegistry[evt.item.id];

          this.sendAction('onSortEnd', {
            event: evt,
            toComponent,
            fromComponent,
            itemComponent
          });
        }
      });
    },

    actions: {
      onSortEnd() {
        this.sendAction('onSortEnd', ...arguments);
      },
      deleteItem() {
        this.sendAction('deleteItem', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/date-time-picker', ['exports', 'ember-flatpickr/components/ember-flatpickr'], function (exports, _emberFlatpickr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberFlatpickr.default.extend({
    init() {
      const defaults = {
        altFormat: 'j/n/Y H:i',
        enableSeconds: false,
        enableTime: true,
        allowInput: false,
        altInput: true,
        clickOpens: true,
        altInputClass: 'form-control',
        locale: 'pt',
        mode: 'single',
        nextArrow: '>',
        parseDate: false,
        placeholder: '',
        prevArrow: '<',
        static: false,
        // dateFormat: 'Z',
        // timeFormat: 'H:i',
        utc: false,
        wrap: false,
        date: Ember.get(this, 'date') || new Date()
      };

      Ember.setProperties(this.attrs, defaults);
      Ember.setProperties(this, defaults);

      this._super(...arguments);
    }
  });
});
;define('we-admin-hotel/components/ember-flatpickr', ['exports', 'ember-flatpickr/components/ember-flatpickr'], function (exports, _emberFlatpickr) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberFlatpickr.default;
    }
  });
});
;define('we-admin-hotel/components/ember-popper-targeting-parent', ['exports', 'ember-popper/components/ember-popper-targeting-parent'], function (exports, _emberPopperTargetingParent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
;define('we-admin-hotel/components/ember-popper', ['exports', 'ember-popper/components/ember-popper'], function (exports, _emberPopper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
;define('we-admin-hotel/components/field-content-publication', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['field-content-publication'],

    publicationDate: null,
    isPublished: false,
    newPublicationDate: new Date(),

    minDate: new Date(),

    publishMethod: {
      id: 'unPublished',
      text: 'Manter despublicado'
    },
    newPublishMethod: null,

    publishMethods: [{
      id: 'unPublished',
      text: 'Manter despublicado'
    }, {
      id: 'on_create',
      text: 'Publicar ao salvar'
    }, {
      id: 'schendule',
      text: 'Publicação agendada'
    }],

    showDatePicker: Ember.computed('newPublishMethod', function () {
      if (this.get('newPublishMethod.id') === 'schendule') {
        return true;
      }
    }),

    editorIsOpen: false,

    init() {
      this._super(...arguments);
      this.resetChanges();
    },

    didReceiveAttrs() {
      this._super(...arguments);

      let dNow = new Date();
      dNow.setDate(dNow.getDate() - 1);
      this.set('minDate', dNow);

      const publicationDate = this.get('publicationDate');

      this.set('newPublicationDate', publicationDate || new Date());

      if (!this.get('isPublished')) {
        if (publicationDate) {
          this.set('publishMethod', {
            id: 'schendule',
            text: 'Publicação agendada'
          });
        } else {
          this.set('publishMethod', {
            id: 'unPublished',
            text: 'Manter despublicado'
          });
        }
      } else {
        this.set('publishMethod', {
          id: 'on_create',
          text: 'Publicar ao salvar'
        });
      }

      this.set('newPublishMethod', this.get('publishMethod'));
    },

    actions: {
      unPublish() {
        this.set('isPublished', false);
        this.set('publishMethod', {
          id: 'unPublished',
          text: 'Manter despublicado'
        });
        this.set('publicationDate', null);
        this.resetChanges();
      },

      savePublicationDate() {
        this.set('editorIsOpen', false);
        this.set('publishMethod', this.get('newPublishMethod'));
        this.set('publicationDate', this.get('newPublicationDate'));

        const publishMethodId = this.get('publishMethod.id');
        if (publishMethodId === 'unPublished' || publishMethodId === 'schendule') {
          this.set('isPublished', false);
        } else if (publishMethodId === 'on_create') {
          this.set('isPublished', true);
        }
      },

      cancelChanges() {
        this.resetChanges();
      },

      openEditor() {
        this.set('editorIsOpen', true);
      },

      closeEditor() {
        this.set('editorIsOpen', false);
      },

      changePublishMethod(old, n) {
        this.set('newPublishMethod', n);
      },

      changeDate(dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.set('newPublicationDate', dates[0]);
      }
    },

    resetChanges() {
      this.set('editorIsOpen', false);
      this.set('newPublishMethod', this.get('publishMethod'));
      this.set('newPublicationDate', this.get('publicationDate'));
    }
  });
});
;define('we-admin-hotel/components/field-model-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),
    classNames: ['field-model-selector'],
    selected: null,

    modelName: null,
    filterParam: null,
    displayValue: null,

    init() {
      this._super(...arguments);
      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
    },

    actions: {
      onSearch(term) {
        return this.search(term);
      }
    },

    search(term) {
      const modelName = this.get('modelName');
      if (!modelName) {
        Ember.Logger.warn('component:field-model-selector:modelName not set or is null');
        return;
      }

      const filterParam = this.get('filterParam');
      if (!filterParam) {
        Ember.Logger.warn('component:field-model-selector:filterParam not set or is null');
        return;
      }

      const q = {
        limit: 10,
        order: 'createdAt DESC'
      };

      if (term) {
        q[filterParam + '_contains'] = term;
        q.order = filterParam + ' ASC';
      }

      return this.get('store').query(modelName, q).then(records => {
        return records;
      }).catch(err => {
        this.sendAction('queryError', err);
        return null;
      });
    }
  });
});
;define('we-admin-hotel/components/field-role-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    classNames: ['field-role-selector'],

    selected: null,

    placeholder: null,

    roles: null,
    value: null,

    init() {
      this._super(...arguments);
      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));

      const roles = this.get('roles');
      const value = this.get('value');
      if (roles && roles.length && value) {
        if (value) {
          for (let i = roles.length - 1; i >= 0; i--) {
            if (roles[i].id === value) {
              this.set('selected', roles[i]);
              break;
            }
          }
        }
      }
    },

    actions: {
      setLinkUserRole(selected) {
        if (selected && selected.id) {
          this.set('selected', selected);
          this.set('value', selected.id);
        } else {
          this.set('selected', null);
          this.set('value', null);
        }
      }
    }
  });
});
;define('we-admin-hotel/components/field-text-editor', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV, editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Component.extend({
    classNames: ['field-text-editor'],

    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    label: null,
    value: null,

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      window.tinyMCE.baseURL = ENV.API_HOST + '/public/plugin/we-plugin-editor-tinymce/files';

      this.set('ENV', ENV);
    },

    didReceiveAttrs() {
      this._super(...arguments);
      if (!this.get('editorOptions')) {
        this.set('editorOptions', this.getBigEditor());
      }
    },

    actions: {
      onSearch(term) {
        return this.search(term);
      }
    },

    getBigEditor() {
      const ENV = this.get('ENV');

      return {
        content_css: ENV.API_HOST + '/public/plugin/we-plugin-editor-tinymce/files/tiny_mce.css',

        min_height: 400,
        theme: 'modern',
        theme_url: ENV.API_HOST + '/public/plugin/we-plugin-editor-tinymce/files/themes/modern/theme.min.js',
        convert_urls: false,
        branding: false,

        theme_advanced_buttons3_add: "pastetext,pasteword,selectall",
        paste_auto_cleanup_on_paste: true,

        extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
        plugins: ['advlist autolink lists link image charmap print hr anchor', 'searchreplace visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons paste textcolor colorpicker textpattern codesample'],
        toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | fullscreen',
        language: this.getEditorLocale(),
        language_url: this.getEditorLocaleUrl(),

        image_description: true,
        image_caption: true,
        image_advtab: true,
        file_browser_callback_types: 'image',
        file_picker_callback: this.get('upload').get_file_picker_callback(),

        imagetools_toolbar: 'rotateleft rotateright | imageoptions'
      };
    },

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    }
  });
});
;define('we-admin-hotel/components/file-field', ['exports', 'ember-uploader/components/file-field'], function (exports, _fileField) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _fileField.default;
    }
  });
});
;define('we-admin-hotel/components/file-upload-file-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['file-to-upload'],

    item: null,
    // local src file:
    src: null,

    init() {
      this._super(...arguments);
    },

    actions: {
      deleteItem() {
        const item = this.get('item');
        this.get('upload').removeFileFromUploadList(item);
      }
    }
  });
});
;define('we-admin-hotel/components/file-upload-file-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['file-upload-file-selector'],

    input: null,
    inputContainer: null,

    didInsertElement() {
      this._super(...arguments);

      const element = this.get('element');

      const input = element.querySelector('.input-file');

      this.set('inputContainer', element.querySelector('.input-file-inp-container'));

      this.set('input', input);
      this.setInputEvents();
    },

    resetInput() {
      const input = this.get('input');
      input.value = null;

      const element = this.get('inputContainer');
      element.innerHTML = '';
      element.appendChild(input.cloneNode(true));
      this.setInputEvents();
    },

    setInputEvents() {
      this.get('element').querySelector('.input-file').addEventListener('change', event => {
        this.onChangeInputFile(event);
      });
    },

    onChangeInputFile(r) {
      if (r.target.files && r.target.files && r.target.files.length) {
        for (let i = 0; i < r.target.files.length; i++) {
          this.get('upload').addFileToUpload(r.target.files[i]);
        }
      }

      this.resetInput();
    }
  });
});
;define('we-admin-hotel/components/file-upload-image-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['image-to-upload'],

    item: null,
    // local src file:
    src: null,

    init() {
      this._super(...arguments);
      this.parseImageUrl();
    },

    onChangeItem: Ember.observer('item', function () {
      this.parseImageUrl();
    }),

    parseImageUrl() {
      let item = this.get('item');
      if (!item) {
        return null;
      }

      this.readURL(item);
    },

    readURL(item) {
      let self = this;
      let reader = new FileReader();

      reader.onload = function (e) {
        if (!self.isDestroyed) {
          self.set('src', e.target.result);
        }
      };

      reader.readAsDataURL(item);
    },

    actions: {
      deleteItem() {
        const item = this.get('item');
        this.get('upload').removeImageFromUploadList(item);
      }
    }
  });
});
;define('we-admin-hotel/components/file-upload-image-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['file-upload-image-selector'],

    input: null,
    inputContainer: null,

    didInsertElement() {
      this._super(...arguments);

      const element = this.get('element');

      const input = element.querySelector('.input-file');

      this.set('inputContainer', element.querySelector('.input-file-inp-container'));

      this.set('input', input);
      this.setInputEvents();
    },

    resetInput() {
      const input = this.get('input');
      input.value = null;

      const element = this.get('inputContainer');
      element.innerHTML = '';
      element.appendChild(input.cloneNode(true));
      this.setInputEvents();
    },

    setInputEvents() {
      this.get('element').querySelector('.input-file').addEventListener('change', event => {
        this.onChangeInputFile(event);
      });
    },

    onChangeInputFile(r) {
      if (r.target.files && r.target.files && r.target.files.length) {
        for (let i = 0; i < r.target.files.length; i++) {
          this.get('upload').addImageToUpload(r.target.files[i]);
        }
      }

      this.resetInput();
    }
  });
});
;define('we-admin-hotel/components/file-upload', ['exports', 'ember-uploader/components/file-field', 'ember-uploader/uploaders/uploader'], function (exports, _fileField, _uploader) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _fileField.default.extend({
    session: Ember.inject.service('session'),

    uploader: null,

    getHeaders() {
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }
      return headers;
    },

    filesDidChange(files) {
      if (Ember.isEmpty(files)) {
        this.set('uploader', null);
        return;
      }

      const uploader = _uploader.default.create({
        ajaxSettings: {
          headers: this.getHeaders()
        },
        paramName: 'file',
        url: this.get('url')
      });

      this.set('uploader', uploader);

      this.sendAction('selected', files);

      uploader.on('progress', e => {
        // Handle progress changes
        // Use `e.percent` to get percentage
        this.sendAction('progress', uploader, e);
      });

      uploader.on('didUpload', e => {
        // Handle finished upload
        this.sendAction('didUpload', uploader, e);
      });

      uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
        // Handle unsuccessful upload
        this.sendAction('didError', uploader, jqXHR, textStatus, errorThrown);
      });
    }
  });
});
;define('we-admin-hotel/components/file-uploader-tr', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['file-uploader-tr'],
    tagName: 'tr',
    image: null,

    actions: {
      updateDescription() {
        let file = this.get('file');
        this.get('upload').updateFileDescription(file, file.description);
      },
      removeFile(file) {
        this.sendAction('removeFile', file);
      }
    }
  });
});
;define('we-admin-hotel/components/file-uploader', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Component.extend({
    notifications: Ember.inject.service('notification-messages'),
    upload: Ember.inject.service(),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
      this.set('url', `${ENV.API_HOST}/api/v1/file`);
    },

    willInsertElement() {
      this._super(...arguments);
      this.get('upload').initUploadMecanism();
    },

    isLOading: false,
    url: null,

    multiple: false,

    value: Ember.A(),

    canAddMore: Ember.computed('value.length', 'multiple', function () {
      const isMultiple = this.get('multiple');

      if (
      // multiple:
      isMultiple ||
      // single and empty:
      !isMultiple && !this.get('value.length')) {
        return true;
      } else {
        return false;
      }
    }),

    canSelectMore: Ember.computed('upload.filesToUpload.length', 'multiple', function () {
      const isMultiple = this.get('multiple');

      if (isMultiple) {
        return true;
      }

      if (this.get('upload.filesToUpload.length')) {
        return false;
      }

      return true;
    }),

    fileToShow: Ember.computed('value', function () {
      const value = this.get('value');
      if (Ember.isArray(value)) {
        return value[0];
      } else {
        return null;
      }
    }),

    getValue() {
      let value = this.get('value');
      if (value) {
        return value;
      } else {
        this.set('value', Ember.A());
        return this.get('value');
      }
    },

    actions: {
      removeFile(file) {
        if (confirm(`Tem certeza que deseja remover esse arquivo?`)) {
          const value = this.getValue();
          value.removeObject(file);
          this.set('uploader', null);
          this.set('selectedFile', null);
        }
      },
      upload() {
        this.set('isLOading', true);

        this.get('upload').uploadFiles().then(results => {
          const value = this.getValue();

          results.forEach(file => {
            value.pushObject(file);
          });

          this.set('isLOading', false);
          this.hideUploadModal();
        }).catch(err => {
          this.get('notifications').error('Erro ao enviar o arquivo para o servidor, tente novamente mais tarde');
          Ember.Logger.error(err);
          this.set('isLOading', false);
        });
      },

      openFileUploader() {
        this.set('error', null);
        this.set('uploadingFile', true);
      },

      onHideUploadModal() {
        this.hideUploadModal();
      }
    },

    hideUploadModal() {
      if (this.get('uploadingFile')) {
        this.set('uploadingFile', false);
      }

      this.set('uploader', null);
      this.set('selectedFile', null);
      this.set('uploadingFile', false);
    }
  });
});
;define('we-admin-hotel/components/image-upload', ['exports', 'ember-uploader/components/file-field'], function (exports, _fileField) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _fileField.default.extend({
    session: Ember.inject.service('session'),

    accept: "image/*",

    uploader: null,

    filesDidChange(files) {
      if (Ember.isEmpty(files)) {
        this.set('uploader', null);
        return;
      }

      // const uploader = Uploader.create({
      //   ajaxSettings: {
      //     headers: this.getHeaders()
      //   },
      //   paramName: 'image',
      //   url: this.get('url')
      // });

      // this.set('uploader', uploader);

      // this.sendAction('selected', files);

      // uploader.on('progress', e => {
      //   if (!this.isDestroyed) {
      //     // Handle progress changes
      //     // Use `e.percent` to get percentage
      //     this.sendAction('progress',uploader, e);
      //   }
      // });

      // uploader.on('didUpload', e => {
      //   if (!this.isDestroyed) {
      //     // Handle finished upload
      //     this.sendAction('didUpload',uploader, e);
      //   }
      // });

      // uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
      //   if (!this.isDestroyed) {
      //     // Handle unsuccessful upload
      //     this.sendAction('didError',uploader, jqXHR, textStatus, errorThrown);
      //   }
      // });
    }
  });
});
;define('we-admin-hotel/components/image-uploader-tr', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    upload: Ember.inject.service('upload'),

    classNames: ['image-uploader-tr'],
    tagName: 'tr',
    image: null,

    actions: {
      updateDescription() {
        let image = this.get('image');
        this.get('upload').updateImageDescription(image, image.description);
      },
      removeImage(image) {
        this.sendAction('removeImage', image);
      }
    }
  });
});
;define('we-admin-hotel/components/image-uploader', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Component.extend({
    notifications: Ember.inject.service('notification-messages'),
    upload: Ember.inject.service(),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
      this.set('url', `${ENV.API_HOST}/api/v1/image`);
    },

    willInsertElement() {
      this._super(...arguments);
      this.get('upload').initUploadMecanism();
    },

    isLOading: false,
    url: null, // upload url

    multiple: false,

    value: Ember.A([]),

    canAddMore: Ember.computed('value.length', 'multiple', function () {
      const isMultiple = this.get('multiple');

      if (
      // multiple:
      isMultiple ||
      // single and empty:
      !isMultiple && !this.get('value.length')) {
        return true;
      } else {
        return false;
      }
    }),

    canSelectMore: Ember.computed('upload.imagesToUpload.length', 'multiple', function () {
      const isMultiple = this.get('multiple');

      if (isMultiple) {
        return true;
      }

      if (this.get('upload.imagesToUpload.length')) {
        return false;
      }

      return true;
    }),

    fileToShow: Ember.computed('value', function () {
      const value = this.get('value');
      if (Ember.isArray(value)) {
        return value[0];
      } else {
        return null;
      }
    }),

    getValue() {
      let value = this.get('value');
      if (value) {
        return value;
      } else {
        this.set('value', Ember.A([]));
        return this.get('value');
      }
    },

    actions: {
      removeImage(image) {
        if (confirm(`Tem certeza que deseja remover essa imagem?`)) {
          const value = this.getValue();
          value.removeObject(image);
          this.set('uploaderOld', null);
          this.set('selectedFile', null);
        }
      },
      upload() {
        this.set('isLOading', true);

        this.get('upload').uploadImages().then(results => {
          const value = this.getValue();

          results.forEach(image => {
            value.pushObject(image);
          });

          this.set('isLOading', false);
          this.hideUploadModal();
        }).catch(err => {
          this.get('notifications').error('Erro ao enviar a imagem para o servidor, tente novamente mais tarde');
          Ember.Logger.error(err);
          this.set('isLOading', false);
        });
      },

      openImageUploader() {
        this.set('error', null);
        this.set('uploadingImage', true);
      },

      onHideUploadModal() {
        this.hideUploadModal();
      },

      /**
       * Select one salved image:
       */
      onSelectSalvedImage(image) {
        const value = this.getValue();
        value.pushObject(image);
        this.hideUploadModal();
        this.set('uploaderOld', null);
        this.set('description', null);
        this.set('selectedFile', null);
      }
    },

    selected(files) {
      const file = files[0];
      this.set('selectedFile', file);
      const reader = new FileReader();

      reader.onload = e => {
        // get local file src
        this.set('previewImageSrc', e.target.result);

        let fileSizeInMB = Math.round(file.size / 1024 / 1024);

        if (fileSizeInMB >= 10) {

          this.get('notifications').error('A imagem selecionada tem ' + fileSizeInMB + 'MB' + ' e o limite de envio de imagens é 10MB. Selecione uma imagem com menos de 10MB de tamanho.');
          this.hideUploadModal();
        }
      };
      reader.readAsDataURL(file);
    },

    hideUploadModal() {
      if (this.get('uploadingImage')) {
        this.set('uploadingImage', false);
      }

      this.set('error', null);
      this.set('uploaderOld', null);
      this.set('selectedFile', null);
      this.set('description', null);
      this.set('uploadingImage', false);
    }
  });
});
;define('we-admin-hotel/components/menu-admin-link', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    tagName: 'li'
    // classNames: ['haveSubmenu:dropdown'],
    // link: null,
    // haveSubmenu: Ember.computed('link.links', function() {
    //   return Boolean(this.get('link.links'));
    // })
  });
});
;define('we-admin-hotel/components/menu-admin', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    acl: Ember.inject.service('acl'),
    settings: Ember.inject.service('settings'),

    tagName: 'ul',
    ENV: null,

    userRoles: Ember.computed.alias('acl.userRoles'),

    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');
      this.set('ENV', ENV);

      this.set('links', Ember.A());
      this.set('classNames', ['nav', ' in']);
    },

    didInsertElement() {
      this._super(...arguments);

      const el = this.$();
      if (el && el.metisMenu) {
        this.$().metisMenu();
      }
    },

    didReceiveAttrs() {
      if (this.get('links.length')) {
        // already load
        return;
      }

      const links = this.get('links'),
            allLinks = this.get('ENV.adminMenu'),
            acl = this.get('acl'),
            plugins = this.get('settings.data.plugins'),
            isAdmin = this.get('acl.isAdmin');

      for (let i = 0; i < allLinks.length; i++) {
        let link = allLinks[i];

        if (link.plugin) {
          // plugin requirement:
          if (plugins.indexOf(link.plugin) === -1) {
            continue;
          }
        }

        if (isAdmin || link.permission && acl.can(link.permission)) {
          links.pushObject(link);
        }
      }
    }
  });
});
;define('we-admin-hotel/components/menu-category-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('term', {
        limit: 8,
        vocabularyName: 'Category',
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('term', {
          'text_starts-with': term,
          vocabularyName: 'Category',
          order: 'text ASC',
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['list']) {
          delete pagesSelected['list'];
        } else {
          pagesSelected['list'] = {
            isList: true,
            linkPermanent: '/vocabulary/Category/term'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('text'),
        modelName: 'term',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink(selected) {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Categorias',
        href: get(selected, 'linkPermanent')
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-custom-link-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),

    addLink: 'addLink',

    link: null,

    init() {
      this._super(...arguments);

      this.resetLink();
    },

    resetLink() {
      this.set('link', this.get('store').createRecord('link', {
        type: 'custom'
      }));
    },

    actions: {
      addLink(link) {
        this.resetLink();
        this.sendAction('addLink', link);
      }
    }
  });
});
;define('we-admin-hotel/components/menu-hotel-event-structure-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('hotel-event-structure', {
        limit: 8,
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('hotel-event-structure', {
          'name_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['hotel-event-structure_list']) {
          delete pagesSelected['hotel-event-structure_list'];
        } else {
          pagesSelected['hotel-event-structure_list'] = {
            isList: true,
            linkPermanent: '/hotel-event-structure'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('name'),
        modelName: 'hotel-event-structure',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink() {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Estrutura para eventos',
        href: '/hotel-event-structure'
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-hotel-infrastructure-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('hotel-infrastructure', {
        limit: 8,
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('hotel-infrastructure', {
          'name_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['hotel-infrastructure_list']) {
          delete pagesSelected['hotel-infrastructure_list'];
        } else {
          pagesSelected['hotel-infrastructure_list'] = {
            isList: true,
            linkPermanent: '/hotel-infrastructure'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('name'),
        modelName: 'hotel-infrastructure',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink() {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Infraestrutura de apoio',
        href: '/hotel-infrastructure'
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-hotel-rooms-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('hotel-room', {
        limit: 8,
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('hotel-room', {
          'name_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['hotel-room_list']) {
          delete pagesSelected['hotel-room_list'];
        } else {
          pagesSelected['hotel-room_list'] = {
            isList: true,
            linkPermanent: '/hotel-room'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('name'),
        modelName: 'hotel-room',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink() {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Quartos',
        href: '/hotel-room'
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-links-sort-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    onSortEnd: 'onSortEnd',
    deleteLink: 'deleteLink',

    link: null,
    hideForm: true,
    group: null,
    parentDepth: 0,
    classNames: ['m-list-group-item'],

    actions: {
      onSortEnd() {
        this.sendAction('onSortEnd', ...arguments);
      },
      deleteLink() {
        this.sendAction('deleteLink', ...arguments);
      },
      openEditForm(v) {
        this.set('hideForm', v);
      }
    }
  });
});
;define('we-admin-hotel/components/menu-links-sort-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Sortable = window.Sortable;

  exports.default = Ember.Component.extend({
    links: null,

    group: 'default',

    onSortEnd: 'onSortEnd',
    deleteLink: 'deleteLink',

    parentDepth: null,
    depth: 0,

    classNames: ['m-list-group'],

    int() {
      if (this.get('parentDepth')) {
        this.set('depth', this.get('parentDepth') + 1);
      }
    },

    didInsertElement() {
      // Simple list
      Sortable.create(this.element, {
        group: this.get('group'),
        handle: ".m-list-group-item-label",
        animation: 0, // ms, animation speed moving items when sorting, `0` — without animation
        // handle: ".tile__title", // Restricts sort start click/touch to the specified element
        // draggable: ".tile", // Specifies which items inside the element should be sortable
        onEnd: /**Event*/evt => {
          // var itemEl = evt.item;  // dragged HTMLElement
          // evt.to;    // target list
          // evt.from;  // previous list
          // evt.oldIndex;  // element's old index within old parent
          // evt.newIndex;  // element's new index within new parent

          const viewRegistry = Ember.getOwner(this).lookup('-view-registry:main');

          const toComponent = viewRegistry[evt.to.id];
          const fromComponent = viewRegistry[evt.from.id];
          const itemComponent = viewRegistry[evt.item.id];

          this.sendAction('onSortEnd', {
            event: evt,
            toComponent,
            fromComponent,
            itemComponent
          });
        }
      });
    },

    actions: {
      onSortEnd() {
        this.sendAction('onSortEnd', ...arguments);
      },
      deleteLink() {
        this.sendAction('deleteLink', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/menu-news-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),
    addLink: 'addLink',
    isLoading: true,
    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('news', {
        limit: 8,
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('news', {
          'title_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['news_list']) {
          delete pagesSelected['news_list'];
        } else {
          pagesSelected['news_list'] = {
            isList: true,
            linkPermanent: '/news'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('title'),
        modelName: 'news',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink() {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Notícias',
        href: '/news'
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-page-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service(),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('content', {
        limit: 8,
        order: 'publishedAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('content', {
          'title_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let linkPermanent = selectedPage.get('linkPermanent');

          let link = this.get('store').createRecord('link', {
            text: selectedPage.get('title'),
            modelName: 'content',
            modelId: selectedPage.id,
            href: linkPermanent
          });

          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let selectedPage = pagesSelected[id];
          let linkPermanent = selectedPage.get('linkPermanent');

          let link = this.get('store').createRecord('link', {
            text: selectedPage.get('title'),
            modelName: 'content',
            modelId: selectedPage.id,
            href: linkPermanent
          });

          this.sendAction('addLink', link);
          delete pagesSelected[id];
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    }
  });
});
;define('we-admin-hotel/components/menu-simple-events-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    store: Ember.inject.service('store'),
    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('simple-event', {
        limit: 8,
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('simple-event', {
          'name_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['simple-event_list']) {
          delete pagesSelected['simple-event_list'];
        } else {
          pagesSelected['simple-event_list'] = {
            isList: true,
            linkPermanent: '/simple-event'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('name'),
        modelName: 'simple-event',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink() {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Eventos',
        href: '/simple-event'
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-tag-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    store: Ember.inject.service(),

    addLink: 'addLink',

    isLoading: true,

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    didInsertElement() {
      return this.get('store').query('term', {
        limit: 8,
        vocabularyName: 'Tags',
        order: 'createdAt DESC'
      }).then(recentPages => {
        this.set('recentPages', recentPages);
        this.set('isLoading', false);
        return null;
      }).catch(() => {
        // TODO!
      });
    },

    actions: {
      searchPages(term) {
        return this.get('store').query('term', {
          'text_starts-with': term,
          vocabularyName: 'Tags',
          order: 'text ASC',
          limit: 10
        });
      },
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && selectedPage.get('linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      listaChecked() {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected['list']) {
          delete pagesSelected['list'];
        } else {
          pagesSelected['list'] = {
            isList: true,
            linkPermanent: '/vocabulary/Tags/term'
          };
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = selected.get('linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: selected.get('text'),
        modelName: 'term',
        modelId: selected.id,
        href: linkPermanent
      });

      return link;
    },

    buildListLink(selected) {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Categorias',
        href: get(selected, 'linkPermanent')
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/menu-user-links-selector', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Component.extend({
    store: Ember.inject.service(),

    addLink: 'addLink',

    selectedPage: null,
    pagesSelected: null,
    havePagesSelected: false,

    recentPages: null,

    options: [{
      id: 'view.profile',
      text: 'Ver perfil',
      role: 'authenticated',
      linkPermanent: '/user-goto?action=view'
    }, {
      id: 'edit.profile',
      text: 'Editar perfil',
      role: 'authenticated',
      linkPermanent: '/user-goto?action=edit'
    }, {
      id: 'edit.profile.privacity',
      text: 'Privacidade',
      role: 'authenticated',
      linkPermanent: '/user-goto?action=privacity'
    }, {
      id: 'password.change',
      text: 'Mudar senha',
      role: 'authenticated',
      linkPermanent: '/auth/change-password'
    }, {
      id: 'login',
      text: 'Entrar',
      role: 'unAuthenticated',
      linkPermanent: '/login'
    }, {
      id: 'logout',
      text: 'Sair',
      role: 'authenticated',
      linkPermanent: '/logout'
    }],

    actions: {
      selectPage(page) {
        this.set('selectedPage', page);
      },

      pageChecked(page) {
        let pagesSelected = this.get('pagesSelected');
        if (!pagesSelected) {
          pagesSelected = {};
          this.set('pagesSelected', pagesSelected);
        }
        // toggle page selection:
        if (pagesSelected[page.id]) {
          delete pagesSelected[page.id];
        } else {
          pagesSelected[page.id] = page;
        }

        this.set('havePagesSelected', Boolean(Object.keys(pagesSelected).length));
      },

      addPage() {
        let selectedPage = this.get('selectedPage');
        if (selectedPage && get(selectedPage, 'linkPermanent')) {
          let link = this.buildLink(selectedPage);
          this.sendAction('addLink', link);
          this.set('selectedPage', null);
        }
      },

      addPages() {
        const pagesSelected = this.get('pagesSelected');

        for (let id in pagesSelected) {
          let link;

          if (pagesSelected[id].isList) {
            link = this.buildListLink(pagesSelected[id]);
          } else {
            link = this.buildLink(pagesSelected[id]);
          }
          delete pagesSelected[id];
          this.sendAction('addLink', link);
        }

        this.set('havePagesSelected', false);
        this.$('input[type=checkbox]').removeAttr('checked');
      }
    },

    buildLink(selected) {
      let linkPermanent = get(selected, 'linkPermanent');

      let link = this.get('store').createRecord('link', {
        text: get(selected, 'text'),
        userRole: get(selected, 'role'),
        href: linkPermanent
      });

      return link;
    },

    buildListLink(selected) {
      let link = this.get('store').createRecord('link', {
        type: 'list',
        text: 'Usuários',
        href: get(selected, 'linkPermanent')
      });

      return link;
    }
  });
});
;define('we-admin-hotel/components/models-table-server-paginated', ['exports', 'ember-models-table/components/models-table-server-paginated'], function (exports, _modelsTableServerPaginated) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _modelsTableServerPaginated.default;
    }
  });
});
;define('we-admin-hotel/components/models-table', ['exports', 'ember-models-table/components/models-table'], function (exports, _modelsTable) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _modelsTable.default;
});
;define('we-admin-hotel/components/models-table/cell-column-summary', ['exports', 'ember-models-table/components/models-table/cell-column-summary'], function (exports, _cellColumnSummary) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cellColumnSummary.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/cell-content-display', ['exports', 'ember-models-table/components/models-table/cell-content-display'], function (exports, _cellContentDisplay) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cellContentDisplay.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/cell-content-edit', ['exports', 'ember-models-table/components/models-table/cell-content-edit'], function (exports, _cellContentEdit) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cellContentEdit.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/cell-edit-toggle', ['exports', 'ember-models-table/components/models-table/cell-edit-toggle'], function (exports, _cellEditToggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cellEditToggle.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/cell', ['exports', 'ember-models-table/components/models-table/cell'], function (exports, _cell) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cell.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/columns-dropdown', ['exports', 'ember-models-table/components/models-table/columns-dropdown'], function (exports, _columnsDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _columnsDropdown.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/columns-hidden', ['exports', 'ember-models-table/components/models-table/columns-hidden'], function (exports, _columnsHidden) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _columnsHidden.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/data-group-by-select', ['exports', 'ember-models-table/components/models-table/data-group-by-select'], function (exports, _dataGroupBySelect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataGroupBySelect.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/footer', ['exports', 'ember-models-table/components/models-table/footer'], function (exports, _footer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _footer.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/global-filter', ['exports', 'ember-models-table/components/models-table/global-filter'], function (exports, _globalFilter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _globalFilter.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/group-summary-row', ['exports', 'ember-models-table/components/models-table/group-summary-row'], function (exports, _groupSummaryRow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _groupSummaryRow.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/grouped-header', ['exports', 'ember-models-table/components/models-table/grouped-header'], function (exports, _groupedHeader) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _groupedHeader.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/no-data', ['exports', 'ember-models-table/components/models-table/no-data'], function (exports, _noData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _noData.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/page-size-select', ['exports', 'ember-models-table/components/models-table/page-size-select'], function (exports, _pageSizeSelect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pageSizeSelect.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/pagination-numeric', ['exports', 'ember-models-table/components/models-table/pagination-numeric'], function (exports, _paginationNumeric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginationNumeric.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/pagination-simple', ['exports', 'ember-models-table/components/models-table/pagination-simple'], function (exports, _paginationSimple) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginationSimple.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-expand', ['exports', 'ember-models-table/components/models-table/row-expand'], function (exports, _rowExpand) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowExpand.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-filtering-cell', ['exports', 'ember-models-table/components/models-table/row-filtering-cell'], function (exports, _rowFilteringCell) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowFilteringCell.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-filtering', ['exports', 'ember-models-table/components/models-table/row-filtering'], function (exports, _rowFiltering) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowFiltering.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-group-toggle', ['exports', 'ember-models-table/components/models-table/row-group-toggle'], function (exports, _rowGroupToggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowGroupToggle.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-grouping', ['exports', 'ember-models-table/components/models-table/row-grouping'], function (exports, _rowGrouping) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowGrouping.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-sorting-cell', ['exports', 'ember-models-table/components/models-table/row-sorting-cell'], function (exports, _rowSortingCell) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowSortingCell.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row-sorting', ['exports', 'ember-models-table/components/models-table/row-sorting'], function (exports, _rowSorting) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowSorting.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/row', ['exports', 'ember-models-table/components/models-table/row'], function (exports, _row) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _row.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/select', ['exports', 'ember-models-table/components/models-table/select'], function (exports, _select) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _select.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/summary', ['exports', 'ember-models-table/components/models-table/summary'], function (exports, _summary) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _summary.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/table-body', ['exports', 'ember-models-table/components/models-table/table-body'], function (exports, _tableBody) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tableBody.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/table-footer', ['exports', 'ember-models-table/components/models-table/table-footer'], function (exports, _tableFooter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tableFooter.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/table-header', ['exports', 'ember-models-table/components/models-table/table-header'], function (exports, _tableHeader) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tableHeader.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/table', ['exports', 'ember-models-table/components/models-table/table'], function (exports, _table) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _table.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/bootstrap4/columns-dropdown', ['exports', 'ember-models-table/components/models-table/themes/bootstrap4/columns-dropdown'], function (exports, _columnsDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _columnsDropdown.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/bootstrap4/data-group-by-select', ['exports', 'ember-models-table/components/models-table/themes/bootstrap4/data-group-by-select'], function (exports, _dataGroupBySelect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataGroupBySelect.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/bootstrap4/global-filter', ['exports', 'ember-models-table/components/models-table/themes/bootstrap4/global-filter'], function (exports, _globalFilter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _globalFilter.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/bootstrap4/row-filtering-cell', ['exports', 'ember-models-table/components/models-table/themes/bootstrap4/row-filtering-cell'], function (exports, _rowFilteringCell) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowFilteringCell.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/columns-dropdown', ['exports', 'ember-models-table/components/models-table/themes/semanticui/columns-dropdown'], function (exports, _columnsDropdown) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _columnsDropdown.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/data-group-by-select', ['exports', 'ember-models-table/components/models-table/themes/semanticui/data-group-by-select'], function (exports, _dataGroupBySelect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dataGroupBySelect.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/global-filter', ['exports', 'ember-models-table/components/models-table/themes/semanticui/global-filter'], function (exports, _globalFilter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _globalFilter.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/pagination-numeric', ['exports', 'ember-models-table/components/models-table/themes/semanticui/pagination-numeric'], function (exports, _paginationNumeric) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginationNumeric.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/pagination-simple', ['exports', 'ember-models-table/components/models-table/themes/semanticui/pagination-simple'], function (exports, _paginationSimple) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _paginationSimple.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/row-filtering-cell', ['exports', 'ember-models-table/components/models-table/themes/semanticui/row-filtering-cell'], function (exports, _rowFilteringCell) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rowFilteringCell.default;
    }
  });
});
;define('we-admin-hotel/components/models-table/themes/semanticui/select', ['exports', 'ember-models-table/components/models-table/themes/semanticui/select'], function (exports, _select) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _select.default;
    }
  });
});
;define('we-admin-hotel/components/mt-actions-comment', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-content', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    init() {
      this._super(...arguments);
      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
    },
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-d-form-answer', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.get('changePublishedStatus')(...arguments);
      },
      deleteRecord() {
        this.get('deleteRecord')(...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-d-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-data-importer-status', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-email-templates', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-hotel-cards', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    init() {
      this._super(...arguments);

      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
    },
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      },
      print() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-hotel-event-structures', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-hotel-infrastructure-structures', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-hotel-rooms', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-menus', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-news', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-simple-events', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-site-contacts', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changeStatus() {
        this.sendAction('changeStatus', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-sitecontact-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-slides', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      changePublishedStatus() {
        this.sendAction('changePublishedStatus', ...arguments);
      },
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-url-alia', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-users', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({});
});
;define('we-admin-hotel/components/mt-actions-vocabulary-terms', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    init() {
      this._super(...arguments);
      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
    },
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-actions-vocabulary', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    actions: {
      deleteRecord() {
        this.sendAction('deleteRecord', ...arguments);
      }
    }
  });
});
;define('we-admin-hotel/components/mt-comment-body', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend();
});
;define('we-admin-hotel/components/mt-comment-in-repply-to', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    ENV: null,

    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('ENV', ENV);
    }
  });
});
;define('we-admin-hotel/components/mt-creator', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    ENV: null,

    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('ENV', ENV);
    }
  });
});
;define('we-admin-hotel/components/mt-highlighted', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    notifications: Ember.inject.service('notification-messages'),

    cantDecrease: Ember.computed.not('record.highlighted'),

    actions: {
      increaseHighlighted(record) {
        let currentValue = Ember.get(record, 'highlighted') || 0;

        Ember.set(record, 'highlighted', currentValue + 1);

        record.save().then(() => {
          this.get('notifications').success('Prioridade de exibição aumentada.', {
            autoClear: true,
            clearDuration: 900
          });
          return null;
        });
      },
      decreaseHighlighted(record) {
        let currentValue = Ember.get(record, 'highlighted') || 0;

        if (!currentValue) {
          return;
        }

        Ember.set(record, 'highlighted', currentValue - 1);

        record.save().then(() => {
          this.get('notifications').success('Prioridade de exibição reduzida.', {
            autoClear: true,
            clearDuration: 900
          });
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/components/mt-list-item-created-at', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    settings: Ember.inject.service('settings')
  });
});
;define('we-admin-hotel/components/notification-container', ['exports', 'ember-cli-notifications/components/notification-container'], function (exports, _notificationContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _notificationContainer.default;
    }
  });
});
;define('we-admin-hotel/components/notification-message', ['exports', 'ember-cli-notifications/components/notification-message', 'ember-get-config'], function (exports, _notificationMessage, _emberGetConfig) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const globals = _emberGetConfig.default['ember-cli-notifications'] || {}; // Import app config object

  exports.default = _notificationMessage.default.extend({
    init() {
      this._super(...arguments);
      this.icons = globals.icons || 'font-awesome';
    }
  });
});
;define('we-admin-hotel/components/power-select-multiple', ['exports', 'ember-power-select/components/power-select-multiple'], function (exports, _powerSelectMultiple) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _powerSelectMultiple.default.extend({
    i18n: Ember.inject.service(),

    searchEnabled: true,

    loadingMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.loading');
    }),
    noMatchesMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.no-results-found');
    }),
    searchMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.type-to-search');
    })
  });
});
;define('we-admin-hotel/components/power-select-multiple/trigger', ['exports', 'ember-power-select/components/power-select-multiple/trigger'], function (exports, _trigger) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trigger.default;
    }
  });
});
;define('we-admin-hotel/components/power-select', ['exports', 'ember-power-select/components/power-select'], function (exports, _powerSelect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _powerSelect.default.extend({
    i18n: Ember.inject.service(),

    // Place here your system-wide preferences
    searchEnabled: false,
    allowClear: true,

    loadingMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.loading');
    }),
    noMatchesMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.no-results-found');
    }),
    searchMessage: Ember.computed('i18n.locale', function () {
      return this.get('i18n').t('selects.type-to-search');
    })
  });
});
;define('we-admin-hotel/components/power-select/before-options', ['exports', 'ember-power-select/components/power-select/before-options'], function (exports, _beforeOptions) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _beforeOptions.default;
    }
  });
});
;define('we-admin-hotel/components/power-select/options', ['exports', 'ember-power-select/components/power-select/options'], function (exports, _options) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _options.default;
    }
  });
});
;define('we-admin-hotel/components/power-select/placeholder', ['exports', 'ember-power-select/components/power-select/placeholder'], function (exports, _placeholder) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _placeholder.default;
    }
  });
});
;define('we-admin-hotel/components/power-select/power-select-group', ['exports', 'ember-power-select/components/power-select/power-select-group'], function (exports, _powerSelectGroup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _powerSelectGroup.default;
    }
  });
});
;define('we-admin-hotel/components/power-select/search-message', ['exports', 'ember-power-select/components/power-select/search-message'], function (exports, _searchMessage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _searchMessage.default;
    }
  });
});
;define('we-admin-hotel/components/power-select/trigger', ['exports', 'ember-power-select/components/power-select/trigger'], function (exports, _trigger) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trigger.default;
    }
  });
});
;define('we-admin-hotel/components/role-permission-check', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    roleName: null,
    permissionName: null,
    roles: null,
    can: null,
    isLoading: false,

    attributeBindings: ['type'],
    classNameBindings: ['can:active', 'isLoading:disabled'],

    tagName: 'button',
    type: 'button',

    init() {
      this._super();

      const roles = this.get('roles'),
            permissionName = this.get('permissionName'),
            roleName = this.get('roleName');

      if (!roles[roleName] || !roles[roleName].permissions || roles[roleName].permissions.indexOf(permissionName) === -1) {
        // dont have the permission
        this.set('can', false);
      } else {
        // have the permission
        this.set('can', true);
      }
    },
    click() {
      this.set('isLoading', true);
      this.toggleProperty('can');

      if (this.get('can')) {
        this.sendAction('addPermission', this.get('roleName'), this.get('permissionName'), this.requestDoneCallback.bind(this));
      } else {
        this.sendAction('removePermission', this.get('roleName'), this.get('permissionName'), this.requestDoneCallback.bind(this));
      }
    },
    /**
     * Callback for change permissions request
     * Used for change loading status
     */
    requestDoneCallback() {
      // wait some time to show the loading image:
      setTimeout(() => {
        this.set('isLoading', false);
      }, 400);
    }
  });
});
;define('we-admin-hotel/components/settings-menu', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    ENV: null,
    init() {
      this._super(...arguments);

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('ENV', ENV);
    }
  });
});
;define('we-admin-hotel/components/sortable-group', ['exports', 'ember-sortable/components/sortable-group'], function (exports, _sortableGroup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _sortableGroup.default;
});
;define('we-admin-hotel/components/sortable-item', ['exports', 'ember-sortable/components/sortable-item'], function (exports, _sortableItem) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _sortableItem.default;
});
;define('we-admin-hotel/components/theme-color-item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    tagName: 'span',
    classNames: ['theme-color-item'],
    attributeBindings: ['style', 'width'],
    width: '30',
    color: '#fff',
    style: Ember.computed('color', function () {
      let color = this.get('color');
      if (!color) {
        color = '#fff';
      }
      return Ember.String.htmlSafe('background-color: ' + color + '; color:' + color + ';');
    })
  });
});
;define('we-admin-hotel/components/tinymce-editor', ['exports', 'ember-cli-tinymce/components/tinymce-editor'], function (exports, _tinymceEditor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _tinymceEditor.default;
    }
  });
});
;define('we-admin-hotel/components/user-role-checkbox', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    roleName: null, // set role.id, rolaNme is deprecated for associations
    roleId: null,
    user: null,
    have: null,
    isLoading: false,

    attributeBindings: ['type'],
    classNameBindings: ['have:active', 'isLoading:disabled'],

    tagName: 'button',
    type: 'button',

    init() {
      this._super();

      const roles = this.get('user.roles'),
            roleName = this.get('roleName'),
            roleId = this.get('roleId');

      if (roleId && roles.length && roles.indexOf(roleId) > -1) {
        this.set('have', true);
      } else if (!roles || roles.indexOf(roleName) === -1) {
        // dont have the role
        this.set('have', false);
      } else {
        // have the role
        this.set('have', true);
      }
    },
    click(event) {
      event.target.blur(); // remove focus from clicked button

      this.set('isLoading', true);
      this.toggleProperty('have');

      if (this.get('have')) {
        this.sendAction('addUserRole', this.get('roleName') || this.get('roleId'), this.get('user'), this.requestDoneCallback.bind(this));
      } else {
        this.sendAction('removeUserRole', this.get('roleName') || this.get('roleId'), this.get('user'), this.requestDoneCallback.bind(this));
      }
    },
    /**
     * Callback for set role requests
     * Used for change loading status
     */
    requestDoneCallback() {
      // wait some time to show the loading image:
      setTimeout(() => {
        this.set('isLoading', false);
      }, 400);
    }
  });
});
;define('we-admin-hotel/components/we-datepicker', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({});
});
;define('we-admin-hotel/components/we-image', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    tagName: 'img',
    attributeBindings: ['src:src'],

    src: null,
    file: null,
    // size: original, large, medium, small, thumbnail
    size: 'medium',

    init() {
      this._super();

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      let file = this.get('file');

      if (Ember.isArray(file)) {
        if (file.firstObject) {
          file = Ember.get(file, 'firstObject');
        } else {
          file = file[0];
        }
      }

      // file.urls is required
      if (!file || !file.urls) {
        return;
      }

      let src = ENV.imageHost + Ember.get(file, 'urls.' + this.get('size'));
      this.set('src', src);
    }
  });
});
;define('we-admin-hotel/components/we-images-to-select', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    image: Ember.inject.service('image'),
    images: Ember.A(),
    onSelectImage: null,

    didReceiveAttrs() {
      this._super(...arguments);
      this.getLastUserImages();
    },

    getLastUserImages() {
      this.get('image').getLastUserImages().then(images => {
        if (images && images.length) {
          this.set('images', images);
        }
      });
    },

    actions: {
      onSelectImage(image) {
        let onSelectImage = this.get('onSelectImage');
        if (onSelectImage) {
          onSelectImage(image);
        }
      }
    }
  });
});
;define('we-admin-hotel/components/we-page-form', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Component.extend({
    showActionBar: true,
    isLoading: false,

    page: null,
    alias: null,

    onSavePage: null,
    onCancelSave: null,

    actions: {
      savePage(page, alias) {
        let savePageActionName = this.get('onSavePage');
        if (!savePageActionName) {
          return null;
        } else {
          this.sendAction(savePageActionName, page, alias, this);
        }
      },
      searchCategoryTerms(term) {
        const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

        let url = `${ENV.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

        let url = `${ENV.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define('we-admin-hotel/controllers/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    settingsLoaded: Ember.computed.alias('settings.loaded'),
    appName: Ember.computed.alias('settings.data.appName'),
    appLogo: Ember.computed.alias('settings.data.appLogo'),
    fileSelectorModalOpen: Ember.computed.alias('upload.modalOpen'),

    actions: {
      // UPLOAD ACTIONS:
      upload() {
        this.get('upload').upload();
      },

      selected() {
        this.get('upload').selected(...arguments);
      },

      onHideUploadModal() {
        this.get('upload').onHideUploadModal();
      },

      progress(uploader, e) {
        this.get('upload').progress(uploader, e);
      },
      didUpload(uploader, e) {
        this.get('upload').didUpload(uploader, e);
      },
      didError(uploader, jqXHR, textStatus, errorThrown) {
        this.get('upload').didError(uploader, jqXHR, textStatus, errorThrown);
      },

      onSelectSalvedImage(image) {
        this.get('upload').onSelectSalvedImage(image);
      }
    }
  });
});
;define('we-admin-hotel/controllers/comments/create', ['exports', 'we-admin-hotel/controllers/comments/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/comments/item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    queryParams: ['type'],

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 300,
          theme: 'modern',
          convert_urls: false,
          branding: false,
          plugins: ['legacyoutput advlist autolink lists link image charmap hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime nonbreaking save table contextmenu directionality', 'emoticons paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),
          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };

        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },
    actions: {
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define("we-admin-hotel/controllers/contents/create", ["exports", "we-admin-hotel/controllers/contents/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/contents/item', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  // const get = Ember.get;
  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 400,
          theme: 'modern',
          convert_urls: false,
          branding: false,
          extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
          plugins: ['advlist autolink lists link image charmap print preview hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),

          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };
        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },

    actions: {
      searchCategoryTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define("we-admin-hotel/controllers/d-forms/create", ["exports", "we-admin-hotel/controllers/d-forms/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/d-forms/item', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 250,
          theme: 'modern',
          convert_urls: false,
          extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
          plugins: ['advlist autolink lists link image charmap print preview hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons template paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),
          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };

        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },

    actions: {
      searchCategoryTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define('we-admin-hotel/controllers/email-templates/create', ['exports', 'we-admin-hotel/controllers/email-templates/item'], function (exports, _item) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/email-templates/item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  const set = Ember.set;

  let ENV;

  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    queryParams: ['type'],

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 300,
          theme: 'modern',
          convert_urls: false,
          branding: false,
          plugins: ['legacyoutput advlist autolink lists link image charmap hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime nonbreaking save table contextmenu directionality', 'emoticons paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),
          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };

        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },
    actions: {
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      },

      selectEmailType(record, typeObject) {
        record.set('type', typeObject.id);
        set(this, 'model.selectedEmailType', typeObject);
      }
    }
  });
});
;define("we-admin-hotel/controllers/hotel-cards/create", ["exports", "we-admin-hotel/controllers/hotel-cards/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/hotel-cards/item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    actions: {
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define("we-admin-hotel/controllers/hotel-event-structures/create", ["exports", "we-admin-hotel/controllers/hotel-event-structures/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define("we-admin-hotel/controllers/hotel-event-structures/item", ["exports", "we-admin-hotel/controllers/hotel-rooms/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define("we-admin-hotel/controllers/hotel-infrastructures/create", ["exports", "we-admin-hotel/controllers/hotel-infrastructures/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define("we-admin-hotel/controllers/hotel-infrastructures/item", ["exports", "we-admin-hotel/controllers/hotel-rooms/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define("we-admin-hotel/controllers/hotel-rooms/create", ["exports", "we-admin-hotel/controllers/hotel-rooms/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/hotel-rooms/item', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 400,
          theme: 'modern',
          convert_urls: false,
          extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
          plugins: ['advlist autolink lists link image charmap print preview hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons template paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),
          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };

        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },

    actions: {
      searchCategoryTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define('we-admin-hotel/controllers/login', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    session: Ember.inject.service('session'),

    actions: {
      authenticate() {
        let { identification, password } = this.getProperties('identification', 'password');
        this.get('session').authenticate('authenticator:custom', identification, password).then(r => {
          this.set('session.needsReload', true);
          return r;
        }).catch(reason => {
          this.get('notifications').error(reason.payload.messages[0].message);
        });
      }
    }
  });
});
;define('we-admin-hotel/controllers/menus/item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    advancedFieldsCollapsed: true,

    actions: {
      toggleAdvancedFields() {
        if (this.get('advancedFieldsCollapsed')) {
          this.set('advancedFieldsCollapsed', false);
        } else {
          this.set('advancedFieldsCollapsed', true);
        }
      },
      onSaveLink(link, modal) {
        this.send('saveLink', link, modal);
      },
      onCloseLinkEditModal() {
        this.send('onCloseLinkModal');
      },

      searchPages() {
        console.log('>>>>');
      },

      searchPage() {
        console.log('2222222222222');
      }
    }
  });
});
;define('we-admin-hotel/controllers/menus/item/add-link', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    actions: {
      searchPages(term) {
        return this.get('store').query('content', {
          'title_starts-with': term,
          limit: 10
        });
      },
      selectPage(page) {
        this.set('model.selectedPage', page);
      }
    }
  });
});
;define('we-admin-hotel/controllers/menus/item/edit-link', ['exports', 'we-admin-hotel/controllers/menus/item/add-link'], function (exports, _addLink) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _addLink.default;
});
;define('we-admin-hotel/controllers/menus/item/index', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Controller.extend({
    actions: {
      onChangeMenuComponent(newV) {
        Ember.set(this, 'model.selectedMenuComponent', newV);
      }
    }
  });
});
;define("we-admin-hotel/controllers/news/create", ["exports", "we-admin-hotel/controllers/news/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/news/item', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    actions: {
      searchCategoryTerms(term) {
        let url = `${ENV.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        let url = `${ENV.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define("we-admin-hotel/controllers/simple-events/create", ["exports", "we-admin-hotel/controllers/simple-events/item"], function (exports, _item) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _item.default;
});
;define('we-admin-hotel/controllers/simple-events/item', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let editorLocaleCache, editorLocaleUrlCache;

  exports.default = Ember.Controller.extend({
    ajax: Ember.inject.service(),
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),
    upload: Ember.inject.service('upload'),

    editorOptions: Ember.computed('settings.data', {
      get() {
        const opts = {
          min_height: 400,
          theme: 'modern',
          convert_urls: false,
          extended_valid_elements: 'iframe[src|frameborder|style|scrolling|class|width|height|name|align]',
          plugins: ['advlist autolink lists link image charmap print preview hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons template paste textcolor colorpicker textpattern codesample'],
          toolbar1: 'undo redo | insert | styleselect | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media |  codesample',
          language: this.getEditorLocale(),
          language_url: this.getEditorLocaleUrl(),
          file_browser_callback_types: 'image',
          file_picker_callback: this.get('upload').get_file_picker_callback()
        };

        return opts;
      }
    }),

    getEditorLocale() {
      if (editorLocaleCache) {
        return editorLocaleCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleCache = locale;

      return editorLocaleCache;
    },

    getEditorLocaleUrl() {
      if (editorLocaleUrlCache) {
        return editorLocaleUrlCache;
      }

      let locale = this.get('settings.data.activeLocale');
      // use default en-us locale
      if (!locale || locale === 'en' || locale === 'en-us') {
        return null;
      }

      if (locale.indexOf('-') > -1) {
        const parts = locale.split('-');
        // Locales with more than 2 parts not are supported
        // TODO!
        if (parts.length > 2) {
          return null;
        }
        // Converts the seccond part of the locale to uppercase:
        parts[1] = parts[1].toUpperCase();
        // override the locale?
        locale = parts.join('_');
      } else {
        return null;
      }

      editorLocaleUrlCache = `/admin/tiny-mce-languages/${locale}.js`;

      return editorLocaleUrlCache;
    },

    actions: {
      searchCategoryTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Category`;
        return this.get('ajax').request(url).then(json => json.term);
      },
      searchTagsTerms(term) {
        let url = `${_environment.default.API_HOST}/api/v1/term-texts?term=${term}&vocabularyName=Tags`;
        return this.get('ajax').request(url).then(json => {
          // add current term in  terms returned from backend search:
          json.term.push(term);
          return json.term;
        });
      },
      changeDate(record, field, dates) {
        if (!dates || !dates[0]) {
          return;
        }
        this.get('model.record').set(field, dates[0]);
      }
    }
  });
});
;define('we-admin-hotel/helpers/and', ['exports', 'ember-truth-helpers/helpers/and'], function (exports, _and) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _and.default;
    }
  });
  Object.defineProperty(exports, 'and', {
    enumerable: true,
    get: function () {
      return _and.and;
    }
  });
});
;define('we-admin-hotel/helpers/app-version', ['exports', 'we-admin-hotel/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;
  function appVersion(_, hash = {}) {
    const version = _environment.default.APP.version;
    // e.g. 1.0.0-alpha.1+4jds75hf

    // Allow use of 'hideSha' and 'hideVersion' For backwards compatibility
    let versionOnly = hash.versionOnly || hash.hideSha;
    let shaOnly = hash.shaOnly || hash.hideVersion;

    let match = null;

    if (versionOnly) {
      if (hash.showExtended) {
        match = version.match(_regexp.versionExtendedRegExp); // 1.0.0-alpha.1
      }
      // Fallback to just version
      if (!match) {
        match = version.match(_regexp.versionRegExp); // 1.0.0
      }
    }

    if (shaOnly) {
      match = version.match(_regexp.shaRegExp); // 4jds75hf
    }

    return match ? match[0] : version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});
;define('we-admin-hotel/helpers/append', ['exports', 'ember-composable-helpers/helpers/append'], function (exports, _append) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _append.default;
    }
  });
  Object.defineProperty(exports, 'append', {
    enumerable: true,
    get: function () {
      return _append.append;
    }
  });
});
;define('we-admin-hotel/helpers/array', ['exports', 'ember-composable-helpers/helpers/array'], function (exports, _array) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _array.default;
    }
  });
  Object.defineProperty(exports, 'array', {
    enumerable: true,
    get: function () {
      return _array.array;
    }
  });
});
;define('we-admin-hotel/helpers/bs-contains', ['exports', 'ember-bootstrap/helpers/bs-contains'], function (exports, _bsContains) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsContains.default;
    }
  });
  Object.defineProperty(exports, 'bsContains', {
    enumerable: true,
    get: function () {
      return _bsContains.bsContains;
    }
  });
});
;define('we-admin-hotel/helpers/bs-eq', ['exports', 'ember-bootstrap/helpers/bs-eq'], function (exports, _bsEq) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bsEq.default;
    }
  });
  Object.defineProperty(exports, 'eq', {
    enumerable: true,
    get: function () {
      return _bsEq.eq;
    }
  });
});
;define('we-admin-hotel/helpers/camelize', ['exports', 'ember-cli-string-helpers/helpers/camelize'], function (exports, _camelize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _camelize.default;
    }
  });
  Object.defineProperty(exports, 'camelize', {
    enumerable: true,
    get: function () {
      return _camelize.camelize;
    }
  });
});
;define('we-admin-hotel/helpers/cancel-all', ['exports', 'ember-concurrency/helpers/cancel-all'], function (exports, _cancelAll) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _cancelAll.default;
    }
  });
});
;define('we-admin-hotel/helpers/capitalize', ['exports', 'ember-cli-string-helpers/helpers/capitalize'], function (exports, _capitalize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _capitalize.default;
    }
  });
  Object.defineProperty(exports, 'capitalize', {
    enumerable: true,
    get: function () {
      return _capitalize.capitalize;
    }
  });
});
;define('we-admin-hotel/helpers/chunk', ['exports', 'ember-composable-helpers/helpers/chunk'], function (exports, _chunk) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _chunk.default;
    }
  });
  Object.defineProperty(exports, 'chunk', {
    enumerable: true,
    get: function () {
      return _chunk.chunk;
    }
  });
});
;define('we-admin-hotel/helpers/classify', ['exports', 'ember-cli-string-helpers/helpers/classify'], function (exports, _classify) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _classify.default;
    }
  });
  Object.defineProperty(exports, 'classify', {
    enumerable: true,
    get: function () {
      return _classify.classify;
    }
  });
});
;define('we-admin-hotel/helpers/compact', ['exports', 'ember-composable-helpers/helpers/compact'], function (exports, _compact) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compact.default;
    }
  });
  Object.defineProperty(exports, 'compact', {
    enumerable: true,
    get: function () {
      return _compact.compact;
    }
  });
});
;define('we-admin-hotel/helpers/compute', ['exports', 'ember-composable-helpers/helpers/compute'], function (exports, _compute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compute.default;
    }
  });
  Object.defineProperty(exports, 'compute', {
    enumerable: true,
    get: function () {
      return _compute.compute;
    }
  });
});
;define('we-admin-hotel/helpers/contains', ['exports', 'ember-composable-helpers/helpers/contains'], function (exports, _contains) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _contains.default;
    }
  });
  Object.defineProperty(exports, 'contains', {
    enumerable: true,
    get: function () {
      return _contains.contains;
    }
  });
});
;define('we-admin-hotel/helpers/dasherize', ['exports', 'ember-cli-string-helpers/helpers/dasherize'], function (exports, _dasherize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dasherize.default;
    }
  });
  Object.defineProperty(exports, 'dasherize', {
    enumerable: true,
    get: function () {
      return _dasherize.dasherize;
    }
  });
});
;define('we-admin-hotel/helpers/dec', ['exports', 'ember-composable-helpers/helpers/dec'], function (exports, _dec) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _dec.default;
    }
  });
  Object.defineProperty(exports, 'dec', {
    enumerable: true,
    get: function () {
      return _dec.dec;
    }
  });
});
;define('we-admin-hotel/helpers/drop', ['exports', 'ember-composable-helpers/helpers/drop'], function (exports, _drop) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _drop.default;
    }
  });
  Object.defineProperty(exports, 'drop', {
    enumerable: true,
    get: function () {
      return _drop.drop;
    }
  });
});
;define('we-admin-hotel/helpers/ember-power-select-is-group', ['exports', 'ember-power-select/helpers/ember-power-select-is-group'], function (exports, _emberPowerSelectIsGroup) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectIsGroup.default;
    }
  });
  Object.defineProperty(exports, 'emberPowerSelectIsGroup', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectIsGroup.emberPowerSelectIsGroup;
    }
  });
});
;define('we-admin-hotel/helpers/ember-power-select-is-selected', ['exports', 'ember-power-select/helpers/ember-power-select-is-selected'], function (exports, _emberPowerSelectIsSelected) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectIsSelected.default;
    }
  });
  Object.defineProperty(exports, 'emberPowerSelectIsSelected', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectIsSelected.emberPowerSelectIsSelected;
    }
  });
});
;define('we-admin-hotel/helpers/ember-power-select-true-string-if-present', ['exports', 'ember-power-select/helpers/ember-power-select-true-string-if-present'], function (exports, _emberPowerSelectTrueStringIfPresent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectTrueStringIfPresent.default;
    }
  });
  Object.defineProperty(exports, 'emberPowerSelectTrueStringIfPresent', {
    enumerable: true,
    get: function () {
      return _emberPowerSelectTrueStringIfPresent.emberPowerSelectTrueStringIfPresent;
    }
  });
});
;define('we-admin-hotel/helpers/eq', ['exports', 'ember-truth-helpers/helpers/equal'], function (exports, _equal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _equal.default;
    }
  });
  Object.defineProperty(exports, 'equal', {
    enumerable: true,
    get: function () {
      return _equal.equal;
    }
  });
});
;define('we-admin-hotel/helpers/exists-in', ['exports', 'ember-models-table/helpers/exists-in'], function (exports, _existsIn) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _existsIn.default;
    }
  });
  Object.defineProperty(exports, 'existsIn', {
    enumerable: true,
    get: function () {
      return _existsIn.existsIn;
    }
  });
});
;define('we-admin-hotel/helpers/filter-by', ['exports', 'ember-composable-helpers/helpers/filter-by'], function (exports, _filterBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filterBy.default;
    }
  });
  Object.defineProperty(exports, 'filterBy', {
    enumerable: true,
    get: function () {
      return _filterBy.filterBy;
    }
  });
});
;define('we-admin-hotel/helpers/filter', ['exports', 'ember-composable-helpers/helpers/filter'], function (exports, _filter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _filter.default;
    }
  });
  Object.defineProperty(exports, 'filter', {
    enumerable: true,
    get: function () {
      return _filter.filter;
    }
  });
});
;define('we-admin-hotel/helpers/find-by', ['exports', 'ember-composable-helpers/helpers/find-by'], function (exports, _findBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _findBy.default;
    }
  });
  Object.defineProperty(exports, 'findBy', {
    enumerable: true,
    get: function () {
      return _findBy.findBy;
    }
  });
});
;define('we-admin-hotel/helpers/flatten', ['exports', 'ember-composable-helpers/helpers/flatten'], function (exports, _flatten) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _flatten.default;
    }
  });
  Object.defineProperty(exports, 'flatten', {
    enumerable: true,
    get: function () {
      return _flatten.flatten;
    }
  });
});
;define('we-admin-hotel/helpers/group-by', ['exports', 'ember-composable-helpers/helpers/group-by'], function (exports, _groupBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _groupBy.default;
    }
  });
  Object.defineProperty(exports, 'groupBy', {
    enumerable: true,
    get: function () {
      return _groupBy.groupBy;
    }
  });
});
;define('we-admin-hotel/helpers/gt', ['exports', 'ember-truth-helpers/helpers/gt'], function (exports, _gt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gt.default;
    }
  });
  Object.defineProperty(exports, 'gt', {
    enumerable: true,
    get: function () {
      return _gt.gt;
    }
  });
});
;define('we-admin-hotel/helpers/gte', ['exports', 'ember-truth-helpers/helpers/gte'], function (exports, _gte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _gte.default;
    }
  });
  Object.defineProperty(exports, 'gte', {
    enumerable: true,
    get: function () {
      return _gte.gte;
    }
  });
});
;define('we-admin-hotel/helpers/has-next', ['exports', 'ember-composable-helpers/helpers/has-next'], function (exports, _hasNext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hasNext.default;
    }
  });
  Object.defineProperty(exports, 'hasNext', {
    enumerable: true,
    get: function () {
      return _hasNext.hasNext;
    }
  });
});
;define('we-admin-hotel/helpers/has-previous', ['exports', 'ember-composable-helpers/helpers/has-previous'], function (exports, _hasPrevious) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _hasPrevious.default;
    }
  });
  Object.defineProperty(exports, 'hasPrevious', {
    enumerable: true,
    get: function () {
      return _hasPrevious.hasPrevious;
    }
  });
});
;define('we-admin-hotel/helpers/html-safe', ['exports', 'ember-models-table/helpers/html-safe'], function (exports, _htmlSafe) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _htmlSafe.default;
    }
  });
  Object.defineProperty(exports, 'htmlSafe', {
    enumerable: true,
    get: function () {
      return _htmlSafe.htmlSafe;
    }
  });
});
;define('we-admin-hotel/helpers/humanize', ['exports', 'ember-cli-string-helpers/helpers/humanize'], function (exports, _humanize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _humanize.default;
    }
  });
  Object.defineProperty(exports, 'humanize', {
    enumerable: true,
    get: function () {
      return _humanize.humanize;
    }
  });
});
;define('we-admin-hotel/helpers/inc', ['exports', 'ember-composable-helpers/helpers/inc'], function (exports, _inc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _inc.default;
    }
  });
  Object.defineProperty(exports, 'inc', {
    enumerable: true,
    get: function () {
      return _inc.inc;
    }
  });
});
;define('we-admin-hotel/helpers/intersect', ['exports', 'ember-composable-helpers/helpers/intersect'], function (exports, _intersect) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _intersect.default;
    }
  });
  Object.defineProperty(exports, 'intersect', {
    enumerable: true,
    get: function () {
      return _intersect.intersect;
    }
  });
});
;define('we-admin-hotel/helpers/invoke', ['exports', 'ember-composable-helpers/helpers/invoke'], function (exports, _invoke) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _invoke.default;
    }
  });
  Object.defineProperty(exports, 'invoke', {
    enumerable: true,
    get: function () {
      return _invoke.invoke;
    }
  });
});
;define('we-admin-hotel/helpers/is-after', ['exports', 'ember-moment/helpers/is-after'], function (exports, _isAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isAfter.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-array', ['exports', 'ember-truth-helpers/helpers/is-array'], function (exports, _isArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isArray.default;
    }
  });
  Object.defineProperty(exports, 'isArray', {
    enumerable: true,
    get: function () {
      return _isArray.isArray;
    }
  });
});
;define('we-admin-hotel/helpers/is-before', ['exports', 'ember-moment/helpers/is-before'], function (exports, _isBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBefore.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-between', ['exports', 'ember-moment/helpers/is-between'], function (exports, _isBetween) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isBetween.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-empty', ['exports', 'ember-truth-helpers/helpers/is-empty'], function (exports, _isEmpty) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEmpty.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-equal', ['exports', 'ember-truth-helpers/helpers/is-equal'], function (exports, _isEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
  Object.defineProperty(exports, 'isEqual', {
    enumerable: true,
    get: function () {
      return _isEqual.isEqual;
    }
  });
});
;define('we-admin-hotel/helpers/is-same-or-after', ['exports', 'ember-moment/helpers/is-same-or-after'], function (exports, _isSameOrAfter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrAfter.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-same-or-before', ['exports', 'ember-moment/helpers/is-same-or-before'], function (exports, _isSameOrBefore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSameOrBefore.default;
    }
  });
});
;define('we-admin-hotel/helpers/is-same', ['exports', 'ember-moment/helpers/is-same'], function (exports, _isSame) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isSame.default;
    }
  });
});
;define('we-admin-hotel/helpers/join', ['exports', 'ember-composable-helpers/helpers/join'], function (exports, _join) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _join.default;
    }
  });
  Object.defineProperty(exports, 'join', {
    enumerable: true,
    get: function () {
      return _join.join;
    }
  });
});
;define('we-admin-hotel/helpers/local-class', ['exports', 'ember-css-modules/helpers/local-class'], function (exports, _localClass) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _localClass.default;
    }
  });
  Object.defineProperty(exports, 'localClass', {
    enumerable: true,
    get: function () {
      return _localClass.localClass;
    }
  });
});
;define('we-admin-hotel/helpers/lowercase', ['exports', 'ember-cli-string-helpers/helpers/lowercase'], function (exports, _lowercase) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lowercase.default;
    }
  });
  Object.defineProperty(exports, 'lowercase', {
    enumerable: true,
    get: function () {
      return _lowercase.lowercase;
    }
  });
});
;define('we-admin-hotel/helpers/lt', ['exports', 'ember-truth-helpers/helpers/lt'], function (exports, _lt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lt.default;
    }
  });
  Object.defineProperty(exports, 'lt', {
    enumerable: true,
    get: function () {
      return _lt.lt;
    }
  });
});
;define('we-admin-hotel/helpers/lte', ['exports', 'ember-truth-helpers/helpers/lte'], function (exports, _lte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _lte.default;
    }
  });
  Object.defineProperty(exports, 'lte', {
    enumerable: true,
    get: function () {
      return _lte.lte;
    }
  });
});
;define('we-admin-hotel/helpers/map-by', ['exports', 'ember-composable-helpers/helpers/map-by'], function (exports, _mapBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _mapBy.default;
    }
  });
  Object.defineProperty(exports, 'mapBy', {
    enumerable: true,
    get: function () {
      return _mapBy.mapBy;
    }
  });
});
;define('we-admin-hotel/helpers/map', ['exports', 'ember-composable-helpers/helpers/map'], function (exports, _map) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _map.default;
    }
  });
  Object.defineProperty(exports, 'map', {
    enumerable: true,
    get: function () {
      return _map.map;
    }
  });
});
;define('we-admin-hotel/helpers/moment-add', ['exports', 'ember-moment/helpers/moment-add'], function (exports, _momentAdd) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentAdd.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-calendar', ['exports', 'ember-moment/helpers/moment-calendar'], function (exports, _momentCalendar) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentCalendar.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-diff', ['exports', 'ember-moment/helpers/moment-diff'], function (exports, _momentDiff) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDiff.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-duration', ['exports', 'ember-moment/helpers/moment-duration'], function (exports, _momentDuration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentDuration.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-format', ['exports', 'ember-moment/helpers/moment-format'], function (exports, _momentFormat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFormat.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-from-now', ['exports', 'ember-moment/helpers/moment-from-now'], function (exports, _momentFromNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFromNow.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-from', ['exports', 'ember-moment/helpers/moment-from'], function (exports, _momentFrom) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentFrom.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-subtract', ['exports', 'ember-moment/helpers/moment-subtract'], function (exports, _momentSubtract) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentSubtract.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-to-date', ['exports', 'ember-moment/helpers/moment-to-date'], function (exports, _momentToDate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToDate.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-to-now', ['exports', 'ember-moment/helpers/moment-to-now'], function (exports, _momentToNow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentToNow.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-to', ['exports', 'ember-moment/helpers/moment-to'], function (exports, _momentTo) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _momentTo.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment-unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
;define('we-admin-hotel/helpers/moment', ['exports', 'ember-moment/helpers/moment'], function (exports, _moment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _moment.default;
    }
  });
});
;define('we-admin-hotel/helpers/next', ['exports', 'ember-composable-helpers/helpers/next'], function (exports, _next) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _next.default;
    }
  });
  Object.defineProperty(exports, 'next', {
    enumerable: true,
    get: function () {
      return _next.next;
    }
  });
});
;define('we-admin-hotel/helpers/not-eq', ['exports', 'ember-truth-helpers/helpers/not-equal'], function (exports, _notEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _notEqual.default;
    }
  });
  Object.defineProperty(exports, 'notEq', {
    enumerable: true,
    get: function () {
      return _notEqual.notEq;
    }
  });
});
;define('we-admin-hotel/helpers/not', ['exports', 'ember-truth-helpers/helpers/not'], function (exports, _not) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _not.default;
    }
  });
  Object.defineProperty(exports, 'not', {
    enumerable: true,
    get: function () {
      return _not.not;
    }
  });
});
;define('we-admin-hotel/helpers/now', ['exports', 'ember-moment/helpers/now'], function (exports, _now) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _now.default;
    }
  });
});
;define('we-admin-hotel/helpers/object-at', ['exports', 'ember-composable-helpers/helpers/object-at'], function (exports, _objectAt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _objectAt.default;
    }
  });
  Object.defineProperty(exports, 'objectAt', {
    enumerable: true,
    get: function () {
      return _objectAt.objectAt;
    }
  });
});
;define('we-admin-hotel/helpers/optional', ['exports', 'ember-composable-helpers/helpers/optional'], function (exports, _optional) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _optional.default;
    }
  });
  Object.defineProperty(exports, 'optional', {
    enumerable: true,
    get: function () {
      return _optional.optional;
    }
  });
});
;define('we-admin-hotel/helpers/or', ['exports', 'ember-truth-helpers/helpers/or'], function (exports, _or) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _or.default;
    }
  });
  Object.defineProperty(exports, 'or', {
    enumerable: true,
    get: function () {
      return _or.or;
    }
  });
});
;define('we-admin-hotel/helpers/perform', ['exports', 'ember-concurrency/helpers/perform'], function (exports, _perform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _perform.default;
    }
  });
});
;define('we-admin-hotel/helpers/pipe-action', ['exports', 'ember-composable-helpers/helpers/pipe-action'], function (exports, _pipeAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pipeAction.default;
    }
  });
});
;define('we-admin-hotel/helpers/pipe', ['exports', 'ember-composable-helpers/helpers/pipe'], function (exports, _pipe) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pipe.default;
    }
  });
  Object.defineProperty(exports, 'pipe', {
    enumerable: true,
    get: function () {
      return _pipe.pipe;
    }
  });
});
;define('we-admin-hotel/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _pluralize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pluralize.default;
});
;define('we-admin-hotel/helpers/previous', ['exports', 'ember-composable-helpers/helpers/previous'], function (exports, _previous) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _previous.default;
    }
  });
  Object.defineProperty(exports, 'previous', {
    enumerable: true,
    get: function () {
      return _previous.previous;
    }
  });
});
;define('we-admin-hotel/helpers/queue', ['exports', 'ember-composable-helpers/helpers/queue'], function (exports, _queue) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _queue.default;
    }
  });
  Object.defineProperty(exports, 'queue', {
    enumerable: true,
    get: function () {
      return _queue.queue;
    }
  });
});
;define('we-admin-hotel/helpers/range', ['exports', 'ember-composable-helpers/helpers/range'], function (exports, _range) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _range.default;
    }
  });
  Object.defineProperty(exports, 'range', {
    enumerable: true,
    get: function () {
      return _range.range;
    }
  });
});
;define('we-admin-hotel/helpers/reduce', ['exports', 'ember-composable-helpers/helpers/reduce'], function (exports, _reduce) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _reduce.default;
    }
  });
  Object.defineProperty(exports, 'reduce', {
    enumerable: true,
    get: function () {
      return _reduce.reduce;
    }
  });
});
;define('we-admin-hotel/helpers/reject-by', ['exports', 'ember-composable-helpers/helpers/reject-by'], function (exports, _rejectBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _rejectBy.default;
    }
  });
  Object.defineProperty(exports, 'rejectBy', {
    enumerable: true,
    get: function () {
      return _rejectBy.rejectBy;
    }
  });
});
;define('we-admin-hotel/helpers/repeat', ['exports', 'ember-composable-helpers/helpers/repeat'], function (exports, _repeat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _repeat.default;
    }
  });
  Object.defineProperty(exports, 'repeat', {
    enumerable: true,
    get: function () {
      return _repeat.repeat;
    }
  });
});
;define('we-admin-hotel/helpers/reverse', ['exports', 'ember-composable-helpers/helpers/reverse'], function (exports, _reverse) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _reverse.default;
    }
  });
  Object.defineProperty(exports, 'reverse', {
    enumerable: true,
    get: function () {
      return _reverse.reverse;
    }
  });
});
;define('we-admin-hotel/helpers/shuffle', ['exports', 'ember-composable-helpers/helpers/shuffle'], function (exports, _shuffle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _shuffle.default;
    }
  });
  Object.defineProperty(exports, 'shuffle', {
    enumerable: true,
    get: function () {
      return _shuffle.shuffle;
    }
  });
});
;define('we-admin-hotel/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _singularize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _singularize.default;
});
;define('we-admin-hotel/helpers/slice', ['exports', 'ember-composable-helpers/helpers/slice'], function (exports, _slice) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _slice.default;
    }
  });
  Object.defineProperty(exports, 'slice', {
    enumerable: true,
    get: function () {
      return _slice.slice;
    }
  });
});
;define('we-admin-hotel/helpers/sort-by', ['exports', 'ember-composable-helpers/helpers/sort-by'], function (exports, _sortBy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _sortBy.default;
    }
  });
  Object.defineProperty(exports, 'sortBy', {
    enumerable: true,
    get: function () {
      return _sortBy.sortBy;
    }
  });
});
;define('we-admin-hotel/helpers/t', ['exports', 'ember-i18n/helper'], function (exports, _helper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _helper.default;
    }
  });
});
;define('we-admin-hotel/helpers/take', ['exports', 'ember-composable-helpers/helpers/take'], function (exports, _take) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _take.default;
    }
  });
  Object.defineProperty(exports, 'take', {
    enumerable: true,
    get: function () {
      return _take.take;
    }
  });
});
;define('we-admin-hotel/helpers/task', ['exports', 'ember-concurrency/helpers/task'], function (exports, _task) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _task.default;
    }
  });
});
;define('we-admin-hotel/helpers/titleize', ['exports', 'ember-cli-string-helpers/helpers/titleize'], function (exports, _titleize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _titleize.default;
    }
  });
  Object.defineProperty(exports, 'titleize', {
    enumerable: true,
    get: function () {
      return _titleize.titleize;
    }
  });
});
;define('we-admin-hotel/helpers/toggle-action', ['exports', 'ember-composable-helpers/helpers/toggle-action'], function (exports, _toggleAction) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggleAction.default;
    }
  });
});
;define('we-admin-hotel/helpers/toggle', ['exports', 'ember-composable-helpers/helpers/toggle'], function (exports, _toggle) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
  Object.defineProperty(exports, 'toggle', {
    enumerable: true,
    get: function () {
      return _toggle.toggle;
    }
  });
});
;define('we-admin-hotel/helpers/trim', ['exports', 'ember-cli-string-helpers/helpers/trim'], function (exports, _trim) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _trim.default;
    }
  });
  Object.defineProperty(exports, 'trim', {
    enumerable: true,
    get: function () {
      return _trim.trim;
    }
  });
});
;define('we-admin-hotel/helpers/truncate-text', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function truncateText(params, hash) {
    const [value] = params;
    const { limit } = hash;
    let text = '';

    if (value != null && value.length > 0) {
      text = value.substr(0, limit);

      if (value.length > limit) {
        text += '...';
      }
    }

    return text;
  }

  exports.default = Ember.Helper.helper(truncateText);
});
;define('we-admin-hotel/helpers/truncate', ['exports', 'ember-cli-string-helpers/helpers/truncate'], function (exports, _truncate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _truncate.default;
    }
  });
  Object.defineProperty(exports, 'truncate', {
    enumerable: true,
    get: function () {
      return _truncate.truncate;
    }
  });
});
;define('we-admin-hotel/helpers/underscore', ['exports', 'ember-cli-string-helpers/helpers/underscore'], function (exports, _underscore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _underscore.default;
    }
  });
  Object.defineProperty(exports, 'underscore', {
    enumerable: true,
    get: function () {
      return _underscore.underscore;
    }
  });
});
;define('we-admin-hotel/helpers/union', ['exports', 'ember-composable-helpers/helpers/union'], function (exports, _union) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _union.default;
    }
  });
  Object.defineProperty(exports, 'union', {
    enumerable: true,
    get: function () {
      return _union.union;
    }
  });
});
;define('we-admin-hotel/helpers/unix', ['exports', 'ember-moment/helpers/unix'], function (exports, _unix) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
;define('we-admin-hotel/helpers/uppercase', ['exports', 'ember-cli-string-helpers/helpers/uppercase'], function (exports, _uppercase) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _uppercase.default;
    }
  });
  Object.defineProperty(exports, 'uppercase', {
    enumerable: true,
    get: function () {
      return _uppercase.uppercase;
    }
  });
});
;define('we-admin-hotel/helpers/utc', ['exports', 'ember-moment/helpers/utc'], function (exports, _utc) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _utc.default;
    }
  });
  Object.defineProperty(exports, 'utc', {
    enumerable: true,
    get: function () {
      return _utc.utc;
    }
  });
});
;define('we-admin-hotel/helpers/w', ['exports', 'ember-cli-string-helpers/helpers/w'], function (exports, _w) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _w.default;
    }
  });
  Object.defineProperty(exports, 'w', {
    enumerable: true,
    get: function () {
      return _w.w;
    }
  });
});
;define('we-admin-hotel/helpers/without', ['exports', 'ember-composable-helpers/helpers/without'], function (exports, _without) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _without.default;
    }
  });
  Object.defineProperty(exports, 'without', {
    enumerable: true,
    get: function () {
      return _without.without;
    }
  });
});
;define('we-admin-hotel/helpers/xor', ['exports', 'ember-truth-helpers/helpers/xor'], function (exports, _xor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _xor.default;
    }
  });
  Object.defineProperty(exports, 'xor', {
    enumerable: true,
    get: function () {
      return _xor.xor;
    }
  });
});
;define('we-admin-hotel/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'we-admin-hotel/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let name, version;
  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
;define('we-admin-hotel/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize() {
      let app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
;define('we-admin-hotel/initializers/ember-concurrency', ['exports', 'ember-concurrency/initializers/ember-concurrency'], function (exports, _emberConcurrency) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberConcurrency.default;
    }
  });
});
;define('we-admin-hotel/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data'], function (exports, _setupContainer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
});
;define('we-admin-hotel/initializers/ember-i18n', ['exports', 'ember-i18n/initializers/ember-i18n'], function (exports, _emberI18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberI18n.default;
});
;define('we-admin-hotel/initializers/ember-simple-auth', ['exports', 'we-admin-hotel/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service', 'ember-simple-auth/initializers/setup-session-restoration'], function (exports, _environment, _configuration, _setupSession, _setupSessionService, _setupSessionRestoration) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize(registry) {
      const config = _environment.default['ember-simple-auth'] || {};
      config.rootURL = _environment.default.rootURL || _environment.default.baseURL;
      _configuration.default.load(config);

      (0, _setupSession.default)(registry);
      (0, _setupSessionService.default)(registry);
      (0, _setupSessionRestoration.default)(registry);
    }
  };
});
;define('we-admin-hotel/initializers/export-application-global', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function () {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
;define('we-admin-hotel/initializers/load-bootstrap-config', ['exports', 'we-admin-hotel/config/environment', 'ember-bootstrap/config'], function (exports, _environment, _config) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() /* container, application */{
    _config.default.load(_environment.default['ember-bootstrap'] || {});
  }

  exports.default = {
    name: 'load-bootstrap-config',
    initialize
  };
});
;define('we-admin-hotel/initializers/notifications', ['exports', 'ember-cli-notifications/services/notification-messages-service'], function (exports, _notificationMessagesService) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = {
        name: 'notification-messages-service',

        initialize() {
            let application = arguments[1] || arguments[0];
            if (Ember.Service) {
                application.register('service:notification-messages', _notificationMessagesService.default);
                application.inject('component:notification-container', 'notifications', 'service:notification-messages');
                application.inject('component:notification-message', 'notifications', 'service:notification-messages');
                return;
            }
            application.register('notification-messages:service', _notificationMessagesService.default);

            ['controller', 'component', 'route', 'router', 'service'].forEach(injectionTarget => {
                application.inject(injectionTarget, 'notifications', 'notification-messages:service');
            });
        }
    };
});
;define('we-admin-hotel/instance-initializers/ember-data', ['exports', 'ember-data/initialize-store-service'], function (exports, _initializeStoreService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-data',
    initialize: _initializeStoreService.default
  };
});
;define('we-admin-hotel/instance-initializers/ember-i18n', ['exports', 'ember-i18n/instance-initializers/ember-i18n'], function (exports, _emberI18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberI18n.default;
});
;define('we-admin-hotel/instance-initializers/ember-simple-auth', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-simple-auth',

    initialize() {}
  };
});
;define('we-admin-hotel/instance-initializers/session-events', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize(instance) {
    // const applicationRoute = instance.lookup('route:application');
    const session = instance.lookup('service:session');
    // const settings         = instance.lookup('service:settings');

    session.on('authenticationSucceeded', function () {
      window.location.reload();
      // TODO! add suport for dinamicaly set context
      // // get user settings ,,,
      // settings.getUserSettings()
      // .then( ()=> {
      //   applicationRoute.transitionTo('index');
      // });
    });
    session.on('invalidationSucceeded', function () {
      window.location.reload();
    });
  }

  exports.default = {
    initialize,
    name: 'session-events'
  };
});
;define('we-admin-hotel/mixins/active-link', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  // these are not currently editable in Ember
  const transitioningInClass = 'ember-transitioning-in';
  const transitioningOutClass = 'ember-transitioning-out';

  exports.default = Ember.Mixin.create({

    classNameBindings: ['_active', '_disabled', '_transitioningIn', '_transitioningOut'],
    linkSelector: 'a.ember-view',

    init() {
      this._super(...arguments);

      this.set('childLinkViews', Ember.A([]));
    },

    buildChildLinkViews: Ember.on('didInsertElement', function () {
      Ember.run.scheduleOnce('afterRender', this, function () {
        let childLinkSelector = this.get('linkSelector');
        let childLinkElements = this.$(childLinkSelector);
        let viewRegistry = Ember.getOwner(this).lookup('-view-registry:main');

        let childLinkViews = childLinkElements.toArray().map(view => viewRegistry[view.id]);

        this.set('childLinkViews', Ember.A(childLinkViews));
      });
    }),

    _transitioningIn: Ember.computed('childLinkViews.@each.transitioningIn', function () {
      if (this.get('childLinkViews').isAny('transitioningIn')) {
        return transitioningInClass;
      }
    }),

    _transitioningOut: Ember.computed('childLinkViews.@each.transitioningOut', function () {
      if (this.get('childLinkViews').isAny('transitioningOut')) {
        return transitioningOutClass;
      }
    }),

    hasActiveLinks: Ember.computed('childLinkViews.@each.active', function () {
      return this.get('childLinkViews').isAny('active');
    }),

    activeClass: Ember.computed('childLinkViews.@each.active', function () {
      let activeLink = this.get('childLinkViews').findBy('active');
      return activeLink ? activeLink.get('active') : 'active';
    }),

    _active: Ember.computed('hasActiveLinks', 'activeClass', function () {
      return this.get('hasActiveLinks') ? this.get('activeClass') : false;
    }),

    allLinksDisabled: Ember.computed('childLinkViews.@each.disabled', function () {
      return !Ember.isEmpty(this.get('childLinkViews')) && this.get('childLinkViews').isEvery('disabled');
    }),

    disabledClass: Ember.computed('childLinkViews.@each.disabled', function () {
      let disabledLink = this.get('childLinkViews').findBy('disabled');
      return disabledLink ? disabledLink.get('disabled') : 'disabled';
    }),

    _disabled: Ember.computed('allLinksDisabled', 'disabledClass', function () {
      return this.get('allLinksDisabled') ? this.get('disabledClass') : false;
    })

  });
});
;define('we-admin-hotel/models/comment', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    body: _emberData.default.attr('string'),
    teaser: Ember.computed('body', function () {
      const body = this.get('body');

      if (!body || !body.trim) {
        return '';
      }

      let teaser = body.trim();
      if (!teaser) {
        return '';
      }

      return trimText(removeTags(body), 150);
    }),
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    modelName: _emberData.default.attr('string'),
    modelId: _emberData.default.attr('string'),

    creator: _emberData.default.belongsTo('user', {
      async: true
    }),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });


  function removeTags(str) {
    return str.replace(/<{1}[^<>]{1,}>{1}/g, " ");
  }

  function trimText(value, limit) {
    if (value != null && value.length > 0) {
      let text = value.substr(0, limit);

      if (value.length > limit) {
        text += '...';
      }

      return text;
    }

    return value;
  }
});
;define('we-admin-hotel/models/content', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    active: _emberData.default.attr('boolean'),
    published: _emberData.default.attr('boolean'),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    showInLists: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    allowComments: _emberData.default.attr('boolean', {
      defaultValue: false
    }),
    title: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      inverse: 'contents'
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),
    tags: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    attachment: _emberData.default.attr('array'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/d-form-answer', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    email: _emberData.default.attr('string'),

    vCache: _emberData.default.attr('array'),
    vCacheByFieldId: Ember.computed('vCache', function () {
      const vCache = this.get('vCache');
      const byFID = {};
      for (var i = 0; i < vCache.get('length'); i++) {
        let v = vCache.objectAt(i);
        byFID[v.fieldId] = v.value;
      }

      return byFID;
    }),

    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    values: _emberData.default.hasMany('d-form-value', {
      inverse: 'answer',
      async: true
    }),
    form: _emberData.default.belongsTo('d-form', {
      inverse: 'answers',
      async: true
    }),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/d-form-field', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    label: _emberData.default.attr('string'),
    placeholder: _emberData.default.attr('string'),
    help: _emberData.default.attr('string'),
    type: _emberData.default.attr('string'),
    defaultValue: _emberData.default.attr('string'),
    allowNull: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    weight: _emberData.default.attr('number'),

    validate: _emberData.default.attr(),
    fieldOptions: _emberData.default.attr(),
    formFieldAttributes: _emberData.default.attr(),

    informationField: Ember.computed('type', function () {
      const type = this.get('type');
      if (type === 'title' || type === 'description') {
        return true;
      }
      return false;
    }),

    publishedAt: _emberData.default.attr('date'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    fields: _emberData.default.hasMany('d-form-field', {
      inverse: 'group',
      async: true
    }),
    group: _emberData.default.belongsTo('d-form-field', {
      inverse: 'fields',
      async: true
    }),
    form: _emberData.default.belongsTo('d-form', {
      inverse: 'fields',
      async: true
    }),

    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/d-form-value', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    email: _emberData.default.attr('string'),

    values: _emberData.default.attr('array'),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    answer: _emberData.default.belongsTo('d-form-answer', {
      inverse: 'values',
      async: true
    }),

    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/d-form', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    title: _emberData.default.attr('string'),
    subject: _emberData.default.attr('string'),
    formName: _emberData.default.attr('string'),
    replyTo: _emberData.default.attr('string'),
    to: _emberData.default.attr('string'),
    redirectToOnSuccess: _emberData.default.attr('string'),

    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    fields: _emberData.default.hasMany('d-form-field', {
      inverse: 'form',
      async: true
    }),
    answers: _emberData.default.hasMany('d-form-answer', {
      inverse: 'form',
      async: true
    }),
    published: _emberData.default.attr('boolean', {
      defaultValue: false
    }),
    publishedAt: _emberData.default.attr('date'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/email-template', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    subject: _emberData.default.attr('string'),
    text: _emberData.default.attr('string'),
    css: _emberData.default.attr('string'),
    html: _emberData.default.attr('string'),
    type: _emberData.default.attr('string'),
    typeSettings: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/models/hotel-card', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    fullName: _emberData.default.attr('string'),
    gender: _emberData.default.attr('string'),
    birthdate: _emberData.default.attr('date'),
    ocupationJob: _emberData.default.attr('string'),
    travelDocument: _emberData.default.attr('string'),
    type: _emberData.default.attr('string'),
    issuingCountry: _emberData.default.attr('string'),
    homeAddress: _emberData.default.attr('string'),
    zipCode: _emberData.default.attr('string'),
    phoneNumber: _emberData.default.attr('string'),
    city: _emberData.default.attr('string'),
    state: _emberData.default.attr('string'),
    country: _emberData.default.attr('string'),
    nationality: _emberData.default.attr('string'),
    cpf: _emberData.default.attr('string'),

    ciCompany: _emberData.default.attr('string'),
    ciOcupation: _emberData.default.attr('string'),
    ciSmoke: _emberData.default.attr('boolean'),
    ciAddress: _emberData.default.attr('string'),
    ciZipCode: _emberData.default.attr('string'),
    ciCity: _emberData.default.attr('string'),
    ciState: _emberData.default.attr('string'),
    ciCountry: _emberData.default.attr('string'),
    ciPhoneNumber: _emberData.default.attr('string'),

    accConditions: _emberData.default.attr('boolean', {
      defaultValue: true
    }),

    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/hotel-event-structure', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    name: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),
    tags: _emberData.default.attr(),
    category: _emberData.default.attr(),
    cats: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/hotel-infrastructure', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    name: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),
    tags: _emberData.default.attr(),
    category: _emberData.default.attr(),
    cats: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/hotel-room', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    showInLists: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    name: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),
    tags: _emberData.default.attr(),
    category: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/link', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  function isExternal(url) {
    var match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);
    if (typeof match[1] === "string" && match[1].length > 0 && match[1].toLowerCase() !== location.protocol) {
      return true;
    }
    if (typeof match[2] === "string" && match[2].length > 0 && match[2].replace(new RegExp(":(" + { "http:": 80, "https:": 443 }[location.protocol] + ")?$"), "") !== location.host) {
      return true;
    }
    return false;
  }

  exports.default = _emberData.default.Model.extend({
    href: _emberData.default.attr('string'),
    text: _emberData.default.attr('string'),
    title: _emberData.default.attr('string'),
    class: _emberData.default.attr('string'),
    style: _emberData.default.attr('string'),
    target: _emberData.default.attr('string'),

    modelName: _emberData.default.attr('string'),
    modelId: _emberData.default.attr('string'),
    type: _emberData.default.attr('string'),
    userRole: _emberData.default.attr('string'),

    rel: _emberData.default.attr('string'),
    key: _emberData.default.attr('string'),
    depth: _emberData.default.attr('number'),
    weight: _emberData.default.attr('number'),
    parent: _emberData.default.attr('number'),
    links: _emberData.default.attr('array', {
      defaultValue() {
        return Ember.A();
      }
    }),
    menu: _emberData.default.belongsTo('menu', {
      inverse: 'links',
      async: true
    }),
    identation: Ember.computed('depth', function () {
      const depth = this.get('depth');
      let identation = '';

      if (depth) {
        for (let i = 0; i < depth; i++) {
          identation += '<div class="indentation">&nbsp;</div>';
        }
      }

      return Ember.String.htmlSafe(identation);
    }),

    isInternalLink: Ember.computed('href', function () {
      const href = this.get('href');
      if (!href) {
        return false;
      }
      // check if is internal url
      return !isExternal(href);
    }),
    linkPermanent: _emberData.default.attr('string'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/models/menu', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    label: _emberData.default.attr('string', {
      defaultValue: 'TODO!'
    }),
    description: _emberData.default.attr('string'),
    class: _emberData.default.attr('string'),
    sorted: _emberData.default.attr('boolean'),
    links: _emberData.default.hasMany('link', {
      inverse: 'menu',
      async: true
    }),
    linkPermanent: _emberData.default.attr('string'),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/models/news', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    showInLists: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    allowComments: _emberData.default.attr('boolean', {
      defaultValue: false
    }),
    title: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),
    category: _emberData.default.attr(),
    tags: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    attachment: _emberData.default.attr('array'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/simple-event', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    showInLists: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    name: _emberData.default.attr('string'),
    about: _emberData.default.attr('string'),
    body: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user', {
      async: true
    }),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    publishedAt: _emberData.default.attr('date'),

    registrationStartDate: _emberData.default.attr('date'),
    registrationEndDate: _emberData.default.attr('date'),
    eventStartDate: _emberData.default.attr('date'),
    eventEndDate: _emberData.default.attr('date'),

    registrationManagerName: _emberData.default.attr('string'),
    registrationManagerEmail: _emberData.default.attr('string'),

    registrationLink: _emberData.default.attr('string'),

    vacancies: _emberData.default.attr('number'),

    tags: _emberData.default.attr(),
    category: _emberData.default.attr(),
    featuredImage: _emberData.default.attr('array'),
    images: _emberData.default.attr('array'),
    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/sitecontact-form', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    subject: _emberData.default.attr('string'),
    contactWithEmail: _emberData.default.attr('string'),
    emailBody: _emberData.default.attr('string'),
    successEmailBodyTemplate: _emberData.default.attr('string'),

    publishedAt: _emberData.default.attr('date'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    linkPermanent: _emberData.default.attr('string')
  });
});
;define('we-admin-hotel/models/sitecontact', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    email: _emberData.default.attr('string'),
    phone: _emberData.default.attr('string'),
    message: _emberData.default.attr('string'),
    status: _emberData.default.attr('string', {
      defaultValue: 'opened'
    }),
    statusClass: _emberData.default.attr('string'),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),

    linkPermanent: _emberData.default.attr('string'),

    isClosed: Ember.computed('status', function () {
      return this.get('status') === 'closed';
    })
  });
});
;define('we-admin-hotel/models/slide', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    title: _emberData.default.attr('string'),
    highlighted: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    description: _emberData.default.attr('string'),
    link: _emberData.default.attr('string'),
    linkText: _emberData.default.attr('string'),
    published: _emberData.default.attr('boolean', {
      defaultValue: true
    }),
    publishedAt: _emberData.default.attr('date'),
    slideshowId: _emberData.default.attr('string', {
      defaultValue: 1
    }),
    creator: _emberData.default.belongsTo('user', {
      inverse: 'slides'
    }),
    linkPermanent: _emberData.default.attr('string'),
    image: _emberData.default.attr('array')
  });
});
;define('we-admin-hotel/models/term', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    text: _emberData.default.attr('string'),
    description: _emberData.default.attr('string'),
    vocabularyName: _emberData.default.attr('string'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string'),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/models/url-alia', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    alias: _emberData.default.attr('string'),
    target: _emberData.default.attr('string'),
    locale: _emberData.default.attr('string'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/models/user', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    displayName: _emberData.default.attr('string'),
    username: _emberData.default.attr('string'),
    fullName: _emberData.default.attr('string'),
    biography: _emberData.default.attr('string'),
    gender: _emberData.default.attr('string'),
    email: _emberData.default.attr('string'),
    active: _emberData.default.attr('boolean'),
    blocked: _emberData.default.attr('boolean'),
    language: _emberData.default.attr('string'),
    roles: _emberData.default.attr(),
    contents: _emberData.default.hasMany('content', {
      inverse: 'creator',
      async: true
    }),
    slides: _emberData.default.hasMany('slide', {
      inverse: 'creator',
      async: true
    }),
    linkPermanent: _emberData.default.attr('string'),
    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date'),
    avatar: _emberData.default.attr('array')
  });
});
;define('we-admin-hotel/models/vocabulary', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    description: _emberData.default.attr('string'),
    creator: _emberData.default.belongsTo('user'),

    setAlias: _emberData.default.attr('string'),
    linkPermanent: _emberData.default.attr('string'),

    createdAt: _emberData.default.attr('date'),
    updatedAt: _emberData.default.attr('date')
  });
});
;define('we-admin-hotel/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
;define('we-admin-hotel/router', ['exports', 'we-admin-hotel/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  Router.map(function () {
    this.route('user');

    this.route('login');
    this.route('forgot-password');
    this.route('logout');

    this.route('profile', function () {
      this.route('change-password');
    });

    this.route('contents', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('news', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('hotel-rooms', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('hotel-cards', function () {
      this.route('create');
      this.route('conditions');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('hotel-event-structures', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('hotel-infrastructures', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('simple-events', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('site-contacts', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('users', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('url-alia', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('menus', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {
        this.route('add-link');
        this.route('edit-link', { path: ':linkid' }, function () {});
      });
    });

    this.route('slides', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('vocabulary', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {
        this.route('terms', function () {
          this.route('create');
          this.route('item', { path: ':id' }, function () {});
        });
      });
    });

    this.route('permissions');
    this.route('roles');

    this.route('settings', function () {
      this.route('project');
      this.route('integrations');
      this.route('theme', function () {
        this.route('change', function () {
          this.route('color', { path: ':id' });
        });
      });
    });

    this.route('site-contact-forms', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('email-templates', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('widgets');

    this.route('d-forms', function () {
      this.route('create');
      this.route('item', { path: ':id' }, function () {
        this.route('edit');
        this.route('use');
        this.route('answers', function () {
          this.route('item', { path: ':answer_id' }, function () {});
        });
      });
    });

    this.route('comments', function () {
      this.route('item', { path: ':id' }, function () {});
    });

    this.route('not-found', { path: '/*path' });
  });

  exports.default = Router;
});
;define('we-admin-hotel/routes/application', ['exports', 'ember-simple-auth/mixins/application-route-mixin'], function (exports, _applicationRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_applicationRouteMixin.default, {
    session: Ember.inject.service(),
    acl: Ember.inject.service(),

    ENV: null,

    init() {
      this.set('ENV', Ember.getOwner(this).resolveRegistration('config:environment'));
      this._super(...arguments);
    },

    beforeModel() {
      this._super(...arguments);

      const ENV = this.get('ENV');

      this.get('notifications').setDefaultAutoClear(true);
      this.get('notifications').setDefaultClearDuration(5200);

      let jobs = {};

      if (typeof tinymce === 'undefined') {
        jobs['tinymce'] = Ember.$.getScript(ENV.API_HOST + '/public/plugin/we-plugin-editor-tinymce/files/tinymce.min.js');
      }

      jobs['locales'] = this.getLocalesFromHost();

      return Ember.RSVP.hash(jobs);
    },
    model() {
      return Ember.RSVP.hash({
        loadedSettings: this.get('settings').getUserSettings(),
        minimumLoadingDelay: new window.Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, 500);
        })
      });
    },
    afterModel() {
      this.set('i18n.locale', this.get('settings.data.activeLocale') || 'pt-br');

      document.title = this.get('settings.systemSettings.siteName') + ' | ' + document.title;
    },

    /**
     * Get locales from host
     *
     */
    getLocalesFromHost() {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return new window.Promise((resolve, reject) => {
        Ember.$.ajax({
          url: `${ENV.API_HOST}/i18n/get-all-locales`,
          type: 'GET'
        }).done(data => {
          if (data && data.locales) {
            // load locales with ember-i18n
            for (let name in data.locales) {
              this.get('i18n').addTranslations(name, data.locales[name]);
            }
          }

          resolve();
        }).fail(reject);
      });
    },
    actions: {
      goTo(route, params) {
        if (params) {
          this.transitionTo(route, params);
        } else {
          this.transitionTo(route);
        }
      },
      showLoginModal() {
        this.set('showLoginModal', true);
      },
      /**
       * Application error handler
       *
       * @param  {Object} err Error object
       */
      error(err) {
        // handle token invalid response, this may occurs if the token is deleted in backend for block access
        if (err.status === 401 && err.responseJSON && err.responseJSON.error === 'invalid_grant' && err.responseJSON.error_context === 'authentication') {
          console.log('TODO add message for invalid token invalid_grant', err);
          this.get('session').invalidate();
          return;
        } else if (err.errors && err.errors[0].status === '404') {
          // log it
          Ember.Logger.error('404', err);
          // show message
          this.get('notifications').error('<code>404</code> não encontrado.');
          // redirect ... to 404
          this.transitionTo('/not-found');
        } else {
          this.get('notifications').error('Ocorreu um erro inesperado no servidor!<br>Tente novamente mais tarde ou entre em contato com o administrador do sistema.', {
            htmlContent: true,
            clearDuration: 10000
          });
          Ember.Logger.error(err);
        }
      },
      queryError(err) {
        // todo! add an better validation handling here...
        if (err && err.errors) {
          err.errors.forEach(e => {
            if (e.errorName === 'SequelizeValidationError') {
              // todo! add an better validation handling here...
              this.get('notifications').error(e.title);
            } else {
              this.get('notifications').error(e.title);
            }
          });
        } else if (err && err.responseJSON && err.responseJSON.meta && err.responseJSON.meta.messages) {
          err.responseJSON.meta.messages.forEach(e => {
            switch (e.status) {
              case 'warning':
                this.get('notifications').warning(e.message);
                break;
              case 'success':
                this.get('notifications').success(e.message);
                break;
              default:
                this.get('notifications').error(e.message);
            }
          });
        } else if (err && err.responseJSON && err.responseJSON && err.responseJSON.messages) {
          err.responseJSON.messages.forEach(e => {
            switch (e.status) {
              case 'warning':
                this.get('notifications').warning(e.message);
                break;
              case 'success':
                this.get('notifications').success(e.message);
                break;
              default:
                this.get('notifications').error(e.message);
            }
          });
        } else {
          console.error('Unknow query error', err);
        }
      },

      scrollToTop() {
        // move scroll to top:
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      }
    }
  });
});
;define('we-admin-hotel/routes/comments', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      },
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o comentário #"${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O comentário #"${record.get('id')}" foi deletado.`);
            this.transitionTo('comments.index');
            return null;
          });
        }
      }
    }
  });
});
;define('we-admin-hotel/routes/comments/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return {
        record: this.store.createRecord('comment')
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Comentário adicionado com sucesso.');

          this.transitionTo('/comments/' + r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/comments/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {

      return Ember.RSVP.hash({
        records: this.get('store').query('comment', {}),
        columns: [
        // {
        //   propertyName: 'id',
        //   title: 'ID',
        //   className: 'mt-c-id'
        // },
        {
          propertyName: 'creator',
          filteredBy: 'creatorId_starts-with',
          title: 'Autor',
          className: 'mt-c-creator text-cell',
          component: 'mt-creator'
        }, {
          propertyName: 'body',
          filteredBy: 'body_contains',
          title: 'Comentário',
          className: 'mt-c-body text-cell',
          component: 'mt-comment-body'
        }, {
          propertyName: 'modelId',
          filteredBy: 'modelId',
          title: 'Em resposta para',
          component: 'mt-comment-in-repply-to',
          className: 'mt-c-body text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Enviado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-comment'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/comments/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('comment', params.id)
      });
    }
  });
});
;define('we-admin-hotel/routes/contents', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o conteúdo "${record.get('title')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O conteúdo "${record.get('title')}" foi deletado.`);
            this.transitionTo('contents.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Conteúdo publicado.');
          } else {
            this.get('notifications').success('Conteúdo despublicado.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/contents/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return {
        record: this.store.createRecord('content', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Artigo criado com sucesso.');

          this.transitionTo('contents.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/contents/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('content', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'title',
          filteredBy: 'title',
          title: i18n.t('form-content-title'),
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'creator.displayName',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('content.creator')
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-content'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/contents/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('content', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/content/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      let id = Ember.get(model, 'record.id');

      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/content/' + id,
          alias: '/conteudo/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/d-form-answers', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar a resposta "${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`A resposta "${record.get('id')}" foi deletada.`);
            this.transitionTo('d-form-answers.index');
            return null;
          });
        }
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/d-form-answers/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'we-admin-hotel/config/environment'], function (exports, _authenticatedRouteMixin, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      return Ember.RSVP.hash({
        ENV: _environment.default,
        records: this.get('store').query('d-form-answer', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'email',
          filteredBy: 'email_contains',
          title: 'Email',
          className: 'mt-c-email text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Criado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-d-form-answer'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/d-form-answers/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('d-form-answer', params.id)
      });
    }
  });
});
;define('we-admin-hotel/routes/d-forms', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o formulário "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O formulário "${record.get('name')}" foi deletado.`);
            this.transitionTo('d-forms.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Formulário publicado.');
          } else {
            this.get('notifications').success('Formulário despublicado.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      },
      changeDate(x, y, z) {
        console.log('>', x, y, z);
      }
    }
  });
});
;define('we-admin-hotel/routes/d-forms/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return {
        record: this.store.createRecord('d-form', {
          published: false
        })
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Formulário registrado com sucesso.');

          this.transitionTo('/d-forms/' + r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/d-forms/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      return Ember.RSVP.hash({
        records: this.get('store').query('d-form', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'publishedAt',
          disableSorting: true,
          disableFiltering: true,
          title: 'Publicado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-publishedAt'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Criado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-d-form'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/d-forms/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return Ember.RSVP.hash({
        ENV: ENV,
        record: this.get('store').findRecord('d-form', params.id),
        alias: this.get('store').query('url-alia', {
          target: '/d-form/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      const id = get(model, 'record.id');

      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/d-form/' + id,
          alias: '/d-form/' + id
        });
      }

      if (id) {
        return this.get('store').query('d-form-field', {
          formId: id,
          order: 'weight ASC'
        });
      }
    },

    actions: {
      addItem(type) {
        let field = this.get('store').createRecord('d-form-field', {
          name: null,
          type: type,
          weight: 60
        });

        let form = this.get('currentModel.record');
        field.set('form', form);
      },

      deleteItem(item) {
        if (confirm(`Tem certeza que deseja deletar o campo? \nEssa ação não pode ser desfeita.`)) {
          const state = item.get('currentState.stateName');
          if (state === 'root.loaded.created.uncommitted') {
            item.deleteRecord();
            return;
          }

          item.destroyRecord().then(() => {
            this.get('notifications').success(`Campo deletado.`);
            return null;
          });
        }
      },

      saveForm(form) {
        const fields = form.get('fields');

        let fieldsToUpdate = [];

        for (let i = 0; i < fields.get('length'); i++) {
          let field = fields.objectAt(i);
          // only update if field is changed:
          if (field.get('isNew') || Object.keys(field.changedAttributes()).length) {
            fieldsToUpdate.push(field);
          }
        }

        const saves = [];
        // if form is updated:
        if (Object.keys(form.changedAttributes()).length) {
          saves.push(form.save().then(f => {
            const fi = f.get('fields');
            return fi.addObjects(fields);
          }));
        }

        fieldsToUpdate.forEach(f => {
          saves.push(f.save());
        });

        window.Promise.all(saves).then(() => {
          this.get('notifications').success(`Formulário salvo.`);
          return null;
        });
      },

      /**
       * On sort menu links list
       *
       * @param  {Object} options.event
       * @param  {Object} options.toComponent
       * @param  {Object} options.fromComponent
       * @param  {Object} options.itemComponent
       */
      onSortEnd({ event, toComponent, fromComponent }) {
        console.log(fromComponent.sortedFields, toComponent.sortedFields, event.oldIndex, event.newIndex);

        const toFields = get(toComponent, 'sortedFields');
        const fromFields = get(fromComponent, 'sortedFields');

        if (fromFields === toFields && event.oldIndex === event.newIndex) {
          return;
        }

        const item = fromFields.objectAt(event.oldIndex);

        let inc = 1;
        for (let i = 0; i < toFields.get('length'); i++) {
          let field = toFields.objectAt(i);
          if (Number(i) === Number(event.newIndex)) {
            item.set('weight', i + inc);
            inc++;
          }
          if (field !== item) {
            field.set('weight', i + inc);
          }
        }

        Ember.set(this, 'currentModel.record.updated', true);
      }
    },

    resetFieldsWeight(fields, ctx) {
      for (let i = 0; i < fields.get('length'); i++) {
        this.resetFieldWeight(fields.objectAt(i), ctx);
      }
    },
    resetFieldWeight(field, ctx) {
      ctx.cw++;
      field.set('weight', ctx.cw);
    }
  });
});
;define('we-admin-hotel/routes/d-forms/item/answers/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  let ENV;
  const get = Ember.get;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },
    model() {
      const parentModel = this.modelFor('d-forms.item');
      const form = get(parentModel, 'record');

      return Ember.RSVP.hash({
        ENV: ENV,
        form: form,
        fields: this.get('store').query('d-form-field', {
          formId: form.id,
          order: 'weight ASC'
        }),
        records: this.get('store').query('d-form-answer', {
          formId: form.id
        })
      });
    }
  });
});
;define('we-admin-hotel/routes/d-forms/item/answers/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  const get = Ember.get;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      const parentModel = this.modelFor('d-forms.item');
      const form = get(parentModel, 'record');

      return Ember.RSVP.hash({
        form: form,
        fields: this.get('store').query('d-form-field', {
          formId: form.id,
          order: 'weight ASC'
        }),
        record: this.get('store').findRecord('d-form-answer', params.answerId)
      });
    }
  });
});
;define('we-admin-hotel/routes/email-templates', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  const set = Ember.set;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return Ember.RSVP.hash({
        emailTypes: this.getEmailTypes()
      });
    },

    getEmailTypes() {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' };

        const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

        Ember.$.ajax({
          url: `${ENV.API_HOST}/email-template-type`,
          type: 'GET',
          headers: headers
        }).done(r => {
          resolve(r.emailTypes);
          return null;
        }).fail(reject);
      });
    },
    actions: {
      resetDefaultValues(record, selectedEmailType) {
        set(record, 'subject', selectedEmailType.defaultSubject);
        set(record, 'text', selectedEmailType.defaultText);
        set(record, 'html', selectedEmailType.defaultHTML);
      },
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      },
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o template #"${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O template #"${record.get('id')}" foi deletado.`);
            this.transitionTo('email-templates.index');
            return null;
          });
        }
      }
    }
  });
});
;define('we-admin-hotel/routes/email-templates/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const set = Ember.set;
  const get = Ember.get;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    queryParams: {
      type: {
        refreshModel: true
      }
    },
    model(params) {
      const emailTypes = this.modelFor('email-templates').emailTypes;

      return Ember.RSVP.hash({
        emailTypes: this.getEmailTypesArray(),
        selectedEmailType: emailTypes[params.type],
        allowChangeType: !params.type,
        record: this.store.createRecord('email-template')
      });
    },

    afterModel(model) {
      const selectedEmailType = get(model, 'selectedEmailType');

      const tid = selectedEmailType.id;
      if (tid) {
        set(model, 'record.type', tid);
      }

      set(model.record, 'subject', selectedEmailType.defaultSubject);
      set(model.record, 'text', selectedEmailType.defaultText);
      set(model.record, 'html', selectedEmailType.defaultHTML);
    },

    getEmailTypesArray() {
      const emailTypes = this.modelFor('email-templates').emailTypes;
      let emailTypesArray = [];

      for (let name in emailTypes) {
        if (!emailTypes[name].id) {
          set(emailTypes[name], 'id', name);
        }
        emailTypesArray.push(emailTypes[name]);
      }

      return emailTypesArray;
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Template adicionado com sucesso.');

          this.transitionTo('email-templates.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/email-templates/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const set = Ember.set;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return Ember.RSVP.hash({
        emailTypes: this.getEmailTypesArray(),
        // records: this.get('store').query('email-template', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'subject',
          filteredBy: 'subject',
          title: 'Asunto',
          className: 'mt-c-subject text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Criado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-email-templates'
        }]
      });
    },

    afterModel(model) {
      model.emailTypes.forEach(et => {
        const p = this.get('store').query('email-template', {
          type: et.id
        }).then(r => {
          if (r && r.get('firstObject')) {
            set(et, 'emailTemplate', r.get('firstObject'));
            return r.get('firstObject');
          }
        });

        set(et, 'emailTemplate', p);
      });
    },

    getEmailTypesArray() {
      const emailTypes = this.modelFor('email-templates').emailTypes;
      let emailTypesArray = [];

      for (let name in emailTypes) {
        if (!emailTypes[name].id) {
          set(emailTypes[name], 'id', name);
        }
        emailTypesArray.push(emailTypes[name]);
      }

      return emailTypesArray;
    }
  });
});
;define('we-admin-hotel/routes/email-templates/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;
  const set = Ember.set;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        emailTypes: this.getEmailTypesArray(),
        selectedEmailType: null,
        record: this.get('store').findRecord('email-template', params.id)
      });
    },
    afterModel(model) {
      const type = get(model, 'record.type');

      if (type) {
        const emailTypes = this.modelFor('email-templates').emailTypes;
        set(model, 'selectedEmailType', emailTypes[type]);
      }
    },

    getEmailTypesArray() {
      const emailTypes = this.modelFor('email-templates').emailTypes;
      let emailTypesArray = [];

      for (let name in emailTypes) {
        if (!emailTypes[name].id) {
          set(emailTypes[name], 'id', name);
        }

        emailTypesArray.push(emailTypes[name]);
      }

      return emailTypesArray;
    }
  });
});
;define('we-admin-hotel/routes/forgot-password', ['exports', 'we-admin-hotel/config/environment', 'ember-simple-auth/mixins/unauthenticated-route-mixin'], function (exports, _environment, _unauthenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_unauthenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),

    model() {
      return {
        email: ''
      };
    },
    actions: {
      requestPasswordChange() {
        const email = this.get('currentModel.email');

        if (!email) {
          console.log('email is required');
          return;
        }

        let headers = { Accept: 'application/json' };

        Ember.$.ajax({
          url: `${_environment.default.API_HOST}/auth/forgot-password`,
          type: 'POST',
          headers: headers,
          data: {
            email: email
          }
        }).done(result => {
          // reset email:
          this.set('currentModel.email', '');
          // then show the result as notification:
          if (result && result.messages) {
            result.messages.forEach(m => {
              if (m.status === 'success') {
                this.get('notifications').success(m.message);
              } else {
                this.get('notifications').error(m.message);
              }
            });
          } else {
            Ember.Logger.log('Unknow success response on forgot-password page');
          }
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-cards', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar a ficha "${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`A ficha "${record.get('id')}" foi descadastrada.`);
            this.transitionTo('hotel-cards.index');
            return null;
          });
        }
      },
      save(record) {
        record.accConditions = true;

        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      },

      saveConditions(c) {
        let s = this.get('settings');

        s.setSystemSettings({
          hotelCardConditions: c
        }).then(result => {
          Ember.set(s, 'systemSettings', result.settings);
          this.get('notifications').success('Condições do hotel salvas com sucesso.');
          this.send('scrollToTop');
        }).fail(err => {
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
        }).fail(err => {
          Ember.run.bind(this, () => {
            this.send('queryError', err);
            return null;
          });
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-cards/conditions', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return Ember.RSVP.hash({
        systemSettings: this.get('settings').get('systemSettings')
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-cards/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return Ember.RSVP.hash({
        record: this.store.createRecord('hotel-card', {}),
        genderOptions: ['F', 'M']
      });
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Ficha registrada com sucesso.');

          this.transitionTo('/hotel-cards');
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-cards/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('hotel-card', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'fullName',
          filteredBy: 'fullName_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-cards'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-cards/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('hotel-card', params.id),
        genderOptions: ['F', 'M']
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-event-structures', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja descadastrar o cadastro da estrutura "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`A estrutura de eventos "${record.get('name')}" foi descadastrada.`);
            this.transitionTo('hotel-event-structures.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Estrutura de eventos publicada.');
          } else {
            this.get('notifications').success('Estrutura de eventos despublicada.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-event-structures/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return Ember.RSVP.hash({
        record: this.store.createRecord('hotel-event-structure', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      });
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Quarto registrado com sucesso.');

          this.transitionTo('hotel-event-structures.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-event-structures/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('hotel-event-structure', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-event-structures'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-event-structures/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('hotel-event-structure', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/hotel-event-structure/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      let id = Ember.get(model, 'record.id');

      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/hotel-event-structure/' + id,
          alias: '/estrutura-para-eventos/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-infrastructures', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja descadastrar a estrutura de apoio "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`A estrutura de apoio "${record.get('name')}" foi descadastrada.`);
            this.transitionTo('hotel-infrastructures.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Estrutura de apoio publicada.');
          } else {
            this.get('notifications').success('Estrutura de apoio despublicada.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-infrastructures/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return Ember.RSVP.hash({
        record: this.store.createRecord('hotel-infrastructure', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      });
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Infraestrutura de apoio registrada com sucesso.');

          this.transitionTo('hotel-infrastructures.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-infrastructures/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('hotel-infrastructure', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-infrastructures'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-infrastructures/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('hotel-infrastructure', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/hotel-infrastructure/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      let id = Ember.get(model, 'record.id');

      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/hotel-infrastructure/' + id,
          alias: '/infraestruturas-de-apoio/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-rooms', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja descadastrar o quarto "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O quarto "${record.get('name')}" foi descadastrado.`);
            this.transitionTo('hotel-rooms.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Quarto publicado.');
          } else {
            this.get('notifications').success('Quarto despublicado.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-rooms/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service.service(),

    model() {
      return Ember.RSVP.hash({
        record: this.store.createRecord('hotel-room', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      });
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Quarto registrado com sucesso.');

          this.transitionTo('hotel-rooms.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/hotel-rooms/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('hotel-room', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-hotel-rooms'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/hotel-rooms/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('hotel-room', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/hotel-room/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      }
    }
  });
});
;define('we-admin-hotel/routes/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),

    model() {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return Ember.RSVP.hash({
        contentCount: this.get('ajax').request(`${ENV.API_HOST}/content/count`).then(json => json.count),
        unPublishedContents: this.get('store').query('content', {
          published: false
        }),
        newUsers: this.get('ajax').request(`${ENV.API_HOST}/user?limit=10`).then(json => json)
      });
    }
  });
});
;define('we-admin-hotel/routes/login', ['exports', 'ember-simple-auth/mixins/unauthenticated-route-mixin'], function (exports, _unauthenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_unauthenticatedRouteMixin.default);
});
;define('we-admin-hotel/routes/logout', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),
    afterModel: function () {
      this.get('session').invalidate();

      document.cookie = 'wejs.sid=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  });
});
;define('we-admin-hotel/routes/menus', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o menu "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O menu "${record.get('name')}" foi deletado.`);
            this.transitionTo('menus.index');
            return null;
          });
        }
      },
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Menu salvo');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/menus/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return {
        record: this.store.createRecord('menu')
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Menu criado com sucesso.');

          this.transitionTo('menus.item', r.id);
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/menus/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('menu', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID'
        }, {
          propertyName: 'name',
          filteredBy: 'name_starts-with',
          title: i18n.t('form-menu-name')
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-menu-createdAt'),
          component: 'mt-list-item-created-at'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-menus'
        }]
      });
    },

    afterModel(model) {
      const menus = Ember.get(model, 'records');
      if (Ember.get(menus, 'length')) {
        this.transitionTo('/menus/' + menus.get('firstObject.id'));
      } else {
        this.transitionTo('/menus/create');
      }
    }
  });
});
;define('we-admin-hotel/routes/menus/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;
  const set = Ember.set;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),

    model(params) {
      const systemSettings = this.get('settings').get('systemSettings');

      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return Ember.RSVP.hash({
        menuLinkSelectorComponents: ENV.menuLinkSelectorComponents || this.defaultSelectorLinksComponents(),
        selectedMenuComponent: 0,
        menuId: params.id,
        menuData: this.getLinks(params.id),
        record: null,
        updated: false,
        links: Ember.A(),
        menus: this.get('store').query('menu', {}),
        editingRecord: null,
        menuSelected: null,
        tableDrag: null,
        // menu location flags:
        isMainMenu: String(get(systemSettings, 'menuMainId')) === String(params.id),
        isSecondaryMenu: String(get(systemSettings, 'menuSecondaryId')) === String(params.id),
        isFooterMenu: String(get(systemSettings, 'menuFooterId')) === String(params.id),
        isSocialMenu: String(get(systemSettings, 'menuSocialId')) === String(params.id),
        isAuthenticatedMenu: String(get(systemSettings, 'menuAuthenticatedId')) === String(params.id)
      });
    },

    afterModel(model) {

      let linksFormated = model.menuData.link.map(link => {
        return {
          id: link.id,
          type: 'link',
          attributes: link,
          relationships: {
            menu: {
              data: {
                id: model.menuId,
                type: 'menu'
              }
            }
          }
        };
      });

      this.get('store').push({ data: linksFormated });

      const p = new window.Promise((resolve, reject) => {
        this.get('store').findRecord('menu', model.menuId).then(r => {
          model.links = this.sortModelLinks(r.get('links'), r.get('name'));
          model.record = r;
          model.menuSelected = r;

          resolve();
          return null;
        }).catch(reject);
      });

      return p;
    },

    sortModelLinks(links, name) {
      links = links.sortBy('parent', 'weight', 'depth');

      const tree = {
        isMenu: true,
        text: 'Menu: ' + name,
        links: Ember.A()
      };

      links.forEach(item => {
        // reset sublinks:
        item.set('links', Ember.A());
      });

      // get root links:
      links.forEach(item => {
        const parent = item.get('parent');
        if (parent) {
          // submenu item:
          const parentRecord = links.findBy('id', String(parent));
          if (parentRecord) {
            let links = parentRecord.get('links');
            if (!links) {
              parentRecord.links = Ember.A();
              links = parentRecord.links;
            }

            links.push(item);
          } else {
            console.log('Parent record not found:', item.id, parent);
          }
        } else {
          // root item:
          tree.links.push(item);
          if (!item.get('depth')) {
            item.set('depth', 0);
          }
        }
      });

      return tree;
    },

    getLinks(menuId) {
      const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/link?menuId=${menuId}&order=depth ASC`,
          type: 'GET',
          headers: headers
        }).done(resolve).fail(reject);
      });
    },

    getNewLinkRecord() {
      const link = this.get('store').createRecord('link');
      link.set('menu', this.get('currentModel.record'));
      return link;
    },

    reorderItems(itemModels, draggedModel) {
      itemModels.forEach((item, i) => {
        item.set('weight', i);
      });
      this.set('currentModel.justDragged', draggedModel);
      this.set('currentModel.record.updated', true);
    },

    /**
     * Default menu components links list
     * @return {Array}
     */
    defaultSelectorLinksComponents() {
      return [{
        name: 'custom',
        title: 'Links personalizados',
        componentName: 'menu-custom-link-form'
      }, {
        name: 'user',
        title: 'Usuário',
        componentName: 'menu-user-links-selector'
      }];
    },

    actions: {
      reorderItems(itemModels, draggedModel) {
        this.reorderItems(itemModels, draggedModel);
      },

      menuUpdated(flag) {
        if (flag) {
          const v = get(this, 'currentModel.' + flag);
          set(this, 'currentModel.' + flag, !v);
        }

        set(this, 'currentModel.record.updated', true);
      },

      /**
       * On sort menu links list
       *
       * @param  {Object} options.event
       * @param  {Object} options.toComponent
       * @param  {Object} options.fromComponent
       * @param  {Object} options.itemComponent
       */
      onSortEnd({ event, toComponent, fromComponent }) {
        if (fromComponent.links === toComponent.links && event.oldIndex === event.newIndex) {
          return;
        }

        const item = fromComponent.links.objectAt(event.oldIndex);

        fromComponent.links.removeObject(item);

        if (toComponent === fromComponent) {} else {
          event.item.remove(); // remove from DOM
        }

        toComponent.links.insertAt(event.newIndex, item);

        this.resetLinksWeight(this.get('currentModel.links.links'), {
          cw: 0,
          depth: 0
        }, null);

        Ember.set(this, 'currentModel.record.updated', true);
      },

      saveLinksOrder() {
        this.saveLinksOrder(...arguments);
      },

      deleteLink(link) {
        const links = this.get('currentModel.links.links');

        if (this.linkHaveChildrens(link)) {
          alert('Não é possível remover o link.\nRemova os sublinks antes de remover esse link.');
          return false;
        }

        if (confirm(`Tem certeza que deseja deletar o link "${link.get('text')}"? \nEssa ação não pode ser desfeita.`)) {

          link.destroyRecord().then(() => {
            if (link.get('parent')) {
              let parent = this.get('store').peekRecord('link', link.get('parent'));
              const parentLinks = parent.get('links');
              parentLinks.removeObject(link);
            } else {
              links.removeObject(link);
            }

            this.get('notifications').success(`O link "${link.get('text')}" foi deletado.`);
            return null;
          });
        }
      },

      saveAll() {
        const model = this.get('currentModel');

        model.record.save() // save menu data:
        .then(r => {
          // save menu sort
          if (get(model, 'record.updated')) {
            // save sort order
            return this.saveLinksOrder().then(() => {
              set(model, 'record.updated', false);
              return r;
            });
          }

          return r;
        }).then(r => {
          // save menu postion in template:
          const s = this.get('settings');
          const systemSettings = this.get('settings').get('systemSettings');

          let settingsToUpdate = {};

          if (model.isMainMenu) {
            if (systemSettings.menuMainId !== model.menuId) {
              settingsToUpdate.menuMainId = model.menuId;
            }
          } else {
            if (systemSettings.menuMainId === model.menuId) {
              settingsToUpdate.menuMainId = null;
            }
          }

          if (model.isSecondaryMenu) {
            if (systemSettings.menuSecondaryId !== model.menuId) {
              settingsToUpdate.menuSecondaryId = model.menuId;
            }
          } else {
            if (systemSettings.menuSecondaryId === model.menuId) {
              settingsToUpdate.menuSecondaryId = null;
            }
          }

          if (model.isFooterMenu) {
            if (systemSettings.menuFooterId !== model.menuId) {
              settingsToUpdate.menuFooterId = model.menuId;
            }
          } else {
            if (systemSettings.menuFooterId === model.menuId) {
              settingsToUpdate.menuFooterId = null;
            }
          }

          if (model.isSocialMenu) {
            if (systemSettings.menuSocialId !== model.menuId) {
              settingsToUpdate.menuSocialId = model.menuId;
            }
          } else {
            if (systemSettings.menuSocialId === model.menuId) {
              settingsToUpdate.menuSocialId = null;
            }
          }

          if (model.isAuthenticatedMenu) {
            if (systemSettings.menuAuthenticatedId !== model.menuId) {
              settingsToUpdate.menuAuthenticatedId = model.menuId;
            }
          } else {
            if (systemSettings.menuAuthenticatedId === model.menuId) {
              settingsToUpdate.menuAuthenticatedId = null;
            }
          }

          if (!Object.keys(settingsToUpdate).length) {
            // nothing to update:
            return r;
          }

          return new window.Promise((resolve, reject) => {
            s.setSystemSettings(settingsToUpdate).then(result => {
              Ember.set(s, 'systemSettings', result.settings);
              this.get('notifications').success('Configurações do menu salvas');
              resolve(r);
            }).fail(err => {
              this.send('queryError', err);
              reject(err);
            });
          });
        }).then(() => {
          // done All

          return null;
        }).catch(err => {
          this.send('queryError', err);
          this.get('notifications').error('Erro ao salvar o menu, tente novamente mais tarde ou entre em contato com um administrador');
          return null;
        });
      },

      addLink(link) {
        let menu = this.get('currentModel.record');

        link.set('menu', menu);

        link.save().then(r => {
          this.get('notifications').success('Link salvo');
          const menuItemModel = this.get('currentModel');
          menuItemModel.links.links.insertAt(0, link);
          return r;
        });
      },

      onAddPage(page) {
        if (!page || !page.get('linkPermanent')) {
          return null;
        }

        let linkPermanent = page.get('linkPermanent');

        let menu = this.get('currentModel.record');
        let link = this.get('store').createRecord('link', {
          text: page.get('title'),
          modelName: 'content',
          modelId: page.id,
          href: linkPermanent
        });

        link.set('menu', menu);

        link.save().then(r => {
          this.get('notifications').success('Link salvo');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          const menuItemModel = this.get('currentModel');

          menuItemModel.links.links.insertAt(0, link);

          return r;
        });
      }
    },

    saveLinksOrder() {
      return new window.Promise((resolve, reject) => {
        const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

        const menuId = this.get('currentModel.record.id'),
              data = this.getLinksInFormDataFormat();

        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/admin/menu/${menuId}/sort-links`,
          type: 'POST',
          headers: headers,
          data: data
        }).done(result => {
          this.get('notifications').success('Ordem salva');
          resolve(result);
          return null;
        }).fail(err => {
          this.get('notifications').error('Erro ao salvar a ordem dos links');
          reject(err);
          return null;
        });
      });
    },

    getLinksInFormDataFormat() {
      const links = this.get('currentModel.links.links');
      const data = {};

      this.convertLinksAttrsTo(links, data);

      return data;
    },

    convertLinksAttrsTo(links, data) {
      for (let i = 0; i < links.get('length'); i++) {
        this.convertLinkAttrsTo(links[i], data);
      }
    },

    convertLinkAttrsTo(link, data) {
      const prefix = 'link-' + String(link.id);
      data[prefix + '-id'] = link.id;
      data[prefix + '-depth'] = link.get('depth');
      data[prefix + '-weight'] = link.get('weight');
      data[prefix + '-parent'] = link.get('parent');

      const subLinks = link.get('links');
      if (subLinks && Ember.get(subLinks, 'length')) {
        // this menu link have sublinks:
        this.convertLinksAttrsTo(subLinks, data);
      }
    },

    linkHaveChildrens(link) {
      let links = this.get('store').peekAll('link');

      for (let i = 0; i < links.get('length'); i++) {
        let listItem = links.objectAt(i);
        let parent = listItem.get('parent');

        if (parent && Number(parent) === Number(link.id)) {
          return true;
        }
      }

      return false;
    },

    resetLinksWeight(links, ctx, parent) {
      for (let i = 0; i < links.get('length'); i++) {
        if (!parent) {
          // reset depth for each root item
          ctx.depth = 0;
        }
        this.resetLinkWeight(links[i], ctx, parent);
      }
    },

    resetLinkWeight(link, ctx, parent) {
      ctx.cw++;
      link.set('weight', ctx.cw);
      link.set('parent', parent);
      link.set('depth', ctx.depth);

      const subLinks = link.get('links');
      if (subLinks && Ember.get(subLinks, 'length')) {
        ctx.depth++;
        // this menu link have sublinks:
        this.resetLinksWeight(subLinks, ctx, link.id);
      }
    }
  });
});
;define('we-admin-hotel/routes/menus/item/add-link', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),
    acl: Ember.inject.service('acl'),

    model() {
      let parentModel = this.modelFor('menus.item');

      return Ember.RSVP.hash({
        menuId: parentModel.menuId,
        menu: parentModel.record,
        record: this.store.createRecord('link'),
        selectedLinkType: null,
        selectedPage: null,
        pageRecord: this.store.createRecord('content', {
          published: true
        }),
        linkTypes: [{
          id: 'toURL',
          text: 'Digitar uma url'
        }, {
          id: 'selectPage',
          text: 'Selecionar uma página existente'
        }, {
          id: 'createPage',
          text: 'Criar uma nova página'
        }],
        userRoles: this.get('acl').getRolesArray()
      });
    },

    afterModel(model) {
      model.userRoles.unshift({
        id: null,
        name: 'Público'
      });
    },

    actions: {
      saveLink(link) {
        let menu = this.get('currentModel.menu');
        link.set('menu', menu);

        let linkType = this.get('currentModel.selectedLinkType.id');

        if (linkType === 'createPage') {
          let page = this.get('currentModel.pageRecord');
          // save page before save the link:
          return this.savePage(page).then(page => {
            link.href = Ember.get(page, 'linkPermanent');
            this.saveRecord(link, menu);
            return null;
          }).catch(err => {
            this.send('queryError', err);
            return null;
          });
        } else if (linkType === 'selectPage') {
          let linkPermanent = this.get('currentModel.selectedPage.linkPermanent');

          if (!linkPermanent) {
            this.get('notifications').warning('Selecione uma página antes de salvar.');
            return null;
          }

          link.href = linkPermanent;
          return this.saveRecord(link, menu);
        } else if (linkType === 'toURL') {
          return this.saveRecord(link, menu);
        }
      }
    },

    saveRecord(link, menu) {
      link.save().then(r => {
        this.get('notifications').success('Link salvo');
        // move scroll to top:
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        const menuItemModel = this.modelFor('menus.item');

        menuItemModel.links.links.unshift(link);

        this.transitionTo('/menus/' + menu.id);

        return r;
      });
    },

    savePage(record) {
      return record.save().then(r => {
        this.get('notifications').success(`Página "${r.get('title')}" salva.`);
        // success, return the page record
        return r;
      });
    },

    /**
     * Method to check if one link have an page to load
     *
     * @param  {String} url link url
     * @return {Promise}
     */
    checkIfHaveOnePage(url) {
      return new window.Promise((resolve, reject) => {
        const ENV = Ember.getOwner(this).resolveRegistration('config:environment');

        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        if (url[0] !== '/') {
          url = '/' + url;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}${url}`,
          type: 'GET',
          headers: headers
        }).done(() => {
          // page exists, do nothing
          resolve(false);
          return null;
        }).fail((err, textStatus) => {
          if (textStatus === '404') {
            // this page dont exists ...
            if (confirm('O endereço desse link não possuí uma página ou link disponível. ' + '\nVocê gostaria de criar uma página e associar com o link?')) {
              // create one page ...
              resolve(true);
            } else {
              // user dont want create one page for this link:
              resolve(false);
            }
          } else {
            // unknow error:
            reject(err);
          }
        });
      });
    }

  });
});
;define('we-admin-hotel/routes/menus/item/edit-link', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),
    acl: Ember.inject.service('acl'),

    model(params) {
      let parentModel = this.modelFor('menus.item');

      return Ember.RSVP.hash({
        menuId: parentModel.menuId,
        menu: parentModel.record,
        record: this.get('store').findRecord('link', params.linkid),
        userRoles: this.get('acl').getRolesArray()
      });
    },
    afterModel(model) {
      model.userRoles.unshift({
        id: null,
        name: 'Público'
      });
    },
    actions: {
      saveLink(link) {
        let menuId = this.get('currentModel.menuId');

        link.save().then(r => {
          this.get('notifications').success('Link salvo');

          this.transitionTo('menus.item', menuId);
          return r;
        });
      }
    }

  });
});
;define('we-admin-hotel/routes/news', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar a notícia "${record.get('title')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`A notícia "${record.get('title')}" foi deletada.`);
            this.transitionTo('news.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        Ember.set(record, 'published', status);
        if (status) {
          Ember.set(record, 'publishedAt', new Date());
        } else {
          Ember.set(record, 'publishedAt', null);
        }

        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Notícia publicada.');
          } else {
            this.get('notifications').success('Notícia despublicada.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Notícia salvas.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/news/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return {
        record: this.store.createRecord('news', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Notícia criada com sucesso.');
          this.transitionTo('news.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/news/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('news', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'title',
          filteredBy: 'title',
          title: i18n.t('form-content-title'),
          className: 'mt-c-title text-cell'
        }, {
          propertyName: 'creator.displayName',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('content.creator')
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('form-content-published'),
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-news'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/news/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('news', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/news/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },
    afterModel(model) {
      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/news/' + id,
          alias: '/noticias/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/permissions', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),
    acl: Ember.inject.service('acl'),

    model() {
      return Ember.RSVP.hash({
        data: this.getPermissionsAndRoles()
      });
    },
    afterModel(model) {
      model.roleNames = Object.keys(model.data.roles);
      model.permissionNames = Object.keys(model.data.permissions);
    },
    getPermissionsAndRoles() {
      return this.get('acl').getPermissionsAndRoles();
    },

    actions: {
      addPermission(roleName, permissionName, cb) {
        this.get('acl').addPermissionToRole(roleName, permissionName).then(() => {
          cb();
          return null;
        }).catch(() => {
          cb();
        });
      },
      removePermission(roleName, permissionName, cb) {
        this.get('acl').removePermissionFromRole(roleName, permissionName).then(() => {
          cb();
          return null;
        }).catch(() => {
          cb();
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/profile', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'we-admin-hotel/config/environment'], function (exports, _authenticatedRouteMixin, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const settings = this.get('settings');

      return Ember.RSVP.hash({
        user: settings.get('user'),
        oldPassword: null,
        newPassword: null,
        rNewPassword: null
      });
    },

    actions: {
      save(user) {
        user.save().then(r => {
          this.get('notifications').success('Dados do perfil salvos.');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },

      changePassword(model) {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('settings.accessToken');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: _environment.default.API_HOST + '/auth/change-password',
          type: 'POST',
          data: {
            password: model.oldPassword,
            newPassword: model.newPassword,
            rNewPassword: model.rNewPassword
          },
          cache: false,
          headers: headers
        }).then(response => {
          console.log('response>', response);
          this.get('notifications').success('Senha alterada com sucesso.');

          model.oldPassword = null;
          model.newPassword = null;
          model.rNewPassword = null;
          // success
          return response;
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/roles', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const systemRoles = ['administrator', 'authenticated', 'unAuthenticated'];

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service('session'),
    acl: Ember.inject.service('acl'),

    model() {
      return Ember.RSVP.hash({
        data: this.get('acl').getRoles(),
        roles: Ember.A([]),
        newRole: {}
      });
    },
    afterModel(model) {
      for (let name in model.data) {
        if (systemRoles.indexOf(name) > -1) {
          model.data[name].isSystemRole = true;
        }

        model.roles.push(model.data[name]);
      }
    },
    actions: {
      createRole(role) {
        const roles = this.get('currentModel.data');
        if (roles[role.name]) {
          this.resetNewRole();
          return;
        }

        this.get('acl').createRole(role).then(() => {
          const rolesList = this.get('currentModel.roles');
          rolesList.pushObject(role);
          roles[role.name] = role;
          this.resetNewRole();
        }).catch(err => {
          console.log(err);
        });
      },
      deleteRole(role) {
        if (!confirm('Você tem certeza que deseja deletar esse perfil de usuário?')) {
          return;
        }

        const roles = this.get('currentModel.data');

        this.get('acl').deleteRole(role).then(() => {
          const rolesList = this.get('currentModel.roles');
          rolesList.removeObject(role);
          delete roles[role.name];
        }).catch(err => {
          console.log(err);
        });
      }
    },
    resetNewRole() {
      this.set('currentModel.newRole', {});
    }
  });
});
;define('we-admin-hotel/routes/settings', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '',
            logoId = systemSettings.logoId,
            iconId = systemSettings.iconId,
            bannerId = systemSettings.bannerId,
            ogImageId = systemSettings.ogImageId,
            bgImageId = systemSettings.bgImageId;

      return Ember.RSVP.hash({
        settings: systemSettings,
        logo: logoId ? this.get('image').getImageData(logoId) : null,
        icon: iconId ? this.get('image').getImageData(iconId) : null,
        banner: bannerId ? this.get('image').getImageData(bannerId) : null,
        ogImage: ogImageId ? this.get('image').getImageData(ogImageId) : null,
        bgImage: bgImageId ? this.get('image').getImageData(bgImageId) : null
      });
    },

    actions: {
      save(data) {
        const s = this.get('settings'),
              logo = this.get('currentModel.logo'),
              icon = this.get('currentModel.icon'),
              banner = this.get('currentModel.banner'),
              ogImage = this.get('currentModel.ogImage'),
              bgImage = this.get('currentModel.bgImage');

        // resolve logo url and id
        this.resolveImage(data, logo, 'logo');
        // resolve icon url and id
        this.resolveImage(data, icon, 'icon');
        // resolve banner url and id
        this.resolveImage(data, banner, 'banner');
        // resolve og image url and id
        this.resolveImage(data, ogImage, 'ogImage');
        // resolve bg image url and id
        this.resolveImage(data, bgImage, 'bgImage');

        s.setSystemSettings(data).then(result => {
          Ember.set(s, 'systemSettings', result.settings);
          this.get('notifications').success('As configurações do sistema foram salvas.');
          this.send('scrollToTop');
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    },

    resolveImage(data, images, name) {
      let image;

      if (images && images.firstObject) {
        image = Ember.get(images, 'firstObject');
      } else {
        return;
      }

      if (image && image.urls && image.urls.large) {
        Ember.set(data, name + 'Id', image.id);
        Ember.set(data, name + 'UrlThumbnail', image.urls.thumbnail);
        Ember.set(data, name + 'UrlMedium', image.urls.medium);
        Ember.set(data, name + 'UrlOriginal', image.urls.original);
        Ember.set(data, name + 'Url', image.urls.thumbnail);
      } else {
        Ember.set(data, name + 'Id', null);
        Ember.set(data, name + 'UrlThumbnail', null);
        Ember.set(data, name + 'UrlMedium', null);
        Ember.set(data, name + 'UrlOriginal', null);
        Ember.set(data, name + 'Url', null);
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/email', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      return Ember.RSVP.hash({
        settings: systemSettings
      });
    },

    actions: {
      save(data) {
        let s = this.get('settings');

        s.setSystemSettings(data).then(result => {
          Ember.set(s, 'systemSettings', result.settings);

          console.log('success');
          this.get('notifications').success('As configurações de email do sistema foram salvas.');
          this.send('scrollToTop');
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/integrations', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      return Ember.RSVP.hash({
        settings: systemSettings
      });
    },

    actions: {
      save(data) {
        let s = this.get('settings');

        s.setSystemSettings(data).then(result => {
          Ember.set(s, 'systemSettings', result.settings);

          this.get('notifications').success('As configurações de integração do sistema foram salvas.');
          this.send('scrollToTop');
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/project', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      return Ember.RSVP.hash({
        settings: systemSettings
      });
    },

    actions: {
      save(data) {
        let s = this.get('settings');

        s.setSystemSettings(data).then(result => {
          Ember.set(s, 'systemSettings', result.settings);
          this.get('notifications').success('Os dados do hotel foram salvos.');
          this.send('scrollToTop');
        }).fail(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/theme', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const get = Ember.get;
  let ENV;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      return Ember.RSVP.hash({
        settings: systemSettings,
        themeCollorOptions: [],
        themeConfigName: null,
        themeCollor: null,
        updateAvaible: null,
        themeConfigs: this.get('settings').getThemeConfigs()
      });
    },

    afterModel(model) {
      const settings = this.get('settings.systemSettings');

      const ts = model.themeConfigs.themes;

      model.themeConfigName = model.themeConfigs.enabled + 'ColorName';

      for (let themeName in ts) {
        const t = ts[themeName];

        if (themeName !== model.themeConfigs.enabled || !t.configs.colors) {
          continue;
        }

        if (settings[themeName + 'ColorName'] && t.configs.colors) {
          // has selected color:
          model.themeCollor = t.configs.colors[settings[themeName + 'ColorName']];
        } else {
          model.themeCollor = t.configs.colors.default;
        }

        if (t.configs && t.configs.colors) {
          for (let colorName in t.configs.colors) {
            const c = t.configs.colors[colorName];

            if (!c.id) {
              c.id = colorName;
            }

            model.themeCollorOptions.push(c);
          }
        }
      }

      this.verifyCurrentThemeUpdate(model);
    },

    verifyCurrentThemeUpdate(model) {
      const settings = this.get('settings.systemSettings');

      if (!settings.themesToUpdate || !model.themeConfigs.enabled) {
        return null;
      }

      const name = model.themeConfigs.enabled;
      let themesToUpdate;

      try {
        if (typeof settings.themesToUpdate === 'string') {
          themesToUpdate = JSON.parse(settings.themesToUpdate);
        } else {
          themesToUpdate = settings.themesToUpdate;
        }
      } catch (e) {
        Ember.Logger.error(e);
      }

      if (themesToUpdate && themesToUpdate[name]) {
        Ember.set(model, 'updateAvaible', themesToUpdate[name]);
      }
    },

    removeUpdatedThemeFromToUpdateList() {
      const settings = this.get('settings.systemSettings');
      const model = this.get('currentModel');
      const name = model.themeConfigs.enabled;

      let themesToUpdate = JSON.parse(settings.themesToUpdate);

      delete themesToUpdate[name];

      this.set('settings.systemSettings.themesToUpdate', JSON.stringify(themesToUpdate));
    },

    actions: {
      save(data) {
        const model = this.get('currentModel');
        let s = this.get('settings');
        let color = 'default';
        const themeCollor = get(model, 'themeCollor');

        if (themeCollor) {
          color = themeCollor.id;
        }

        data[get(model, 'themeConfigName')] = color;

        s.setSystemSettings(data).then(result => {
          Ember.set(s, 'systemSettings', result.settings);

          this.get('notifications').success('As configurações do sistema foram salvas.');
          this.send('scrollToTop');
        }).fail(err => {
          this.send('queryError', err);
        });
      },

      installTheme(theme, color, colorName) {
        const release = Ember.get(theme, 'release');

        if (!colorName) {
          colorName = 'default';
        }

        return new window.Promise((resolve, reject) => {
          if (!release) {
            Ember.Logger.warn('installTheme:theme.release is required');
            return resolve();
          }

          let headers = { Accept: 'application/vnd.api+json' },
              accessToken = this.get('session.session.authenticated.access_token');

          if (accessToken) {
            headers.Authorization = `Basic ${accessToken}`;
          }

          let url = `${ENV.API_HOST}/admin/theme/${theme.gitRepositoryName}/install`;

          Ember.$.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
              name: theme.gitRepositoryName,
              release: release,
              colorName: colorName
            }),
            headers: headers
          }).done(data => {
            if (data && data.meta && data.meta.updatedSettings) {

              this.get('settings').set('systemSettings', data.meta.updatedSettings);
            }

            resolve(data);
            return null;
          }).fail(reject);
        }).then(data => {
          if (data && data.meta && data.meta.messages) {
            data.meta.messages.forEach(m => {
              this.get('notifications').success(m.message);
            });
          } else {
            this.get('notifications').success('Tema instalado com sucesso.');
          }

          this.transitionTo('/settings/theme');
          return this.refresh();
        }).catch(err => {
          this.send('queryError', err);
        });
      },

      verifyThemesUpdate() {
        return new window.Promise((resolve, reject) => {

          let headers = { Accept: 'application/vnd.api+json' },
              accessToken = this.get('session.session.authenticated.access_token');

          if (accessToken) {
            headers.Authorization = `Basic ${accessToken}`;
          }

          let url = `${ENV.API_HOST}/admin/theme-verify-updates`;

          Ember.$.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            headers: headers
          }).done(data => {
            if (data && data.themesToUpdate) {
              this.set('settings.systemSettings.themesToUpdate', data.themesToUpdate);
            }

            this.verifyCurrentThemeUpdate(this.get('currentModel'));

            resolve(data);
            return null;
          }).fail(reject);
        }).then(data => {
          if (data && data.meta && data.meta.messages) {
            data.meta.messages.forEach(m => {
              this.get('notifications').success(m.message);
            });
          } else {
            this.get('notifications').success('Temas verificados com sucesso.');
          }
          return this.refresh();
        }).catch(err => {
          this.send('queryError', err);
        });
      },

      updateTheme(themeName, release) {
        return new window.Promise((resolve, reject) => {

          if (!release) {
            Ember.Logger.warn('updateTheme:theme.release is required');
            return resolve();
          }

          let headers = { Accept: 'application/vnd.api+json' },
              accessToken = this.get('session.session.authenticated.access_token');

          if (accessToken) {
            headers.Authorization = `Basic ${accessToken}`;
          }

          let url = `${ENV.API_HOST}/admin/theme/${themeName}/update`;

          Ember.$.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
              name: themeName,
              release: release
            }),
            headers: headers
          }).done(data => {
            if (data && data.themesToUpdate) {
              this.set('settings.systemSettings.themesToUpdate', data.themesToUpdate);
            } else {
              this.removeUpdatedThemeFromToUpdateList();
            }

            this.set('currentModel.updateAvaible', false);

            resolve(data);
            return null;
          }).fail(reject);
        }).then(data => {
          if (data && data.meta && data.meta.messages) {
            data.meta.messages.forEach(m => {
              this.get('notifications').success(m.message);
            });
          } else {
            this.get('notifications').success('Tema atualizado com sucesso.');
          }
          return this.refresh();
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/theme/change', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    image: Ember.inject.service(),

    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    model() {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      const themeModel = this.modelFor('settings.theme');

      return Ember.RSVP.hash({
        ENV: ENV,
        settings: systemSettings,
        themeModel: themeModel,
        themes: this.getThemeList()
      });
    },

    getThemeList() {
      let url = `${ENV.GLOBAL_HOST}/project-theme?limit=100&published=true`;
      return this.get('ajax').request(url).then(json => json['project-theme']);
    },

    actions: {
      save(data) {
        console.log('TODO! save', data);
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/theme/change/color', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    ajax: Ember.inject.service(),
    init() {
      this._super(...arguments);
      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    model(params) {
      const systemSettings = this.get('settings').get('systemSettings') || '';

      const themeModel = this.modelFor('settings.theme');

      return Ember.RSVP.hash({
        ENV: ENV,
        settings: systemSettings,
        themeModel: themeModel,
        theme: this.getThemeList(params)
      });
    },

    getThemeList(params) {
      let url = `${ENV.GLOBAL_HOST}/project-theme/${params.id}`;
      return this.get('ajax').request(url).then(json => json['project-theme']);
    },

    actions: {
      save(data) {
        console.log('TODO! save', data);
      }
    }
  });
});
;define('we-admin-hotel/routes/settings/theme/change/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default);
});
;define('we-admin-hotel/routes/simple-events', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja descadastrar o evento "${record.get('name')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O evento "${record.get('name')}" foi descadastrado.`);
            this.transitionTo('simple-events.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.published = status;
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Evento publicado.');
          } else {
            this.get('notifications').success('Evento despublicado.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          return alias.save().then(() => {
            return content;
          });
        }).then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/simple-events/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      return {
        record: this.store.createRecord('simple-event', {
          published: true
        }),
        categories: this.get('term').getSystemCategories()
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Evento registrado com sucesso.');

          this.transitionTo('simple-events.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/simple-events/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {

      return Ember.RSVP.hash({
        records: this.get('store').query('simple-event', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'name',
          filteredBy: 'name_contains',
          title: 'Nome',
          className: 'mt-c-name text-cell'
        }, {
          propertyName: 'published',
          disableSorting: true,
          disableFiltering: true,
          title: 'Publicado',
          className: 'mt-c-published'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Criado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-simple-events'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/simple-events/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('simple-event', params.id),
        categories: this.get('term').getSystemCategories(),
        alias: this.get('store').query('url-alia', {
          target: '/simple-event/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/simple-event/' + id,
          alias: '/eventos/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/site-contact-forms', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      },
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o assunto de contato #"${record.get('id')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O assunto de contato #"${record.get('id')}" foi deletado.`);
            this.transitionTo('site-contact-forms.index');
            return null;
          });
        }
      }
    }
  });
});
;define('we-admin-hotel/routes/site-contact-forms/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return {
        record: this.store.createRecord('sitecontact-form')
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Formulário adicionado com sucesso.');

          this.transitionTo('site-contact-forms.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/site-contact-forms/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {

      return Ember.RSVP.hash({
        records: this.get('store').query('sitecontact-form', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'subject',
          filteredBy: 'subject',
          title: 'Asunto',
          className: 'mt-c-subject text-cell'
        }, {
          propertyName: 'publishedAt',
          filteredBy: 'publishedAt',
          title: 'Publicado em',
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Ações',
          component: 'mt-actions-sitecontact-form'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/site-contact-forms/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('sitecontact-form', params.id)
      });
    }
  });
});
;define('we-admin-hotel/routes/site-contacts', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      changeStatus(record, status) {
        Ember.set(record, 'status', status);

        record.save().then(r => {
          if (status === 'closed') {
            this.get('notifications').success('Mensagem marcada como resolvida.');
          } else if ('opened') {
            this.get('notifications').success('Mensagem marcada como pendente.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/site-contacts/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('sitecontact', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID'
        }, {
          propertyName: 'name',
          filteredBy: 'name',
          title: "Nome"
        }, {
          propertyName: 'email',
          filteredBy: 'email',
          title: "Email"
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: 'Enviado em',
          component: 'mt-list-item-created-at'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-site-contacts'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/site-contacts/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('sitecontact', params.id)
      });
    }
  });
});
;define('we-admin-hotel/routes/slides', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return Ember.RSVP.hash({
        slideshow: this.store.findRecord('slideshow', 1)
      });
    },
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o slide "${record.get('title')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O slide "${record.get('title')}" foi deletado.`);
            this.transitionTo('slides.index');
            return null;
          });
        }
      },
      changePublishedStatus(record, status) {
        record.set('published', status);
        record.save().then(r => {
          if (status) {
            this.get('notifications').success('Slide publicado.');
          } else {
            this.get('notifications').success('Slide despublicado.');
          }
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },
      save(record) {
        if (!record.get('slideshow.id')) {
          record.set('slideshow', this.get('currentModel.slideshow'));
        }

        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // move scroll to top:
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return err;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/slides/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const slideshow = this.modelFor('slides').slideshow;
      return Ember.RSVP.hash({
        record: this.store.createRecord('slide', {
          slideshow: slideshow
        }),
        slideshow: slideshow
      });
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Slide adicionado com sucesso.');

          this.transitionTo('slides.item', r.id);
          this.send('scrollToTop');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
          return null;
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/slides/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    i18n: Ember.inject.service(),
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('slide', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'title',
          filteredBy: 'title',
          title: 'Título',
          className: 'mt-c-title text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-content-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'highlighted',
          filteredBy: 'highlighted',
          title: 'Ordenação',
          component: 'mt-highlighted',
          className: 'mt-c-highlighted'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-slides'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/slides/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      const slideshow = this.modelFor('slides').slideshow;

      return Ember.RSVP.hash({
        record: this.get('store').findRecord('slide', params.id),
        slideshow: slideshow
      });
    }
  });
});
;define('we-admin-hotel/routes/url-alia', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o url alternativo "${record.get('target')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O url alternativo "${record.get('target')}" foi deletado.`);
            this.transitionTo('url-alia.index');
            return null;
          });
        }
      },
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/url-alia/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return {
        record: this.store.createRecord('url-alia')
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('Url alternativo criado com sucesso.');

          this.transitionTo('url-alia.item', r.id);
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/url-alia/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('url-alia', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID'
        }, {
          propertyName: 'alias',
          filteredBy: 'alias',
          title: i18n.t('form-urlAlias-alias')
        }, {
          propertyName: 'target',
          filteredBy: 'targer',
          title: i18n.t('form-urlAlias-target')
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-urlAlias-createdAt'),
          component: 'mt-list-item-created-at'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-url-alia'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/url-alia/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('url-alia', params.id)
      });
    }
  });
});
;define('we-admin-hotel/routes/user', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    settings: Ember.inject.service('settings')
  });
});
;define('we-admin-hotel/routes/users/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    notifications: Ember.inject.service('notification-messages'),

    model() {
      return Ember.RSVP.hash({
        user: {}
      });
    },
    actions: {
      create(data) {
        const i18n = this.get('i18n');

        const record = this.store.createRecord('user', data);

        record.set('active', true);

        record.save().then(r => {
          this.get('notifications').success(i18n.t('user.registered.success.msg'));

          this.transitionTo('users.item', r.id);
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/users/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {

    model() {
      return Ember.RSVP.hash({
        users: this.get('store').query('user', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID'
        }, {
          propertyName: 'displayName',
          filteredBy: 'displayName_starts-with',
          title: 'Nome'
        }, {
          propertyName: 'email',
          filteredBy: 'email_starts-with',
          title: 'E-mail'
        }, {
          propertyName: 'fullName',
          filteredBy: 'fullName_starts-with',
          title: 'Nome completo'
        }, {
          propertyName: 'active',
          disableSorting: true,
          disableFiltering: true,
          title: 'Active'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: 'Actions',
          component: 'mt-actions-users'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/users/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'we-admin-hotel/config/environment'], function (exports, _authenticatedRouteMixin, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const userMenuTabs = ['userTabPaneData', 'userTabPanePassword', 'userTabPaneRoles'];

  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    notifications: Ember.inject.service('notification-messages'),
    acl: Ember.inject.service('acl'),

    queryParams: {
      tab: { refreshModel: false }
    },

    model(params) {

      if (userMenuTabs.indexOf(params.tab) === -1) {
        params.tab = 'userTabPaneData';
      }

      return Ember.RSVP.hash({
        user: this.get('store').findRecord('user', params.id),
        roles: this.get('acl').getRolesArray(),
        newPassword: null,
        rNewPassword: null,
        tab: params.tab
      });
    },
    actions: {
      save(user) {
        user.save().then(r => {
          this.get('notifications').success('Dados salvos.');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },

      changeActiveStatus(user, status) {
        user.active = status;
        user.save().then(r => {
          if (status) {
            this.get('notifications').success('Conta de usuário ativada.');
          } else {
            this.get('notifications').success('Conta de usuário desativada.');
          }

          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      },

      changeBlockStatus(user, status) {
        let headers = {
          Accept: 'application/vnd.api+json'
        };

        let accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: _environment.default.API_HOST + '/block-user/' + user.id,
          type: 'POST',
          data: { blocked: status },
          cache: false,
          headers: headers
        }).then(response => {
          user.set('blocked', status);

          if (status) {
            this.get('notifications').success('Usuário bloqueado.');
          } else {
            this.get('notifications').success('Usuário desbloqueado.');
          }

          return response;
        }).fail(err => {
          this.send('queryError', err);
        });
      },

      changePassword(model) {
        let headers = {
          Accept: 'application/vnd.api+json'
        };

        let accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: _environment.default.API_HOST + '/auth/' + model.user.id + '/new-password',
          type: 'POST',
          data: {
            newPassword: model.newPassword,
            rNewPassword: model.rNewPassword
          },
          cache: false,
          headers: headers
        }).then(response => {
          this.get('notifications').success('Senha alterada com sucesso.');

          this.set('currentModel.newPassword', null);
          this.set('currentModel.rNewPassword', null);
          // success
          return response;
        }).fail(err => {
          this.send('queryError', err);
        });
      },
      addUserRole(roleName, user, cb) {
        let userRoles = user.get('roles');

        if (!userRoles) {
          user.set('roles', Ember.A());
          userRoles = user.get('roles');
        }

        if (userRoles.indexOf(roleName) > -1) {
          // this user already have the role:
          return cb();
        }

        userRoles.push(roleName);

        return this.get('acl').updateUserRoles(userRoles, user.id).then(() => {
          cb();
          return null;
        }).catch(cb);
      },
      removeUserRole(roleName, user, cb) {
        let userRoles = user.get('roles');

        if (!userRoles) {
          user.set('roles', Ember.A());
          userRoles = user.get('roles');
        }

        if (userRoles.indexOf(roleName) === -1) {
          // this user dont have the role:
          return cb();
        }

        const index = userRoles.indexOf(roleName);
        if (index !== -1) {
          userRoles.splice(index, 1);
        }

        return this.get('acl').updateUserRoles(userRoles, user.id).then(() => {
          cb();
          return null;
        }).catch(cb);
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    actions: {
      deleteRecord(record) {
        if (confirm(`Tem certeza que deseja deletar o vocabulário "${record.get('title')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O vocabulário "${record.get('title')}" foi deletado.`);
            this.transitionTo('vocabulary.index');
            return null;
          });
        }
      },

      save(record, alias) {
        record.save().then(function saveAlias(content) {
          if (!alias) {
            return content;
          }
          alias.alias = record.setAlias;
          return content;
        }).then(r => {
          this.get('notifications').success('Vocabulário salvo.');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      return {
        record: this.store.createRecord('vocabulary')
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('O vocabulário foi criado com sucesso.');

          this.transitionTo('vocabulary.index');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        records: this.get('store').query('vocabulary', {}),
        columns: [{
          propertyName: 'id',
          title: 'ID'
        }, {
          propertyName: 'name',
          filteredBy: 'name_starts-with',
          title: i18n.t('form-vocabulary-name')
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-vocabulary-createdAt'),
          component: 'mt-list-item-created-at'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-vocabulary'
        }]
      });
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return Ember.RSVP.hash({
        record: this.get('store').findRecord('vocabulary', params.id),
        alias: this.get('store').query('url-alia', {
          target: '/vocabulary/' + params.id,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            return r.objectAt(0);
          } else {
            return null;
          }
        })
      });
    },

    afterModel(model) {
      let id = Ember.get(model, 'record.id');

      if (model.alias && model.alias.alias && model.record && model.record.id) {
        Ember.set(model.record, 'setAlias', Ember.get(model.alias, 'alias'));
      } else {
        model.alias = this.get('store').createRecord('url-alia', {
          target: '/vocabulary/' + id,
          alias: '/vocabulary/' + id
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/item/terms/create', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      const vocabulary = this.modelFor('vocabulary.item').record;
      return {
        vocabulary: vocabulary,
        record: this.store.createRecord('term', {
          vocabularyName: Ember.get(vocabulary, 'name')
        })
      };
    },
    actions: {
      save(record) {
        record.save().then(r => {
          this.get('notifications').success('O termo foi criado com sucesso.');

          this.transitionTo('vocabulary.item.terms.index', this.get('currentModel.vocabulary.id'));
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/item/terms/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    term: Ember.inject.service(),

    model() {
      const vocabulary = this.modelFor('vocabulary.item').record;
      const i18n = this.get('i18n');

      return Ember.RSVP.hash({
        vocabulary: vocabulary,
        records: this.get('store').query('term', {
          vocabularyName: Ember.get(vocabulary, 'name')
        }),
        columns: [{
          propertyName: 'id',
          title: 'ID',
          className: 'mt-c-id'
        }, {
          propertyName: 'text',
          filteredBy: 'text_starts-with',
          title: i18n.t('form-term-text'),
          className: 'mt-c-text text-cell'
        }, {
          propertyName: 'createdAt',
          filteredBy: 'createdAt',
          title: i18n.t('form-term-createdAt'),
          component: 'mt-list-item-created-at',
          className: 'mt-c-createdAt'
        }, {
          propertyName: 'actions',
          disableSorting: true,
          disableFiltering: true,
          title: i18n.t('Actions'),
          component: 'mt-actions-vocabulary-terms',
          template: 'vocabulary/item/terms/list-item-actions'
        }]
      });
    },

    afterModel(model) {
      if (model.records && Ember.get(model.records, 'length')) {
        const length = Ember.get(model.records, 'length');
        for (let i = 0; i < length; i++) {
          const record = model.records.objectAt(i);
          Ember.set(record, 'vocabulary', model.vocabulary);
        }
      }
    },
    actions: {
      deleteRecord(record) {
        const vocabulary = this.modelFor('vocabulary.item').record;

        if (confirm(`Tem certeza que deseja deletar o termo "${record.get('text')}"? \nEssa ação não pode ser desfeita.`)) {
          record.destroyRecord().then(() => {
            this.get('notifications').success(`O termo "${record.get('text')}" foi deletado.`);
            this.transitionTo('vocabulary.item.terms.index', vocabulary.id);
            return null;
          });
        }
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/item/terms/item', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      const vocabulary = this.modelFor('vocabulary.item').record;

      return Ember.RSVP.hash({
        vocabulary: vocabulary,
        record: this.get('store').findRecord('term', params.termId || params.id, {
          adapterOptions: {
            vocabularyName: Ember.get(vocabulary, 'name')
          }
        }),
        alias: null
      });
    },
    afterModel(model) {
      if (model.record && model.record.id && model.vocabulary) {
        Ember.set(model.record, 'vocabulary', model.vocabulary);
      }

      const linkPermanent = Ember.get(model.record, 'linkPermanent');

      if (linkPermanent) {
        model.alias = this.get('store').query('url-alia', {
          target: linkPermanent,
          limit: 1,
          order: 'id DESC'
        }).then(r => {
          // get only one alias:
          if (r && r.objectAt && r.objectAt(0)) {
            model.alias = r.objectAt(0);
          } else {
            model.alias = this.get('store').createRecord('url-alia', {
              target: linkPermanent,
              alias: linkPermanent
            });
          }
        });

        return model.alias;
      }
    },
    actions: {
      save(record, alias) {
        record.save().then(function saveAlias(content) {
          if (!alias) {
            return content;
          }
          alias.alias = record.setAlias;
          return content;
        }).then(r => {
          this.get('notifications').success('O termo foi salvo.');
          // success
          return r;
        }).catch(err => {
          this.send('queryError', err);
        });
      }
    }
  });
});
;define('we-admin-hotel/routes/vocabulary/term', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin'], function (exports, _authenticatedRouteMixin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Route.extend(_authenticatedRouteMixin.default);
});
;define('we-admin-hotel/serializers/application', ['exports', 'ember-data/serializers/json-api'], function (exports, _jsonApi) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _jsonApi.default.extend({
    keyForAttribute(key) {
      return key;
    },
    keyForRelationship(key) {
      return key;
    },
    payloadTypeFromModelName(modelName) {
      return modelName;
    },
    modelNameFromPayloadKey(name) {
      return name;
    }
  });
});
;define('we-admin-hotel/services/acl', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  const systemRoles = ['administrator', 'authenticated', 'unAuthenticated'];

  exports.default = Ember.Service.extend({
    session: Ember.inject.service('session'),
    settings: Ember.inject.service('settings'),

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    userRoles: Ember.computed.alias('settings.userRoles'),
    isAdmin: Ember.computed.alias('settings.isAdmin'),
    permissions: Ember.computed.alias('settings.data.userPermissions'),

    /**
     * Check if current user can do something
     * @param  {String} permission
     * @return {Boolena}
     */
    can(permission) {
      if (this.get('isAdmin')) {
        return true;
      }

      if (!permission) {
        return false;
      }

      const permissions = this.get('permissions');

      if (!permissions) {
        return false;
      }

      return permissions[permission];
    },

    /**
     * Get all permissions and roles from api host
     *
     * @return {Promise}
     */
    getPermissionsAndRoles() {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/permission`,
          type: 'GET',
          headers: headers
        }).done(resolve).fail(reject);
      });
    },
    /**
     * Get Roles
     *
     * @return {Promise}
     */
    getRoles() {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/permission`,
          type: 'GET',
          headers: headers
        }).done(data => {
          resolve(data.roles);
          return null;
        }).fail(reject);
      });
    },
    /**
     * Get roles in list format
     *
     * @return {Promise}
     */
    getRolesArray() {
      return this.getRoles().then(data => {
        const roles = Ember.A([]);

        for (let name in data) {
          if (systemRoles.indexOf(name) > -1) {
            data[name].isSystemRole = true;
          }
          data[name].id = name;
          roles.push(data[name]);
        }

        return roles;
      });
    },
    /**
     * Get user roles
     *
     * @return {Promise}
     */
    getUserRoles(userId) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/user/${userId}/roles`,
          type: 'GET',
          headers: headers
        }).done(data => {
          resolve(data.data);
          return null;
        }).fail(reject);
      });
    },
    /**
     * Update user roles
     *
     * @return {Promise}
     */
    updateUserRoles(roleNames, userId) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        const data = { userRoles: roleNames };

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/user/${userId}/roles`,
          type: 'POST',
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data),
          headers: headers
        }).done(data => {
          console.log('result>', data);
          resolve(data.data);
          return null;
        }).fail(reject);
      });
    },
    /**
     * Request method to remove one permission from role
     *
     * @param {String} roleName
     * @param {String} permissionName
     * @return {Promise}
     */
    removePermission(roleName, permissionName) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/role/${roleName}/permissions/${permissionName}`,
          type: 'DELETE',
          headers: headers
        }).done(resolve).fail(reject);
      });
    },

    /**
     * Create one role request method
     */
    createRole(role) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        role.action = 'create';

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/role`,
          type: 'POST',
          dataType: 'json',
          data: role,
          headers: headers
        }).done(resolve).fail(reject);
      });
    },

    /**
     * Delete one role request method
     */
    deleteRole(role) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        role.action = 'delete';

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/role`,
          type: 'POST',
          dataType: 'json',
          data: role,
          headers: headers
        }).done(resolve).fail(reject);
      });
    },

    /**
     * Add one permission from role
     *
     * @param  {String} roleName
     * @param  {String} permissionName
     * @return {Promise}
     */
    addPermissionToRole(roleName, permissionName) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/role/${roleName}/permissions/${permissionName}`,
          type: 'POST',
          dataType: 'json',
          headers: headers
        }).done(resolve).fail(reject);
      });
    },

    /**
     * Remove one permission from role
     *
     * @param  {String} roleName
     * @param  {String} permissionName
     * @return {Promise}
     */
    removePermissionFromRole(roleName, permissionName) {
      return new window.Promise((resolve, reject) => {
        let headers = { Accept: 'application/vnd.api+json' },
            accessToken = this.get('session.session.authenticated.access_token');

        if (accessToken) {
          headers.Authorization = `Basic ${accessToken}`;
        }

        Ember.$.ajax({
          url: `${ENV.API_HOST}/acl/role/${roleName}/permissions/${permissionName}`,
          type: 'DELETE',
          dataType: 'json',
          headers: headers
        }).done(resolve).fail(reject);
      });
    }
  });
});
;define('we-admin-hotel/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _ajax) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _ajax.default;
    }
  });
});
;define('we-admin-hotel/services/ajaxService', ['exports', 'ember-ajax/services/ajax', 'ember-ajax/errors'], function (exports, _ajax, _errors) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  window.$.ajaxSetup({
    accepts: {
      json: 'application/vnd.api+json'
    },
    headers: {
      "Accept": "application/vnd.api+json"
    }
  });

  exports.default = _ajax.default.extend({
    session: Ember.inject.service(),
    host: ENV.API_HOST,

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    request(url, options) {
      this.get('session').authorize('authorizer:custom', headers => {
        this.set('headers', headers);
      });

      return this._super(url, options).catch(error => {
        if (error instanceof _errors.UnauthorizedError) {
          if (this.get('session.isAuthenticated')) {
            this.get('session').invalidate();
          }
        } else {
          throw error;
        }
      });
    }
  });
});
;define('we-admin-hotel/services/cookies', ['exports', 'ember-cookies/services/cookies'], function (exports, _cookies) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _cookies.default;
});
;define('we-admin-hotel/services/i18n', ['exports', 'ember-i18n/services/i18n'], function (exports, _i18n) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _i18n.default;
    }
  });
});
;define('we-admin-hotel/services/image', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.Service.extend({
    settings: Ember.inject.service(),

    getImageData(imageId) {
      const settings = this.get('settings');

      return Ember.$.ajax({
        url: `${settings.ENV.API_HOST}/api/v1/image/${imageId}/data`,
        type: 'GET',
        headers: settings.getHeaders()
      }).then(data => {
        if (data && data.image) {
          return Ember.A([data.image]);
        } else {
          return null;
        }
      });
    },

    getLastUserImages() {
      const settings = this.get('settings');

      return Ember.$.ajax({
        url: `${settings.ENV.API_HOST}/api/v1/image?selector=owner`,
        type: 'GET',
        headers: settings.getHeaders()
      }).then(data => {
        if (data && data.image) {
          return Ember.A(data.image);
        } else {
          return null;
        }
      });
    }
  });
});
;define('we-admin-hotel/services/moment', ['exports', 'ember-moment/services/moment', 'we-admin-hotel/config/environment'], function (exports, _moment, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const { get } = Ember;

  exports.default = _moment.default.extend({
    defaultFormat: get(_environment.default, 'moment.outputFormat')
  });
});
;define('we-admin-hotel/services/notification-messages-service', ['exports', 'ember-cli-notifications/services/notification-messages-service'], function (exports, _notificationMessagesService) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _notificationMessagesService.default;
    }
  });
});
;define('we-admin-hotel/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _session) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _session.default;
});
;define('we-admin-hotel/services/settings', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Service.extend({
    store: Ember.inject.service('store'),
    session: Ember.inject.service('session'),

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('ENV', ENV);
    },

    data: null,

    accessToken: Ember.computed.alias('session.session.authenticated.access_token'),

    authenticatedUserId: Ember.computed.alias('user.id'),
    user: null,
    // alias for help get current authenticated user roles
    userRoles: Ember.computed.alias('user.roles'),

    isAdmin: Ember.computed('userRoles', function () {
      let roles = this.get('userRoles');
      if (!roles || !roles.indexOf) {
        return false;
      }
      return roles.indexOf('administrator') > -1;
    }),
    // invert isAdmin to use in disabled inputs
    notIsAdmin: Ember.computed.not('isAdmin'),

    systemSettings: Ember.computed.alias('data.systemSettings'),

    imageHost: Ember.computed.alias('ENV.imageHost'),

    defaultClientDateFormat: 'DD/MM/YYYY hh:ss',
    dateFormat: Ember.computed.or('data.date.defaultFormat', 'defaultClientDateFormat'),

    themeCollorOptions: [{ id: 'default', name: 'Cor padrão do tema' }],

    getUserSettings() {
      // const uid = this.get('authenticatedUserId');
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('accessToken');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return Ember.$.ajax({
        url: ENV.API_HOST + '/user-settings?adminMenu=true',
        type: 'GET',
        cache: false,
        headers: headers
      }).then(response => {
        // sync authe between site and admin:
        if (response.authenticatedUser) {
          if (!this.get('session.isAuthenticated')) {
            console.log('should be authenticated...');
            // authenticate ...
            return this.get('session').authenticate('authenticator:custom', response.authenticatedUser.email, null, response.authenticatedUser.id).then(() => {
              location.reload();
              return response;
            });
          }
        } else {
          // user not is authenticated:
          if (this.get('session.isAuthenticated')) {
            return this.get('session').invalidate().then(() => {
              location.reload();
              return response;
            });
          }
        }

        return response;
      }).then(response => {
        this.set('data', response);

        if (response.authenticatedUser) {
          return this.get('store').findRecord('user', response.authenticatedUser.id).then(u => {
            this.set('user', u);

            return response;
          });
        } else {
          return response;
        }
      });
    },

    setSystemSettings(newData) {
      // const uid = this.get('authenticatedUserId');
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('accessToken');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return Ember.$.ajax({
        url: ENV.API_HOST + '/system-settings',
        type: 'POST',
        cache: false,
        headers: headers,
        data: newData
      }).then(response => {
        this.set('systemSettings', response);
        return response;
      });
    },

    getThemeConfigs() {
      // const uid = this.get('authenticatedUserId');
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('accessToken');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return Ember.$.ajax({
        url: ENV.API_HOST + '/theme',
        type: 'get',
        cache: false,
        headers: headers
      }).then(response => {
        // this.set('systemSettings', response);
        return response;
      });
    },

    defaultSelectorLinksComponents() {
      return [{
        name: 'content',
        title: 'Links para páginas',
        componentName: 'menu-page-selector'
      }, {
        name: 'custom',
        title: 'Links personalizados',
        componentName: 'menu-custom-link-form'
      }, {
        name: 'category',
        title: 'Links para categorias',
        componentName: 'menu-category-selector'
      }, {
        name: 'tags',
        title: 'Links para tags',
        componentName: 'menu-tag-selector'
      }];
    },

    getHeaders() {
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return headers;
    },

    slugfy(str) {
      if (!str) {
        return null;
      }

      str = str.replace(/^\s+|\s+$/g, ''); // trim
      str = str.toLowerCase();

      // remove accents, swap ñ for n, etc
      const from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
      const to = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
      for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
      }

      str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

      return str;
    }
  });
});
;define('we-admin-hotel/services/term', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Service.extend({
    session: Ember.inject.service(),
    ajax: Ember.inject.service(),

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');
    },

    query(vocabularyId, opts) {
      let headers = { Accept: 'application/json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }

      return Ember.$.ajax({
        url: `${ENV.API_HOST}/vocabulary/${vocabularyId}/term`,
        type: 'GET',
        headers: headers,
        data: opts
      });
    },

    getSystemCategories() {
      let url = `${ENV.API_HOST}/api/v1/term-texts?vocabularyName=Category`;
      return this.get('ajax').request(url).then(json => json.term);
    }
  });
});
;define('we-admin-hotel/services/text-measurer', ['exports', 'ember-text-measurer/services/text-measurer'], function (exports, _textMeasurer) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _textMeasurer.default;
    }
  });
});
;define('we-admin-hotel/services/upload', ['exports', 'ember-uploader/uploaders/uploader'], function (exports, _uploader) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  let ENV;

  exports.default = Ember.Service.extend({
    notifications: Ember.inject.service('notification-messages'),
    session: Ember.inject.service(),

    modalOpen: Ember.computed.alias('fileSelectedCallback'),

    notReadyToUploadOB: Ember.observer('imagesToUpload.length', 'filesToUpload.length', function () {
      if (this.get('imagesToUpload.length') || this.get('filesToUpload.length')) {
        return this.set('notReadyToUpload', false);
      }

      this.set('notReadyToUpload', true);
    }),
    notReadyToUpload: true,

    error: null,

    uploadingImage: false,
    description: null,

    fileSelectedCallback: null,
    // list of images to upload
    imagesToUpload: null,
    // list of generic files to upload
    filesToUpload: null,

    init() {
      this._super(...arguments);

      ENV = Ember.getOwner(this).resolveRegistration('config:environment');

      this.set('imageURL', `${ENV.API_HOST}/api/v1/image`);
      this.set('fileURL', `${ENV.API_HOST}/api/v1/file`);
    },

    // image methods:

    initUploadMecanism() {
      this.set('imagesToUpload', Ember.A());
      this.set('filesToUpload', Ember.A());
    },
    addImageToUpload(f) {
      if (!f || typeof f !== 'object') {
        return;
      }
      Ember.set(f, 'isUploading', false);
      Ember.set(f, 'uploader', _uploader.default.create({
        ajaxSettings: {
          headers: this.getHeaders()
        },
        paramName: 'image',
        url: this.get('imageURL')
      }));

      Ember.set(f, 'percent', 0);

      /**
       * Start upload of this file:
       */
      f.upload = function startImageUpload() {
        return new window.Promise((resolve, reject) => {
          let uploader = this.uploader;
          let file = this;

          Ember.set(f, 'isUploading', true);
          Ember.set(f, 'isInAction', true);
          Ember.set(f, 'barType', 'info');
          Ember.set(f, 'uploadError', null);
          Ember.set(f, 'uploadSuccess', false);

          uploader.on('progress', e => {
            if (!e.percent) {
              e.percent = 0;
            }
            Ember.set(f, 'percent', Math.floor(e.percent));
          });

          uploader.on('didUpload', () => {
            Ember.set(f, 'barType', 'success');
            Ember.set(f, 'isInAction', false);
          });

          uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
            Ember.set(f, 'barType', 'danger');
            Ember.set(f, 'isInAction', false);
          });

          uploader.upload(file, {
            description: this.description || ''
          }).then(r => {
            Ember.set(f, 'uploadSuccess', true);
            resolve(r);
          }).catch(err => {
            Ember.set(f, 'uploadSuccess', false);
            Ember.set(f, 'uploadError', err);
            Ember.Logger.error('service:upload.upload:Erro on upload', err);
            reject(err);
          });
        });
      }.bind(f);

      this.get('imagesToUpload').pushObject(f);
    },
    removeImageFromUploadList(image) {
      this.get('imagesToUpload').removeObject(image);
    },

    // file methods:

    addFileToUpload(f) {
      if (!f || typeof f !== 'object') {
        return;
      }
      Ember.set(f, 'isUploading', false);
      Ember.set(f, 'uploader', _uploader.default.create({
        ajaxSettings: {
          headers: this.getHeaders()
        },
        paramName: 'file',
        url: this.get('fileURL')
      }));

      Ember.set(f, 'percent', 0);
      /**
       * Start upload of this file:
       */
      f.upload = function startFileUpload() {
        return new window.Promise((resolve, reject) => {
          let uploader = this.uploader;
          let file = this;

          Ember.set(f, 'isUploading', true);
          Ember.set(f, 'isInAction', true);
          Ember.set(f, 'barType', 'info');
          Ember.set(f, 'uploadError', null);
          Ember.set(f, 'uploadSuccess', false);

          uploader.on('progress', e => {
            if (!e.percent) {
              e.percent = 0;
            }
            // Handle progress changes
            // Use `e.percent` to get percentage
            Ember.set(f, 'percent', Math.floor(e.percent));
          });

          uploader.on('didUpload', e => {
            Ember.set(f, 'barType', 'success');
            Ember.set(f, 'isInAction', false);
            console.log('didUpload', e);
          });

          uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
            Ember.set(f, 'barType', 'danger');
            Ember.set(f, 'isInAction', false);
          });

          uploader.upload(file, {
            description: this.description || ''
          }).then(r => {
            Ember.set(f, 'uploadSuccess', true);
            resolve(r);
          }).catch(err => {
            Ember.set(f, 'uploadSuccess', false);
            Ember.set(f, 'uploadError', err);
            Ember.Logger.error('service:upload.upload:Erro on upload', err);
            reject(err);
          });
        });
      }.bind(f);

      this.get('filesToUpload').pushObject(f);
    },
    removeFileFromUploadList(file) {
      this.get('filesToUpload').removeObject(file);
    },

    // Cancel upload and reset lists:
    cancel() {
      this.set('imagesToUpload', null);
      this.set('filesToUpload', null);
    },

    uploadImages() {
      return new window.Promise((resolve, reject) => {
        let results = [];
        let imagesToUpload = this.get('imagesToUpload');
        if (!imagesToUpload || !imagesToUpload.length) {
          return resolve();
        }

        imagesToUpload.reduce(function (prom, ITU) {
          return prom.then(function () {
            return ITU.upload().then(result => {
              if (result && result.image) {
                results.push(result.image);
              }
            }).catch(err => {
              console.log('err>', err);
              return err;
            });
          });
        }, Ember.RSVP.resolve()).then(() => {
          // after all
          this.set('imagesToUpload', Ember.A());
          this.set('filesToUpload', Ember.A());
          resolve(results);
        }).catch(err => {
          this.set('imagesToUpload', Ember.A());
          this.set('filesToUpload', Ember.A());
          reject(err);
        });
      });
    },

    uploadFiles() {
      return new window.Promise((resolve, reject) => {
        let results = [];
        let filesToUpload = this.get('filesToUpload');
        if (!filesToUpload || !filesToUpload.length) {
          return resolve();
        }

        filesToUpload.reduce(function (prom, ITU) {
          return prom.then(function () {
            return ITU.upload().then(result => {
              if (result && result.file) {
                results.push(result.file);
              }
            }).catch(err => {
              console.log('err>', err);
              return err;
            });
          });
        }, Ember.RSVP.resolve()).then(() => {
          // after all
          this.set('imagesToUpload', Ember.A());
          this.set('filesToUpload', Ember.A());
          resolve(results);
        }).catch(err => {
          this.set('imagesToUpload', Ember.A());
          this.set('filesToUpload', Ember.A());
          reject(err);
        });
      });
    },

    get_file_picker_callback() {
      const uploadService = this;

      return function (cb, value, meta) {
        if (meta.filetype === 'image') {
          uploadService.openImageSelector(value, meta, (err, fileData) => {
            if (err || !fileData || !fileData.image) {
              cb();
              return null;
            }

            let fileUrl = fileData.image.urls.original;

            if (ENV.environment === 'development') {
              fileUrl = ENV.API_HOST + fileUrl;
            }

            cb(fileUrl, {
              title: fileData.image.originalname,
              alt: fileData.image.description,
              width: '100%',
              height: null
            });
          });
        } else {
          return cb();
        }
      };
    },

    openImageSelector(value, meta, cb) {
      Ember.set(this, 'fileSelectedCallback', cb);
      Ember.$('.mce-container.mce-floatpanel').hide();
    },

    onHideUploadModal() {
      this.set('fileSelectedCallback', null);
      Ember.$('.mce-container.mce-floatpanel').show();
      this.hideUploadModal();
    },

    hideUploadModal() {
      if (this.get('uploadingImage')) {
        this.set('uploadingImage', false);
      }

      this.set('error', null);
      this.set('uploader', null);
      this.set('selectedFile', null);
      this.set('description', null);
      this.set('uploadingImage', false);
    },

    selected(files) {
      console.log('DEPRECATED! old upload.selected');
      // const file = files[0];
      // this.set('selectedFile', file);
      // const reader = new FileReader();

      // reader.onload = (e)=> {
      //   // get local file src
      //   this.set('previewImageSrc', e.target.result);

      //   let fileSizeInMB = Math.round(file.size/1024/1024);

      //   if (fileSizeInMB >= 10) {

      //     this.get('notifications').error('A imagem selecionada tem '+fileSizeInMB+'MB'+
      //       ' e o limite de envio de imagens é 10MB. Selecione uma imagem com menos de 10MB de tamanho.');
      //     this.hideUploadModal();
      //   }
      // };
      // reader.readAsDataURL(file);
    },
    progress(uploader, e) {
      this.set('percent', e.percent);
    },
    /**
     * did upload action
     *
     * @param  {Object} uploader
     * @param  {Object} e
     */
    didUpload() {
      // this.set('uploader', null);
      // this.set('description', null);
      // this.set('selectedFile', null);
    },

    upload() {
      // // done upload...
      // this.get('uploader').upload(this.get('selectedFile'), {
      //   description: (this.get('description') || '')
      // })
      // .then( (r)=> {
      //   this.get('fileSelectedCallback')(null, r);
      //   this.set('fileSelectedCallback', null);

      //   this.set('uploader', null);
      //   this.set('selectedFile', null);
      //   this.set('uploadingImage', false);
      //   return r;
      // })
      // .catch( (err)=> {
      //   this.get('fileSelectedCallback')(err);
      //   this.set('fileSelectedCallback', null);
      //   this.hideUploadModal();
      //   Ember.Logger.error('service:upload.upload:Erro on upload', err);
      // });
    },
    didError(uploader, jqXHR, textStatus, errorThrown) {
      Ember.Logger.error('didError>', uploader, jqXHR, textStatus, errorThrown);
    },

    onSelectSalvedImage(image) {
      this.hideUploadModal();

      this.get('fileSelectedCallback')(null, {
        image: image
      });

      this.set('fileSelectedCallback', null);
      this.set('uploader', null);
      this.set('selectedFile', null);
      this.set('uploadingImage', false);
    },

    updateImageDescription(image) {
      this.updateDescription(image, 'image');
    },

    updateFileDescription(file) {
      this.updateDescription(file, 'file');
    },

    updateDescription(record, model) {
      let headers = this.getHeaders();

      return Ember.$.ajax({
        url: ENV.API_HOST + '/api/v1/' + model + '/' + record.id,
        type: 'POST',
        cache: false,
        headers: headers,
        data: {
          description: record.description
        }
      }).then(() => {
        this.get('notifications').success('Descrição atualizada com sucesso');
      }).catch(() => {
        this.get('notifications').error('Erro ao atualizar a descrição, tente novamente mais tarde ou entre em contato com um administrador');
      });
    },

    getHeaders() {
      let headers = { Accept: 'application/vnd.api+json' },
          accessToken = this.get('session.session.authenticated.access_token');

      if (accessToken) {
        headers.Authorization = `Basic ${accessToken}`;
      }
      return headers;
    }
  });
});
;define('we-admin-hotel/session-stores/application', ['exports', 'ember-simple-auth/session-stores/adaptive'], function (exports, _adaptive) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _adaptive.default.extend();
});
;define("we-admin-hotel/templates/application-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/THNP/Kx", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"bootstrap-loading\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/application-loading.hbs" } });
});
;define("we-admin-hotel/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "y+B8ploo", "block": "{\"symbols\":[],\"statements\":[[1,[27,\"notification-container\",null,[[\"position\"],[\"top\"]]],false],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"session\",\"needsReload\"]]],null,{\"statements\":[[0,\"  \"],[1,[21,\"bootstrap-loading\"],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[23,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"    \"],[15,\"partials/home-not-manager\",[]],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[15,\"partials/home-un-authenticated\",[]],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[15,\"partials/file-selector-modal\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/application.hbs" } });
});
;define("we-admin-hotel/templates/comments", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "APHD/3zK", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/comments.hbs" } });
});
;define("we-admin-hotel/templates/comments/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "JWjbuOom", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar comentário #\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[10],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Comentário:\"],[10],[0,\"\\n              \"],[1,[27,\"tinymce-editor\",null,[[\"options\",\"value\"],[[23,[\"editorOptions\"]],[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"comments.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Lista de comentários\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/comments/form.hbs" } });
});
;define("we-admin-hotel/templates/comments/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ftze+VhX", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Comentários\"],[10],[0,\"\\n\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/comments/index.hbs" } });
});
;define("we-admin-hotel/templates/comments/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Gj/CVcnj", "block": "{\"symbols\":[],\"statements\":[[15,\"comments/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/comments/item.hbs" } });
});
;define("we-admin-hotel/templates/components/acl-btn-create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mRv5cGMy", "block": "{\"symbols\":[\"&default\"],\"statements\":[[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus text-success\"],[9],[10],[0,\" \"],[14,1]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/acl-btn-create.hbs" } });
});
;define("we-admin-hotel/templates/components/acl-can", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "7DZeQO20", "block": "{\"symbols\":[\"&inverse\",\"&default\"],\"statements\":[[4,\"if\",[[23,[\"can\"]]],null,{\"statements\":[[14,2]],\"parameters\":[]},{\"statements\":[[14,1]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/acl-can.hbs" } });
});
;define("we-admin-hotel/templates/components/bootstrap-loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xYtDyQ5u", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"loading-wrapper\"],[9],[0,\"\\n  \"],[7,\"img\"],[11,\"class\",\"loading-gif\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/bootstrap-loading.hbs" } });
});
;define("we-admin-hotel/templates/components/btn-assoc-company-content", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "L9rJPgQA", "block": "{\"symbols\":[\"&default\"],\"statements\":[[1,[21,\"iconContent\"],true],[14,1],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/btn-assoc-company-content.hbs" } });
});
;define("we-admin-hotel/templates/components/content-tag-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Og3XrMyE", "block": "{\"symbols\":[\"term\"],\"statements\":[[7,\"table\"],[11,\"class\",\"table table-condensed table-bordered\"],[9],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"terms\"]]],null,{\"statements\":[[0,\"    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"content-tag-selector-term\"],[9],[1,[22,1,[]],false],[10],[0,\"\\n      \"],[7,\"td\"],[11,\"width\",\"35px\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"onRemoveTag\"]],[9],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"form\"],[11,\"class\",\"form-inline\"],[3,\"action\",[[22,0,[]],\"onAddTag\"]],[9],[0,\"\\n  \"],[7,\"fieldset\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\"],[[23,[\"newTerm\"]],\"form-control\"]]],false],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-plus\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"content.tag.Add\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/content-tag-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-date", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/yKRylZx", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Placeholder\",\"placeholder\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-date.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-description", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Odmfka8K", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\",\"placeholder\"],[\"text\",\"Identificação:\",\"label\",\"Texto usado apenas para identificação\"]]],false],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[9],[0,\"Descrição (texto que aparecerá no formulário):\"],[10],[0,\"\\n    \"],[1,[27,\"tinymce-editor\",null,[[\"options\",\"value\"],[[23,[\"editorOptions\"]],[23,[\"field\",\"help\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-description.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-email", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "FaGssD/z", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Placeholder\",\"placeholder\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-email.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-number", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "UDCasTbx", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group col-sm-6\"],[9],[0,\"\\n      \"],[7,\"label\"],[12,\"for\",[28,[[21,\"elementId\"],\"-minValue\"]]],[9],[0,\"Valor mínimo\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"id\",\"class\",\"name\",\"value\",\"type\"],[[27,\"concat\",[[23,[\"elementId\"]],\"-minValue\"],null],\"form-control\",\"minValue\",[23,[\"minValue\"]],\"number\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group col-sm-6\"],[9],[0,\"\\n      \"],[7,\"label\"],[12,\"for\",[28,[[21,\"elementId\"],\"-maxValue\"]]],[9],[0,\"Valor máximo\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"id\",\"class\",\"name\",\"value\",\"type\"],[[27,\"concat\",[[23,[\"elementId\"]],\"-maxValue\"],null],\"form-control\",\"maxValue\",[23,[\"maxValue\"]],\"number\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Placeholder\",\"placeholder\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-number.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-select", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "rkh4Nf3Y", "block": "{\"symbols\":[\"form\",\"value\",\"key\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"addOption\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Valor padrão\",\"defaultValue\"]]],false],[0,\"\\n\\n  \"],[7,\"h5\"],[9],[0,\"Opções:\"],[10],[0,\"\\n\"],[4,\"each\",[[27,\"-each-in\",[[23,[\"field\",\"fieldOptions\"]]],null]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"input-group input-group-sm d-f-f-s-i\"],[9],[0,\"\\n      \"],[7,\"input\"],[11,\"disabled\",\"disabled\"],[12,\"value\",[28,[[22,2,[]]]]],[11,\"class\",\"form-control\"],[11,\"type\",\"text\"],[9],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"input-group-btn\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"removeOption\",[22,3,[]]]],[9],[0,\"Remover\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[2,3]},null],[0,\"\\n  \"],[7,\"br\"],[9],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"input-group input-group-sm\"],[9],[0,\"\\n    \"],[1,[27,\"input\",null,[[\"id\",\"class\",\"name\",\"value\",\"type\",\"placeholder\"],[[27,\"concat\",[[23,[\"elementId\"]],\"-optionToAdd\"],null],\"form-control\",\"optionToAdd\",[23,[\"optionToAdd\"]],\"text\",\"Adicionar opção\"]]],false],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"input-group-btn\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-primary\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addOption\"]],[9],[0,\"Adicionar\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"class\",\"type\",\"onClick\"],[\"btn-sm\",\"button\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-select.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-text", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lC0ATUe0", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Placeholder\",\"placeholder\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-text.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-textarea", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6GNidzBe", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\",\"size\"],[\"text\",\"Label:\",\"label\",\"255\"]]],false],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[12,\"for\",[28,[[21,\"elementId\"],\"-rows\"]]],[9],[0,\"Quantidade de linhas do editor:\"],[10],[0,\"\\n    \"],[1,[27,\"input\",null,[[\"id\",\"class\",\"name\",\"value\",\"type\"],[[27,\"concat\",[[23,[\"elementId\"]],\"-rows\"],null],\"form-control\",\"rows\",[23,[\"rows\"]],\"number\"]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[12,\"for\",[28,[[21,\"elementId\"],\"-maxlength\"]]],[9],[0,\"Máximo de palavras do campo:\"],[10],[0,\"\\n    \"],[1,[27,\"input\",null,[[\"id\",\"class\",\"name\",\"value\",\"type\"],[[27,\"concat\",[[23,[\"elementId\"]],\"-maxlength\"],null],\"form-control\",\"maxlength\",[23,[\"maxlength\"]],\"number\"]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-textarea.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-title", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "CZMfhDlD", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\",\"size\"],[\"text\",\"Título:\",\"label\",\"255\"]]],false],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-title.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-field-url", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mZd4Rb0X", "block": "{\"symbols\":[\"form\"],\"statements\":[[4,\"bs-form\",null,[[\"model\",\"onSubmit\"],[[23,[\"field\"]],[27,\"action\",[[22,0,[]],\"save\"],null]]],{\"statements\":[[0,\"  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Label\",\"label\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Placeholder\",\"placeholder\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"text\",\"Texto de ajuda\",\"help\"]]],false],[0,\"\\n  \"],[1,[27,\"component\",[[22,1,[\"element\"]]],[[\"controlType\",\"label\",\"property\"],[\"checkbox\",\"Pode ficar vazio?\",\"allowNull\"]]],false],[0,\"\\n  \"],[4,\"bs-button\",null,[[\"class\",\"onClick\"],[\"btn-sm\",[27,\"action\",[[22,0,[]],\"deleteItem\"],null]]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-field-url.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-fields-sort-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "rOAzNylF", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"d-f-list-group-item-label\"],[9],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"span\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-arrows\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"truncate\",[[23,[\"field\",\"label\"]],30],null],false],[0,\" \"],[4,\"unless\",[[23,[\"field\",\"allowNull\"]]],null,{\"statements\":[[0,\"*\"]],\"parameters\":[]},null],[0,\" - \"],[1,[23,[\"field\",\"type\"]],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"actions\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"toggleEditForm\"]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-primary\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"deleteItem\",[23,[\"field\"]]]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n        \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar field [id:\"],[1,[23,[\"field\",\"id\"]],false],[0,\"]\"]],\"parameters\":[]},null],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"hideForm\"]]],null,{\"statements\":[[0,\"      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default pull-right\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"openEditForm\",false]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default pull-right\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"closeEditForm\",true]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-caret-up\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"  \"],[10],[0,\"\\n\\n\"],[4,\"bs-collapse\",null,[[\"collapsed\"],[[23,[\"hideForm\"]]]],{\"statements\":[[0,\"    \"],[1,[27,\"component\",[[23,[\"formComponentName\"]]],[[\"field\"],[[23,[\"field\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-fields-sort-item.hbs" } });
});
;define("we-admin-hotel/templates/components/d-form-fields-sort-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zdYmROQ4", "block": "{\"symbols\":[\"field\"],\"statements\":[[4,\"each\",[[23,[\"sortedFields\"]]],null,{\"statements\":[[0,\"  \"],[1,[27,\"d-form-fields-sort-item\",null,[[\"field\",\"group\",\"parentDepth\",\"onSortEnd\",\"deleteItem\"],[[22,1,[]],[23,[\"group\"]],[23,[\"depth\"]],[23,[\"onSortEnd\"]],[23,[\"deleteItem\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/d-form-fields-sort-list.hbs" } });
});
;define('we-admin-hotel/templates/components/ember-popper-targeting-parent', ['exports', 'ember-popper/templates/components/ember-popper-targeting-parent'], function (exports, _emberPopperTargetingParent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
;define('we-admin-hotel/templates/components/ember-popper', ['exports', 'ember-popper/templates/components/ember-popper'], function (exports, _emberPopper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
;define("we-admin-hotel/templates/components/field-content-publication", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ACIP6xrX", "block": "{\"symbols\":[\"m\"],\"statements\":[[4,\"if\",[[23,[\"isPublished\"]]],null,{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-check-o text-success\"],[9],[10],[0,\" \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"field-content-publication-date-picker\"],[9],[0,\"\\n    \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\"],null],[27,\"readonly\",[[23,[\"publicationDate\"]]],null]]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm btn-un-publish\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"unPublish\"]],[9],[7,\"i\"],[11,\"class\",\"fa fa-window-close text-danger\"],[9],[10],[0,\" Despublicar\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[4,\"if\",[[27,\"eq\",[[23,[\"publishMethod\",\"id\"]],\"unPublished\"],null]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-calendar-times-o text-danger\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"if\",[[27,\"eq\",[[23,[\"publishMethod\",\"id\"]],\"on_create\"],null]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-calendar-check-o text-success\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[27,\"eq\",[[23,[\"publishMethod\",\"id\"]],\"schendule\"],null]],null,{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar text-primary\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[7,\"strong\"],[9],[1,[23,[\"publishMethod\",\"text\"]],false],[10],[0,\" \"],[7,\"button\"],[11,\"class\",\"btn btn-link btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"openEditor\"]],[9],[0,\"Editar\"],[10],[0,\"\\n\"],[4,\"if\",[[27,\"eq\",[[23,[\"publishMethod\",\"id\"]],\"schendule\"],null]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[9],[0,\"Para: \"],[1,[27,\"moment-format\",[[23,[\"publicationDate\"]],\"DD/MM/YYYY h:mm a\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"editorIsOpen\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"publication-form\"],[9],[0,\"\\n    \"],[4,\"power-select\",null,[[\"options\",\"selected\",\"allowClear\",\"onchange\"],[[23,[\"publishMethods\"]],[23,[\"newPublishMethod\"]],false,[27,\"action\",[[22,0,[]],\"changePublishMethod\",[23,[\"newPublishMethod\"]]],null]]],{\"statements\":[[1,[22,1,[\"text\"]],false]],\"parameters\":[1]},null],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"showDatePicker\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"field-content-publication-date-picker\"],[9],[0,\"\\n        \"],[1,[27,\"date-time-picker\",null,[[\"minDate\",\"onChange\",\"date\"],[[23,[\"minDate\"]],[27,\"action\",[[22,0,[]],\"changeDate\"],null],[27,\"readonly\",[[23,[\"newPublicationDate\"]]],null]]]],false],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-primary\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"savePublicationDate\"]],[9],[0,\"Ok\"],[10],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-link\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"cancelChanges\"]],[9],[0,\"Cancelar\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/field-content-publication.hbs" } });
});
;define("we-admin-hotel/templates/components/field-model-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "U7W+1Emr", "block": "{\"symbols\":[\"record\"],\"statements\":[[4,\"if\",[[23,[\"label\"]]],null,{\"statements\":[[7,\"label\"],[9],[1,[21,\"label\"],true],[10]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"selected\",\"search\",\"onchange\"],[true,[23,[\"selected\"]],[27,\"action\",[[22,0,[]],\"onSearch\"],null],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"selected\"]]],null]],null]]],{\"statements\":[[0,\" [\"],[1,[22,1,[\"id\"]],false],[0,\"] \"],[1,[27,\"get\",[[22,1,[]],[23,[\"displayValue\"]]],null],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/field-model-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/field-role-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3GzBU1n+", "block": "{\"symbols\":[\"role\"],\"statements\":[[4,\"power-select\",null,[[\"options\",\"selected\",\"searchField\",\"placeholder\",\"onchange\"],[[23,[\"roles\"]],[23,[\"selected\"]],\"id\",[23,[\"placeholder\"]],[27,\"action\",[[22,0,[]],\"setLinkUserRole\"],null]]],{\"statements\":[[1,[22,1,[\"name\"]],false]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/field-role-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/field-text-editor", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "IXB5F86P", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"label\"]]],null,{\"statements\":[[7,\"label\"],[9],[1,[21,\"label\"],true],[10]],\"parameters\":[]},null],[0,\"\\n\"],[1,[27,\"tinymce-editor\",null,[[\"options\",\"value\"],[[23,[\"editorOptions\"]],[23,[\"value\"]]]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/field-text-editor.hbs" } });
});
;define("we-admin-hotel/templates/components/file-upload-file-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jkjLN7fg", "block": "{\"symbols\":[\"p\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[0,\"Descrição:\"],[10],[0,\"\\n      \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"item\",\"description\"]],\"form-control\",\"4\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"bs-button\",null,[[\"onClick\",\"icon\",\"size\",\"disabled\"],[[27,\"action\",[[22,0,[]],\"deleteItem\"],null],\"glyphicon glyphicon-remove\",\"sm\",[23,[\"item\",\"isUploading\"]]]],{\"statements\":[[0,\"        Remover\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"file-upload-file-item-progress\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"item\",\"isUploading\"]]],null,{\"statements\":[[4,\"bs-progress\",null,null,{\"statements\":[[0,\"          \"],[1,[27,\"component\",[[22,1,[\"bar\"]]],[[\"value\",\"minValue\",\"maxValue\",\"roundDigits\",\"showLabel\",\"animate\",\"type\",\"striped\"],[[23,[\"item\",\"percent\"]],0,100,3,true,[23,[\"item\",\"isInAction\"]],[23,[\"item\",\"barType\"]],true]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-upload-file-item.hbs" } });
});
;define("we-admin-hotel/templates/components/file-upload-file-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "BXvlfaZg", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"input-file-container\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"input-file-inp-container\"],[9],[0,\"\\n    \"],[7,\"input\"],[11,\"class\",\"input-file\"],[11,\"id\",\"file-upload-file-s-input\"],[11,\"accept\",\"*/*\"],[12,\"multiple\",[21,\"multiple\"]],[11,\"type\",\"file\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"label\"],[11,\"tabindex\",\"0\"],[11,\"for\",\"file-upload-file-s-input\"],[11,\"class\",\"input-file-trigger\"],[9],[0,\"Selecionar...\"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"p\"],[11,\"class\",\"file-return\"],[9],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-upload-file-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/file-upload-image-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "z1V363TO", "block": "{\"symbols\":[\"p\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-3\"],[9],[0,\"\\n    \"],[4,\"if\",[[23,[\"src\"]]],null,{\"statements\":[[7,\"img\"],[11,\"class\",\"img-responsive\"],[12,\"src\",[28,[[21,\"src\"]]]],[9],[10]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[0,\"Descrição:\"],[10],[0,\"\\n      \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"item\",\"description\"]],\"form-control\",\"4\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-3\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"bs-button\",null,[[\"onClick\",\"icon\",\"size\",\"disabled\"],[[27,\"action\",[[22,0,[]],\"deleteItem\"],null],\"glyphicon glyphicon-remove\",\"sm\",[23,[\"item\",\"isUploading\"]]]],{\"statements\":[[0,\"        Remover\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"file-upload-image-item-progress\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"item\",\"isUploading\"]]],null,{\"statements\":[[4,\"bs-progress\",null,null,{\"statements\":[[0,\"          \"],[1,[27,\"component\",[[22,1,[\"bar\"]]],[[\"value\",\"minValue\",\"maxValue\",\"roundDigits\",\"showLabel\",\"animate\",\"type\",\"striped\"],[[23,[\"item\",\"percent\"]],0,100,3,true,[23,[\"item\",\"isInAction\"]],[23,[\"item\",\"barType\"]],true]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-upload-image-item.hbs" } });
});
;define("we-admin-hotel/templates/components/file-upload-image-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zamnrMpq", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"input-file-container\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"input-file-inp-container\"],[9],[0,\"\\n    \"],[7,\"input\"],[11,\"class\",\"input-file\"],[11,\"id\",\"file-upload-image-s-input\"],[11,\"accept\",\"image/*\"],[12,\"multiple\",[21,\"multiple\"]],[11,\"type\",\"file\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"label\"],[11,\"tabindex\",\"0\"],[11,\"for\",\"file-upload-image-s-input\"],[11,\"class\",\"input-file-trigger\"],[9],[0,\"Selecionar...\"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"p\"],[11,\"class\",\"file-return\"],[9],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-upload-image-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/file-uploader-tr", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2HIj6eij", "block": "{\"symbols\":[],\"statements\":[[7,\"td\"],[11,\"class\",\"file-uploader-tr-thumbnail\"],[9],[0,\"\\n  \"],[1,[23,[\"file\",\"name\"]],false],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"file-uploader-tr-description\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[9],[0,\"Descrição / alt:\"],[10],[0,\"\\n    \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"file\",\"description\"]],\"form-control\",\"2\"]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n\"],[4,\"bs-button\",null,[[\"onClick\",\"icon\",\"size\"],[[27,\"action\",[[22,0,[]],\"updateDescription\"],null],\"glyphicon glyphicon-edit\",\"xs\"]],{\"statements\":[[0,\"      Salvar\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"file-uploader-tr-actions\"],[9],[0,\"\\n  \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"removeFile\",[23,[\"file\"]]]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"file.remove\"],null],false],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-uploader-tr.hbs" } });
});
;define("we-admin-hotel/templates/components/file-uploader", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "5UrmHBRb", "block": "{\"symbols\":[\"modal\",\"footer\",\"item\",\"file\"],\"statements\":[[7,\"table\"],[11,\"class\",\"table table-bordered\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"value\"]]],null,{\"statements\":[[0,\"    \"],[7,\"thead\"],[9],[0,\"\\n      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Nome:\"],[10],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Descrição:\"],[10],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Tipo:\"],[10],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Ações:\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"value\"]]],null,{\"statements\":[[0,\"    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"file-table-name\"],[9],[0,\"\\n        \"],[1,[22,4,[\"name\"]],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"file-table-description\"],[9],[0,\"\\n        \"],[1,[22,4,[\"description\"]],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"file-table-mime\"],[9],[0,\"\\n        \"],[1,[22,4,[\"mime\"]],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"file-table-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"removeFile\",[22,4,[]]]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"file.remove\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[4]},null],[0,\"  \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"canAddMore\"]]],null,{\"statements\":[[0,\"    \"],[7,\"tfoot\"],[9],[0,\"\\n      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"td\"],[11,\"colspan\",\"3\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"openFileUploader\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"file.Add\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\\n\"],[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHidden\"],[[23,[\"uploadingFile\"]],[27,\"action\",[[22,0,[]],\"upload\"],null],[27,\"action\",[[22,0,[]],\"onHideUploadModal\"],null]]],{\"statements\":[[4,\"component\",[[22,1,[\"header\"]]],null,{\"statements\":[[0,\"    \"],[7,\"h4\"],[11,\"class\",\"modal-title\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-picture\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"file.selector\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[23,[\"error\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"alert alert-danger text-center\"],[11,\"role\",\"alert\"],[9],[1,[21,\"error\"],true],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"file-selected-list\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"upload\",\"filesToUpload\"]]],null,{\"statements\":[[0,\"          \"],[1,[27,\"file-upload-file-item\",null,[[\"item\"],[[22,3,[]]]]],false],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"      \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"canSelectMore\"]]],null,{\"statements\":[[0,\"        \"],[1,[27,\"file-upload-file-selector\",null,[[\"multiple\"],[[23,[\"multiple\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"footer\"]]],null,{\"statements\":[[4,\"bs-button\",null,[[\"onClick\",\"type\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"close\"]]],null],\"default\",\"cancel-image-btn\"]],{\"statements\":[[0,\"      \"],[1,[27,\"t\",[\"Cancel\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"onClick\",\"type\",\"disabled\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"submit\"]]],null],\"primary\",[23,[\"notReadyToUpload\"]],\"submit-image-btn\"]],{\"statements\":[[0,\"      \"],[1,[27,\"t\",[\"file.Add\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/file-uploader.hbs" } });
});
;define("we-admin-hotel/templates/components/image-uploader-tr", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "H5uC/mT7", "block": "{\"symbols\":[],\"statements\":[[7,\"td\"],[11,\"class\",\"image-uploader-tr-thumbnail\"],[9],[0,\"\\n  \"],[1,[27,\"we-image\",null,[[\"file\",\"size\"],[[23,[\"image\"]],\"thumbnail\"]]],false],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"image-uploader-tr-description\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[9],[0,\"Descrição / alt:\"],[10],[0,\"\\n    \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"image\",\"description\"]],\"form-control\",\"2\"]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n\"],[4,\"bs-button\",null,[[\"onClick\",\"icon\",\"size\"],[[27,\"action\",[[22,0,[]],\"updateDescription\"],null],\"glyphicon glyphicon-edit\",\"xs\"]],{\"statements\":[[0,\"      Salvar\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"image-uploader-tr-actions\"],[9],[0,\"\\n  \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"removeImage\",[23,[\"image\"]]]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"image.remove\"],null],false],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/image-uploader-tr.hbs" } });
});
;define("we-admin-hotel/templates/components/image-uploader", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "M2lwbDRH", "block": "{\"symbols\":[\"modal\",\"footer\",\"tab\",\"item\",\"image\"],\"statements\":[[7,\"table\"],[11,\"class\",\"table table-bordered image-uploader-table\"],[9],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"value\"]]],null,{\"statements\":[[0,\"    \"],[1,[27,\"image-uploader-tr\",null,[[\"image\",\"removeImage\"],[[22,5,[]],\"removeImage\"]]],false],[0,\"\\n\"]],\"parameters\":[5]},null],[0,\"  \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"canAddMore\"]]],null,{\"statements\":[[0,\"    \"],[7,\"tfoot\"],[9],[0,\"\\n      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"td\"],[11,\"colspan\",\"3\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"openImageUploader\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"image.Add\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\\n\"],[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHidden\"],[[23,[\"uploadingImage\"]],[27,\"action\",[[22,0,[]],\"upload\"],null],[27,\"action\",[[22,0,[]],\"onHideUploadModal\"],null]]],{\"statements\":[[4,\"component\",[[22,1,[\"header\"]]],null,{\"statements\":[[0,\"    \"],[7,\"h4\"],[11,\"class\",\"modal-title\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-picture\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"image.selector\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[23,[\"error\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"alert alert-danger text-center\"],[11,\"role\",\"alert\"],[9],[1,[21,\"error\"],true],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"\\n\"],[4,\"bs-tab\",null,null,{\"statements\":[[4,\"component\",[[22,3,[\"pane\"]]],[[\"title\"],[\"Upload / enviar\"]],{\"statements\":[[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"image-selected-list\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"upload\",\"imagesToUpload\"]]],null,{\"statements\":[[0,\"              \"],[1,[27,\"file-upload-image-item\",null,[[\"item\"],[[22,4,[]]]]],false],[0,\"\\n\"]],\"parameters\":[4]},null],[0,\"          \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"canSelectMore\"]]],null,{\"statements\":[[0,\"            \"],[1,[27,\"file-upload-image-selector\",null,[[\"multiple\"],[[23,[\"multiple\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,3,[\"pane\"]]],[[\"title\"],[\"Selecionar imagem salva\"]],{\"statements\":[[0,\"          \"],[1,[27,\"we-images-to-select\",null,[[\"onSelectImage\"],[[27,\"action\",[[22,0,[]],\"onSelectSalvedImage\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"footer\"]]],null,{\"statements\":[[4,\"bs-button\",null,[[\"onClick\",\"type\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"close\"]]],null],\"default\",\"cancel-image-btn\"]],{\"statements\":[[0,\"      \"],[1,[27,\"t\",[\"Cancel\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"onClick\",\"type\",\"disabled\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"submit\"]]],null],\"primary\",[23,[\"upload\",\"notReadyToUpload\"]],\"submit-image-btn\"]],{\"statements\":[[0,\"      Salvar imagens e adicionar\\n\"]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/image-uploader.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-admin-link", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "FuYPO04G", "block": "{\"symbols\":[\"subLink\"],\"statements\":[[4,\"if\",[[23,[\"link\",\"links\"]]],null,{\"statements\":[[0,\"  \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[1,[23,[\"link\",\"icon\"]],true],[0,\" \"],[1,[23,[\"link\",\"text\"]],false],[7,\"span\"],[11,\"class\",\"fa arrow\"],[9],[10],[10],[0,\"\\n  \"],[7,\"ul\"],[11,\"class\",\"nav nav-second-level\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"link\",\"links\"]]],null,{\"statements\":[[0,\"      \"],[1,[27,\"menu-admin-link\",null,[[\"link\"],[[22,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[4,\"link-to\",[[23,[\"link\",\"linkTo\"]]],null,{\"statements\":[[1,[23,[\"link\",\"icon\"]],true],[0,\" \"],[1,[23,[\"link\",\"text\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-admin-link.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-admin", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GiXsJb8L", "block": "{\"symbols\":[\"link\"],\"statements\":[[4,\"each\",[[23,[\"links\"]]],null,{\"statements\":[[0,\"  \"],[1,[27,\"menu-admin-link\",null,[[\"link\"],[[22,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-admin.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-category-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "uvuVGsDs", "block": "{\"symbols\":[\"tab\",\"page\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"text\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar categoria*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma categoria\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"text\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar categorias existentes.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-category-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-custom-link-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2jvqjc/q", "block": "{\"symbols\":[],\"statements\":[[7,\"form\"],[11,\"class\",\"add-link-form-small\"],[3,\"action\",[[22,0,[]],\"addLink\",[23,[\"link\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"fieldset\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[0,\"URL:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"link\",\"href\"]],\"form-control\",\"http://...\",\"required\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[0,\"Texto do link:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"link\",\"text\"]],\"form-control\",\"required\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"submit\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-custom-link-form.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-hotel-event-structure-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3ZhFKMjt", "block": "{\"symbols\":[\"tab\",\"record\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"checkbox link-list-checkbox\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"listaChecked\",[23,[\"page\"]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Lista de estruturas\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar estrutura*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma estrutura\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar uma estrutura existente.\"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-hotel-event-structure-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-hotel-infrastructure-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lhCr95sO", "block": "{\"symbols\":[\"tab\",\"record\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"checkbox link-list-checkbox\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"listaChecked\",[23,[\"page\"]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Lista de infraestruturas\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar infraestrutura*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma infraestrutura\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar uma infraestrutura existente.\"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-hotel-infrastructure-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-hotel-rooms-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "NgSFumzp", "block": "{\"symbols\":[\"tab\",\"record\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"checkbox link-list-checkbox\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"listaChecked\",[23,[\"page\"]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Lista de quartos\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar quarto*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar um quarto\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar um quarto existente.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-hotel-rooms-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-links-sort-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "e6elgyon", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"m-list-group-item-label\"],[9],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"span\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-arrows\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[23,[\"link\",\"text\"]],false],[0,\"\\n      \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"ID: \"],[1,[23,[\"link\",\"id\"]],false]],\"parameters\":[]},null],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"menus.item.edit-link\",[23,[\"link\",\"menu\",\"id\"]],[23,[\"link\",\"id\"]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-primary\"],[9],[10],[0,\"\\n        \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar link [id:\"],[1,[23,[\"link\",\"id\"]],false],[0,\"]\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n      \"],[7,\"a\"],[12,\"href\",[28,[[23,[\"link\",\"href\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-share-alt\"],[9],[10],[0,\"\\n        \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Abrir o endereço do link\"]],\"parameters\":[]},null],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[3,\"action\",[[22,0,[]],\"deleteLink\",[23,[\"link\"]]]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n        \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar link [id:\"],[1,[23,[\"link\",\"id\"]],false],[0,\"]\"]],\"parameters\":[]},null],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n\"],[0,\"  \"],[10],[0,\"\\n\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"m-list-subitems\"],[9],[0,\"\\n  \"],[1,[27,\"menu-links-sort-list\",null,[[\"links\",\"group\",\"parentDepth\",\"onSortEnd\",\"deleteLink\"],[[23,[\"link\",\"links\"]],[23,[\"group\"]],[23,[\"parentDepth\"]],[23,[\"onSortEnd\"]],[23,[\"deleteLink\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-links-sort-item.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-links-sort-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cah+UfJ3", "block": "{\"symbols\":[\"link\"],\"statements\":[[4,\"each\",[[23,[\"links\"]]],null,{\"statements\":[[0,\"  \"],[1,[27,\"menu-links-sort-item\",null,[[\"link\",\"group\",\"parentDepth\",\"onSortEnd\",\"deleteLink\"],[[22,1,[]],[23,[\"group\"]],[23,[\"depth\"]],[23,[\"onSortEnd\"]],[23,[\"deleteLink\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-links-sort-list.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-news-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "C7rwSASB", "block": "{\"symbols\":[\"tab\",\"page\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"title\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"checkbox news-link-checkbox\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"listaChecked\",[23,[\"page\"]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Lista de notícias\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar Notícia*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma notícia\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"title\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar uma notícia existente.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-news-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-page-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Ff5LCsJR", "block": "{\"symbols\":[\"tab\",\"page\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"title\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar página*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma página\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"title\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar uma página existente.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-page-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-simple-events-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DrOLz0Py", "block": "{\"symbols\":[\"tab\",\"record\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"checkbox link-list-checkbox\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"listaChecked\",[23,[\"page\"]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Lista de eventos\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar evento*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar um evento\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar um evento existente.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-simple-events-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-tag-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Gv0KmYqR", "block": "{\"symbols\":[\"tab\",\"page\",\"page\"],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n    \"],[7,\"img\"],[11,\"class\",\"loading\"],[11,\"width\",\"30\"],[11,\"src\",\"loading.gif\"],[11,\"alt\",\"Carregando...\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Recentes\"]],{\"statements\":[[4,\"each\",[[23,[\"recentPages\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"\\n            \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,3,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,3,[\"text\"]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[22,1,[\"pane\"]]],[[\"title\"],[\"Buscar\"]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Selecionar tag*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"selectedPage\"]],\"Clique aqui para selecionar uma tag\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"          [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"text\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"Use o campo acima para selecionar tags existentes.\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"selectedPage\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPage\",[23,[\"selectedPage\"]]]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[0,\"\\n\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-tag-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/menu-user-links-selector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "MslX8PYe", "block": "{\"symbols\":[\"tab\",\"page\"],\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[4,\"each\",[[23,[\"options\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[0,\"\\n        \"],[7,\"input\"],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"pageChecked\",[22,2,[]]],[[\"on\"],[\"change\"]]],[9],[10],[0,\" \"],[1,[22,2,[\"text\"]],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[4,\"if\",[[23,[\"havePagesSelected\"]]],null,{\"statements\":[[0,\"    \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"addPages\"]],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"Adicionar ao menu\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/menu-user-links-selector.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-comment", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "7sdmHt1/", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"comments.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\" \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-comment.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-content-cuts", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "V9/dbrIy", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"content-cuts.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-content-cuts.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-content", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ck+TXckb", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"ENV\",\"API_HOST\"]],[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n\"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n\"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"link-to\",[\"contents.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Despublicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Publicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-content.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-d-form-answer", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hENKnBI6", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"d-form-answers.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-d-form-answer.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-d-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "kz5tywiZ", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"d-forms.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.unpublish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.publish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-d-form.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-data-importer-status", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "v7CZQZ+0", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[\"/content/\",[23,[\"record\",\"content\",\"id\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-data-importer-status.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-email-templates", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "QCVSnWce", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"email-templates.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\" \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-email-templates.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-hotel-cards", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hy6nXMcY", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"hotel-cards.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"a\"],[12,\"href\",[28,[[23,[\"ENV\",\"API_HOST\"]],\"/hotel-card/\",[23,[\"record\",\"id\"]],\"/print\"]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-print text-success\"],[9],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-hotel-cards.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-hotel-event-structures", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "A3RqkVOG", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"hotel-event-structures.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.unpublish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.publish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-hotel-event-structures.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-hotel-infrastructures", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "e2ix+0ww", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"hotel-infrastructures.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.unpublish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.publish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-hotel-infrastructures.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-hotel-rooms", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cNV8AgfS", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"hotel-rooms.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.unpublish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.publish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-hotel-rooms.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-menus", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2Y0lgffF", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"menus.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-menus.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-news", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Vv6sTp+S", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n\"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n\"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"link-to\",[\"news.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Despublicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Publicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-news.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-simple-events", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ipD8kiaL", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"link-to\",[\"simple-events.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.unpublish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"content.published.btn.publish\"],null],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"sr-only\"],[9],[0,\"Deletar\"],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-simple-events.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-site-contacts", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "tCf4rnwM", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"site-contacts.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"isClosed\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeStatus\",[23,[\"record\"]],\"opened\"]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Marcar como pendente\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeStatus\",[23,[\"record\"]],\"closed\"]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Resolver\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-site-contacts.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-sitecontact-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Ojdc0rye", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"site-contact-forms.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\" \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-sitecontact-form.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-slides", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "qrHYBf3O", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"slides.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Despublicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Publicar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-slides.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-url-alia", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yDehzCC3", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"url-alia.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Remover\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-url-alia.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-users", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ppJZkXHR", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n\"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n\"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"acl-can\",null,[[\"permission\",\"tagName\"],[\"manage_permissions\",\"span\"]],{\"statements\":[[4,\"link-to\",[\"users.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"link-to\",[\"users.item\",[23,[\"record\",\"id\"]],[27,\"query-params\",null,[[\"tab\"],[\"userTabPanePassword\"]]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-key text-danger\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Senha\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"link-to\",[\"users.item\",[23,[\"record\",\"id\"]],[27,\"query-params\",null,[[\"tab\"],[\"userTabPaneRoles\"]]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-id-card-o text-default\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n    \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Perfis\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-users.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-vocabulary-terms", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xlQkqwGN", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"ENV\",\"API_HOST\"]],[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n\"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n\"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"link-to\",[\"vocabulary.item.terms.item\",[23,[\"record\",\"vocabulary\",\"id\"]],[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-vocabulary-terms.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-actions-vocabulary", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zjUkYMJj", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"vocabulary.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Editar\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"link-to\",[\"vocabulary.item.terms\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[1,[27,\"t\",[\"term.find\"],null],false],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[1,[27,\"t\",[\"term.find\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-actions-vocabulary.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-comment-body", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LbDEunYc", "block": "{\"symbols\":[],\"statements\":[[1,[23,[\"record\",\"teaser\"]],true],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-comment-body.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-comment-in-repply-to", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jPe50+ya", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"ENV\",\"API_HOST\"]],\"/\",[23,[\"record\",\"modelName\"]],\"/\",[23,[\"record\",\"modelId\"]]]]],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"target\",\"_blank\"],[9],[0,\"Ver\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-comment-in-repply-to.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-creator", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "EjgbEph6", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"record\",\"creator\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[4,\"link-to\",[\"users.item\",[23,[\"record\",\"creator\",\"id\"]]],null,{\"statements\":[[7,\"img\"],[12,\"src\",[28,[[23,[\"ENV\",\"API_HOST\"]],\"/avatar/\",[23,[\"record\",\"creator\",\"id\"]]]]],[12,\"alt\",[28,[\"Avatar do \",[23,[\"record\",\"creator\",\"displayName\"]]]]],[11,\"class\",\"user-avatar-in-table\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n  \"],[7,\"strong\"],[9],[1,[23,[\"record\",\"creator\",\"displayName\"]],false],[10],[0,\"\\n  \"],[7,\"a\"],[12,\"href\",[28,[\"mailto:\",[23,[\"record\",\"creator\",\"email\"]]]]],[9],[1,[23,[\"record\",\"creator\",\"email\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"strong\"],[9],[0,\"Anônimo\"],[10]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-creator.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-highlighted", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "C2YYDaig", "block": "{\"symbols\":[],\"statements\":[[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"increaseHighlighted\",[23,[\"record\"]]]],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-up text-success\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Aumentar a prioridade de exibição\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n  \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[4,\"if\",[[23,[\"record\",\"highlighted\"]]],null,{\"statements\":[[1,[23,[\"record\",\"highlighted\"]],false]],\"parameters\":[]},{\"statements\":[[0,\"0\"]],\"parameters\":[]}],[10],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[12,\"disabled\",[21,\"cantDecrease\"]],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"decreaseHighlighted\",[23,[\"record\"]]]],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-down text-danger\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Diminuir a prioridade de exibição\"]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-highlighted.hbs" } });
});
;define("we-admin-hotel/templates/components/mt-list-item-created-at", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xqNc5glG", "block": "{\"symbols\":[],\"statements\":[[1,[27,\"moment-format\",[[23,[\"record\",\"createdAt\"]],[23,[\"settings\",\"dateFormat\"]]],null],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/mt-list-item-created-at.hbs" } });
});
;define("we-admin-hotel/templates/components/role-permission-check", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "JaAjgsMe", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"fa fa-spinner\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[23,[\"can\"]]],null,{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-check-square-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-square-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/role-permission-check.hbs" } });
});
;define("we-admin-hotel/templates/components/settings-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8QvBwhnI", "block": "{\"symbols\":[\"link\"],\"statements\":[[4,\"if\",[[23,[\"ENV\",\"settingsMenu\",\"links\"]]],null,{\"statements\":[[7,\"div\"],[11,\"class\",\"settings-submenu\"],[9],[0,\"\\n  \"],[7,\"ul\"],[11,\"class\",\"nav nav-pills\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"ENV\",\"settingsMenu\",\"links\"]]],null,{\"statements\":[[4,\"active-link\",null,[[\"role\"],[\"presentation\"]],{\"statements\":[[0,\"        \"],[4,\"link-to\",[[22,1,[\"linkTo\"]]],null,{\"statements\":[[0,\" \"],[1,[22,1,[\"icon\"]],true],[0,\" \"],[1,[22,1,[\"text\"]],true],[0,\" \"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/settings-menu.hbs" } });
});
;define("we-admin-hotel/templates/components/simple-events", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "SSE5fwRK", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/simple-events.hbs" } });
});
;define("we-admin-hotel/templates/components/theme-color-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "wthX06Md", "block": "{\"symbols\":[],\"statements\":[[0,\"    \"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/theme-color-item.hbs" } });
});
;define("we-admin-hotel/templates/components/user-role-checkbox", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "sN54ffeF", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"isLoading\"]]],null,{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"fa fa-spinner\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[23,[\"have\"]]],null,{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-check-square-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-square-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/user-role-checkbox.hbs" } });
});
;define("we-admin-hotel/templates/components/we-datepicker", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "w7Eavg5w", "block": "{\"symbols\":[\"&default\"],\"statements\":[[14,1],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/we-datepicker.hbs" } });
});
;define("we-admin-hotel/templates/components/we-image", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "iiSePdMu", "block": "{\"symbols\":[\"&default\"],\"statements\":[[14,1],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/we-image.hbs" } });
});
;define("we-admin-hotel/templates/components/we-images-to-select", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "a07Z37V5", "block": "{\"symbols\":[\"image\"],\"statements\":[[4,\"each\",[[23,[\"images\"]]],null,{\"statements\":[[0,\"  \"],[1,[27,\"we-image\",null,[[\"file\",\"size\",\"class\",\"click\"],[[22,1,[]],\"medium\",\"img-thumbnail image-to-select\",[27,\"action\",[[22,0,[]],\"onSelectImage\",[22,1,[]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[1]},{\"statements\":[[0,\"  Sem imagens para seleção.\\n\"]],\"parameters\":[]}]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/we-images-to-select.hbs" } });
});
;define("we-admin-hotel/templates/components/we-page-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3RgX5UT8", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"page\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar página \\\"\"],[1,[23,[\"page\",\"title\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Criar página\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"savePage\",[23,[\"page\"]],[23,[\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-title\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"page\",\"title\"]],\"form-control\",[27,\"t\",[\"form-placeholder-content-title\"],null],\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-about\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\"],[[23,[\"page\",\"about\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-body\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"tinymce-editor\",null,[[\"options\",\"value\"],[[23,[\"editorOptions\"]],[23,[\"page\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Images\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"page\",\"featuredImage\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"page\",\"images\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Attachment\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-attachment\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"file-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"page\",\"attachment\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"showActionBar\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n            \"],[1,[27,\"t\",[\"content.Save\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"contents.index\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n            \"],[1,[27,\"t\",[\"content.find\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"page\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"page\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"page\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"page\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"page\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Dates\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"page\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"page\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"page\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"page\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL/caminho de acesso à página, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/components/we-page-form.hbs" } });
});
;define("we-admin-hotel/templates/contents", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "I2PDM8qy", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/contents.hbs" } });
});
;define("we-admin-hotel/templates/contents/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "RsAyIpza", "block": "{\"symbols\":[],\"statements\":[[15,\"contents/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/contents/create.hbs" } });
});
;define("we-admin-hotel/templates/contents/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6c8W7cQA", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"content.edit\"],[[\"title\"],[[23,[\"model\",\"record\",\"title\"]]]]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"content.create\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-title\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"title\"]],\"form-control\",[27,\"t\",[\"form-placeholder-content-title\"],null],\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-about\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\"],[[23,[\"model\",\"record\",\"about\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-body\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Images\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Attachment\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-attachment\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"file-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"attachment\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n\"],[0,\"            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Dates\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL/caminho de acesso à página, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"content.Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"contents.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"content.find\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/contents/form.hbs" } });
});
;define("we-admin-hotel/templates/contents/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/ZpUdU8n", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"content.find\"],null],false],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"content\",\"/contents/create\"]],{\"statements\":[[1,[27,\"t\",[\"content.create\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/contents/index.hbs" } });
});
;define("we-admin-hotel/templates/contents/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Z1A5Bsqd", "block": "{\"symbols\":[],\"statements\":[[15,\"contents/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/contents/item.hbs" } });
});
;define("we-admin-hotel/templates/contents/list-item-actions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xQf8NRyj", "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[28,[[23,[\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"blank\"],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"link-to\",[\"contents.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"record\",\"published\"]]],null,{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],false]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changePublishedStatus\",[23,[\"record\"]],true]],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/contents/list-item-actions.hbs" } });
});
;define("we-admin-hotel/templates/d-form-answers", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "iJcZFZUM", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-form-answers.hbs" } });
});
;define("we-admin-hotel/templates/d-forms", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "m1MvXN76", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "85OyKLr2", "block": "{\"symbols\":[],\"statements\":[[15,\"d-forms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/create.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "fdCiWrF2", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Criar formulário\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome do formulário*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"name\",[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Um nome simples e único para o formulário.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Título do formulário:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"title\",[23,[\"model\",\"record\",\"title\"]],\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Título que aparece para o usuário acima do formulário.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\"],[0,\"            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Assunto (subject):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"subject\",[23,[\"model\",\"record\",\"subject\"]],\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Assunto do email.\"],[7,\"br\"],[9],[10],[0,\"Deixe o campo vazio para usar o assunto padrão definido nos templates de email.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"E-mail de envio (to):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"type\",\"name\",\"value\",\"class\"],[\"email\",\"to\",[23,[\"model\",\"record\",\"to\"]],\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"E-mails separados por vírgula para onde os dados serão enviados.\\n                \"],[7,\"br\"],[9],[10],[0,\"Exemplo: Linky Systems <contato@linkysystems.com>\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"URL de sucesso:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"type\",\"name\",\"value\",\"class\"],[\"text\",\"redirectToOnSuccess\",[23,[\"model\",\"record\",\"redirectToOnSuccess\"]],\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL para onde o usuário será redirecionado após preencher e enviar o formuário.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-globe\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-random\"],[9],[10],[0,\" URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"d-forms.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Formulários\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/form.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yx/gSE4v", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Formulários\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"d-forms.create\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus text-success\"],[9],[10],[0,\" Criar formulário\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/index.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "s00w6h6Y", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item/answers/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "smF4DOt1", "block": "{\"symbols\":[\"answer\",\"field\",\"index\",\"field\",\"index\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Respostas do formulário \\\"\"],[1,[23,[\"model\",\"form\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Campos\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.edit\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Editar formulário\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.use\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Usar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Respostas\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[7,\"a\"],[12,\"href\",[28,[[23,[\"model\",\"ENV\",\"API_HOST\"]],\"/d-form-answer-export.csv?formId=\",[23,[\"model\",\"form\",\"id\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"download\",\"\"],[9],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-download-alt\\n\"],[9],[10],[0,\" Exportar todos os dados\"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O arquivo da exportação tem o formato de CSV com dados separados por vírgula.\"],[10],[0,\"\\n\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"table-responsive\"],[9],[0,\"\\n  \"],[7,\"table\"],[11,\"class\",\"table table-striped table-bordered table-condensed\"],[9],[0,\"\\n    \"],[7,\"thead\"],[9],[0,\"\\n      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"ID\"],[10],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"fields\"]]],null,{\"statements\":[[4,\"if\",[[27,\"lt\",[[22,5,[]],5],null]],null,{\"statements\":[[4,\"unless\",[[22,4,[\"informationField\"]]],null,{\"statements\":[[0,\"              \"],[7,\"th\"],[9],[1,[22,4,[\"label\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[4,5]},null],[0,\"        \"],[7,\"th\"],[9],[0,\"Ações\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"records\"]]],null,{\"statements\":[[0,\"        \"],[7,\"tr\"],[9],[0,\"\\n          \"],[7,\"td\"],[9],[1,[22,1,[\"id\"]],false],[10],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"fields\"]]],null,{\"statements\":[[4,\"if\",[[27,\"lt\",[[22,3,[]],5],null]],null,{\"statements\":[[4,\"unless\",[[22,2,[\"informationField\"]]],null,{\"statements\":[[0,\"                \"],[7,\"td\"],[9],[0,\"\\n                  \"],[1,[27,\"get\",[[22,1,[\"vCacheByFieldId\"]],[22,2,[\"id\"]]],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[2,3]},null],[0,\"\\n          \"],[7,\"td\"],[9],[4,\"link-to\",[\"d-forms.item.answers.item\",[23,[\"model\",\"form\",\"id\"]],[22,1,[\"id\"]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"p\"],[9],[0,\"Essa lista exibe no máximo 25 items, use o botão de exportação para baixar a lista completa.\"],[10],[0,\"\\n\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item/answers/index.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item/answers/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hJLaybJe", "block": "{\"symbols\":[\"field\",\"index\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Resposta #\\\"\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Campos\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.edit\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Editar formulário\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.use\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Usar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers\",[23,[\"model\",\"form\",\"id\"]]],null,{\"statements\":[[0,\"Respostas\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers.item\",[23,[\"model\",\"form\",\"id\"]],[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Resposta #\\\"\"],[1,[23,[\"model\",\"record\",\"id\"]],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n  \"],[7,\"table\"],[11,\"class\",\"table table-striped\"],[9],[0,\"\\n    \"],[7,\"thead\"],[9],[0,\"\\n      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Campo\"],[10],[0,\"\\n        \"],[7,\"th\"],[9],[0,\"Valor\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"fields\"]]],null,{\"statements\":[[4,\"unless\",[[22,1,[\"informationField\"]]],null,{\"statements\":[[0,\"          \"],[7,\"tr\"],[9],[0,\"\\n            \"],[7,\"th\"],[11,\"width\",\"150\"],[9],[1,[27,\"truncate\",[[22,1,[\"label\"]]],null],false],[0,\":\"],[10],[0,\"\\n            \"],[7,\"td\"],[9],[1,[27,\"get\",[[23,[\"model\",\"record\",\"vCacheByFieldId\"]],[22,1,[\"id\"]]],null],false],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1,2]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item/answers/item.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item/edit", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "OTMfLum1", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar formulário \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Campos\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.edit\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Editar formulário\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.use\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Usar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Respostas\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n  \"],[15,\"d-forms/form\",[]],[0,\"\\n\"],[10]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item/edit.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "j6oTLRIS", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Campos do formulário \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Campos\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.edit\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Editar formulário\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.use\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Usar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Respostas\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row d-f-sidebar\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"h4\"],[9],[0,\"Campos disponíveis\"],[10],[0,\"\\n      \"],[7,\"p\"],[9],[0,\"Clique para adicionar no formulário\"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"row d-f-add-field-buttons\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"title\"]],[9],[0,\"Subtítulo\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"description\"]],[9],[0,\"Descrição\"],[10],[0,\"\\n        \"],[10],[0,\"\\n\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"text\"]],[9],[0,\"Texto\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"number\"]],[9],[0,\"Número\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"textarea\"]],[9],[0,\"Texto longo\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"date\"]],[9],[0,\"Data\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"email\"]],[9],[0,\"E-mail\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"url\"]],[9],[0,\"URL\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-block\"],[3,\"action\",[[22,0,[]],\"addItem\",\"select\"]],[9],[0,\"Opções / seleção\"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8 d-form-builder-fields\"],[9],[0,\"\\n      \"],[1,[27,\"d-form-fields-sort-list\",null,[[\"fields\",\"onSortEnd\"],[[23,[\"model\",\"record\",\"fields\"]],\"onSortEnd\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"d-f-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"saveForm\",[23,[\"model\",\"record\"]]]],[9],[0,\"Salvar formulário\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item/index.hbs" } });
});
;define("we-admin-hotel/templates/d-forms/item/use", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "81AT7LAX", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Usar / Formas de adicionar o formulário nas páginas\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Campos\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.edit\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Editar formulário\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.use\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Usar\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n    \"],[4,\"link-to\",[\"d-forms.item.answers\",[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"Respostas\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"h4\"],[9],[0,\"Acessar o formulário em um Link direto:\"],[10],[0,\"\\n    \"],[7,\"p\"],[9],[0,\"Link: \"],[7,\"a\"],[12,\"href\",[28,[[23,[\"model\",\"ENV\",\"API_HOST\"]],[23,[\"model\",\"record\",\"linkPermanent\"]]]]],[11,\"target\",\"_blank\"],[9],[1,[23,[\"model\",\"ENV\",\"API_HOST\"]],false],[1,[23,[\"model\",\"record\",\"linkPermanent\"]],false],[10],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"hr\"],[9],[10],[0,\"\\n    \"],[7,\"h4\"],[9],[0,\"Adicionar em um campo com editor HTML\"],[10],[0,\"\\n    \"],[7,\"p\"],[9],[0,\"Clique no botão \\\"Inserir media\\\" do editor e use o link: \"],[7,\"code\"],[9],[1,[23,[\"model\",\"ENV\",\"API_HOST\"]],false],[1,[23,[\"model\",\"record\",\"linkPermanent\"]],false],[0,\"?iframe=true\"],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"Para uma melhor visualização recomendamos que use o \\\"width/largura\\\" com valor 100% e \\\"height/altura\\\" com valor 700 ou maior\\n    \"],[10],[0,\"\\n  \"],[7,\"hr\"],[9],[10],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"h4\"],[9],[0,\"Adicionar em um sistema externo usando iframe (Adicionar no texto de uma página)\"],[10],[0,\"\\n    \"],[7,\"p\"],[9],[0,\"Copie e cole o código abaixo na página:\"],[10],[0,\"\\n    \"],[7,\"pre\"],[9],[0,\"<iframe width=\\\"100%\\\" height=\\\"700\\\" frameborder=\\\"0\\\" style=\\\"border:0;\\\" scrolling=\\\"no\\\" marginheight=\\\"0\\\" marginwidth=\\\"0\\\" src=\\\"\"],[1,[23,[\"model\",\"ENV\",\"API_HOST\"]],false],[1,[23,[\"model\",\"record\",\"linkPermanent\"]],false],[0,\"?iframe=true\\\"></iframe>\"],[10],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/d-forms/item/use.hbs" } });
});
;define("we-admin-hotel/templates/email-templates", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hdUmLe3r", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/email-templates.hbs" } });
});
;define("we-admin-hotel/templates/email-templates/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "dj8LCpQT", "block": "{\"symbols\":[],\"statements\":[[15,\"email-templates/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/email-templates/create.hbs" } });
});
;define("we-admin-hotel/templates/email-templates/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hORmfDfg", "block": "{\"symbols\":[\"tv\",\"id\",\"opts\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar template #\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Adicionar template\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Tipo de email: \"],[1,[23,[\"model\",\"selectedEmailType\",\"label\"]],false],[0,\" (\"],[1,[23,[\"model\",\"record\",\"type\"]],false],[0,\")\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[23,[\"model\",\"allowChangeType\"]]],null,{\"statements\":[[0,\"          \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Tipo de email\"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"onchange\"],[[23,[\"model\",\"emailTypes\"]],[23,[\"model\",\"selectedEmailType\"]],false,[27,\"action\",[[22,0,[]],\"selectEmailType\",[23,[\"model\",\"record\"]]],null]]],{\"statements\":[[0,\"                \"],[1,[22,3,[\"label\"]],false],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Adicionar template para o tipo de email: \"],[7,\"strong\"],[9],[1,[23,[\"model\",\"selectedEmailType\",\"label\"]],false],[0,\" (\"],[1,[23,[\"model\",\"record\",\"type\"]],false],[0,\")\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"selectedEmailType\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Dados\\n            \"],[7,\"span\"],[11,\"class\",\"pull-right\"],[9],[7,\"button\"],[11,\"class\",\"btn btn-default btn-xs\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"resetDefaultValues\",[23,[\"model\",\"record\"]],[23,[\"model\",\"selectedEmailType\"]]]],[9],[0,\"Resetar padrão\"],[10],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            \"],[7,\"fieldset\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                \"],[7,\"label\"],[9],[0,\"Assunto*:\"],[10],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"record\",\"subject\"]],\"form-control\",\"required\"]]],false],[0,\"\\n                \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Assunto do email que será enviado. Suporte para os textos dinâmicos.\"],[10],[0,\"\\n              \"],[10],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                \"],[7,\"label\"],[9],[0,\"HTML:\"],[10],[0,\"\\n                \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"html\"]]]]],false],[0,\"\\n                \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto com formatação que é exibido para o usuário na maioria dos leitores de email.\\n                  \"],[7,\"br\"],[9],[10],[0,\"Alguns tipos de formatação podem ser ignorados por leitores de email.\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                \"],[7,\"label\"],[9],[0,\"Texto:\"],[10],[0,\"\\n                \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"model\",\"record\",\"text\"]],\"form-control\",\"6\"]]],false],[0,\"\\n                \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto sem formatação que é exibido para o usuário em alguns leitores de email que não suportam formatação.\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            Selecione um tipo de email no campo acima para editar o texto do template do email.\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"selectedEmailType\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Variáveis / Textos dinâmicos\"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            \"],[7,\"table\"],[11,\"class\",\"table table-striped\"],[9],[0,\"\\n              \"],[7,\"thead\"],[9],[0,\"\\n                \"],[7,\"tr\"],[9],[0,\"\\n                  \"],[7,\"th\"],[9],[0,\"Variável\"],[10],[0,\"\\n                  \"],[7,\"th\"],[9],[0,\"Descrição\"],[10],[0,\"\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n              \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[27,\"-each-in\",[[23,[\"model\",\"selectedEmailType\",\"templateVariables\"]]],null]],null,{\"statements\":[[0,\"                  \"],[7,\"tr\"],[9],[0,\"\\n                    \"],[7,\"td\"],[9],[0,\"{{\"],[1,[22,2,[]],false],[0,\"}}\"],[10],[0,\"\\n                    \"],[7,\"td\"],[9],[1,[22,1,[\"description\"]],false],[10],[0,\"\\n                  \"],[10],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"type\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n            \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[11,\"disabled\",\"\"],[11,\"type\",\"button\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n            \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"email-templates.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Voltar para lista\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/email-templates/form.hbs" } });
});
;define("we-admin-hotel/templates/email-templates/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xM0iS/4c", "block": "{\"symbols\":[\"et\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Templates de email\"],[10],[0,\"\\n\\n\"],[7,\"table\"],[11,\"class\",\"table table-striped table-bordered table-condensed\"],[9],[0,\"\\n  \"],[7,\"thead\"],[9],[0,\"\\n    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"Identificador\"],[10],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"Label\"],[10],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"Ações\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"emailTypes\"]]],null,{\"statements\":[[0,\"      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"td\"],[9],[1,[22,1,[\"id\"]],false],[10],[0,\"\\n        \"],[7,\"td\"],[9],[1,[22,1,[\"label\"]],false],[10],[0,\"\\n        \"],[7,\"td\"],[9],[0,\"\\n\"],[4,\"if\",[[22,1,[\"emailTemplate\",\"id\"]]],null,{\"statements\":[[4,\"link-to\",[\"email-templates.item\",[22,1,[\"emailTemplate\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"              \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\" Editar template\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"link-to\",[\"email-templates.create\",[27,\"query-params\",null,[[\"type\"],[[22,1,[\"id\"]]]]]],[[\"class\"],[\"btn btn-primary btn-sm\"]],{\"statements\":[[0,\"              \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" Adicionar template\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},{\"statements\":[[0,\"\\n\"]],\"parameters\":[]}],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/email-templates/index.hbs" } });
});
;define("we-admin-hotel/templates/email-templates/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lniQ8T9n", "block": "{\"symbols\":[],\"statements\":[[15,\"email-templates/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/email-templates/item.hbs" } });
});
;define("we-admin-hotel/templates/forgot-password", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZWSxBuus", "block": "{\"symbols\":[],\"statements\":[[7,\"br\"],[9],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"isLoading\"]]],null,{\"statements\":[[0,\"    \"],[1,[21,\"bootstrap-loading\"],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"panel panel-primary\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n        \"],[7,\"h1\"],[11,\"class\",\"panel-title\"],[9],[1,[27,\"t\",[\"auth.forgot-password\"],null],false],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        \"],[7,\"form\"],[11,\"class\",\"form\"],[3,\"action\",[[22,0,[]],\"requestPasswordChange\"],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"input-group input-group-lg\"],[9],[0,\"\\n\\n              \"],[7,\"label\"],[11,\"class\",\"input-group-addon\"],[9],[1,[27,\"t\",[\"form-forgot-password-email\"],null],false],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"type\",\"placeholder\",\"value\",\"required\",\"autofocus\",\"class\"],[\"email\",[27,\"t\",[\"form-placeholder-forgot-password-email\"],null],[23,[\"model\",\"email\"]],\"required\",\"true\",\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"btn btn-lg btn-primary\"],[11,\"type\",\"submit\"],[9],[1,[27,\"t\",[\"form-forgot-password-submit\"],null],false],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-footer text-right\"],[9],[0,\"\\n\\n        \"],[7,\"div\"],[11,\"class\",\"login-form-links\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"login\"],null,{\"statements\":[[0,\"            \"],[1,[27,\"t\",[\"Login\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[10],[0,\"\\n\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n\"]],\"parameters\":[]}],[10],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/forgot-password.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6iVszgXu", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards/conditions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "flow3Ihz", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar condições\"],[10],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"saveConditions\",[23,[\"model\",\"systemSettings\",\"hotelCardConditions\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n    \"],[7,\"label\"],[9],[0,\"Condições de hospedagem*:\"],[10],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Condições que são exibidas no formulário de Web Check-in\"],[10],[0,\"\\n    \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"systemSettings\",\"hotelCardConditions\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n      Salvar\\n    \"],[10],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"hotel-cards.index\"]],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n      Fichas\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards/conditions.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Ul7sp8Vk", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-cards/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards/create.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "j6V+df4v", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar ficha \\\"\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Preencher ficha\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome completo*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"fullName\",[23,[\"model\",\"record\",\"fullName\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Data de nascimento*:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"birthdate\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"birthdate\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ocupationJob\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ocupationJob\",[23,[\"model\",\"record\",\"ocupationJob\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          Documento de identidade\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-travelDocument\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"travelDocument\",[23,[\"model\",\"record\",\"travelDocument\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-type\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"type\",[23,[\"model\",\"record\",\"type\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Exemplos: Identidade, CNH, etc ...\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-issuingCountry\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"issuingCountry\",[23,[\"model\",\"record\",\"issuingCountry\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Exemplos: Identidade, CNH, etc ...\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Residência permanente\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-homeAddress\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"homeAddress\",[23,[\"model\",\"record\",\"homeAddress\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-zipCode\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"zipCode\",[23,[\"model\",\"record\",\"zipCode\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-city\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"city\",[23,[\"model\",\"record\",\"city\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-state\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"state\",[23,[\"model\",\"record\",\"state\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-country\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"country\",[23,[\"model\",\"record\",\"country\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Informações comerciais\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciCompany\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciCompany\",[23,[\"model\",\"record\",\"ciCompany\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciOcupation\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciOcupation\",[23,[\"model\",\"record\",\"ciOcupation\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciAddress\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciAddress\",[23,[\"model\",\"record\",\"ciAddress\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciZipCode\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciZipCode\",[23,[\"model\",\"record\",\"ciZipCode\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciCity\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciCity\",[23,[\"model\",\"record\",\"ciCity\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciState\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciState\",[23,[\"model\",\"record\",\"ciState\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciCountry\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciCountry\",[23,[\"model\",\"record\",\"ciCountry\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-hotel-card-ciPhoneNumber\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\"],[\"ciPhoneNumber\",[23,[\"model\",\"record\",\"ciPhoneNumber\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Sexo:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"onchange\"],[[23,[\"model\",\"genderOptions\"]],[23,[\"model\",\"record\",\"gender\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"gender\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"name\",\"type\",\"checked\"],[\"ciSmoke\",\"checkbox\",[23,[\"model\",\"record\",\"ciSmoke\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-hotel-card-ciSmoke\"],null],false],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"content.Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"hotel-cards.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Fichas\\n        \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"          \"],[7,\"a\"],[12,\"href\",[28,[\"/hotel-card/\",[23,[\"model\",\"record\",\"id\"]],\"/print\"]]],[11,\"class\",\"btn btn-default\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-print text-success\"],[9],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards/form.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "9ncAldl+", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Fichas de registro\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"hotel-card\",\"/hotel-cards/create\"]],{\"statements\":[[0,\"Preencher ficha\"]],\"parameters\":[]},null],[0,\"\\n\\n\"],[4,\"link-to\",[\"hotel-cards.conditions\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    Editar condições\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"deleteRecord\",\"print\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,\"deleteRecord\",\"print\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards/index.hbs" } });
});
;define("we-admin-hotel/templates/hotel-cards/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XVc4fRRs", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-cards/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-cards/item.hbs" } });
});
;define("we-admin-hotel/templates/hotel-event-structures", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "otGC+atU", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-event-structures.hbs" } });
});
;define("we-admin-hotel/templates/hotel-event-structures/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "d+Nve0m7", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-event-structures/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-event-structures/create.hbs" } });
});
;define("we-admin-hotel/templates/hotel-event-structures/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "RUjPdoq0", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar estrutura para eventos \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Cadastrar estrutura para eventos\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"name\",[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Nome a estrutura.\"],[7,\"br\"],[9],[10],[0,\"Exemplo: Salão de festas.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Sobre:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto pequeno que descreva a estrutura com no máximo 200 letras. Esse texto aparece nas listas.\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"about\",[23,[\"model\",\"record\",\"about\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Dados da estrutura:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descreva a estrutura com o máximo de informações. Esse texto aparece na página de informações da estrutura.\"],[10],[0,\"\\n              \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-picture-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Imagens\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem de no mínimo 900x400px que pode ser quadrada ou com a largura maior que a altura.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem qualquer tamanho, o sistema realiza o redimencionamento da imagem.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-tags\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-globe\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Datas\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-random\"],[9],[10],[0,\" URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"hotel-event-structures.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Lista de estruturas\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-event-structures/form.hbs" } });
});
;define("we-admin-hotel/templates/hotel-event-structures/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ILTg/yE6", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Estruturas para eventos\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"hotel-event-structure\",\"/hotel-event-structures/create\"]],{\"statements\":[[0,\"Cadastrar estrutura\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-event-structures/index.hbs" } });
});
;define("we-admin-hotel/templates/hotel-event-structures/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hAtCDy3r", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-event-structures/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-event-structures/item.hbs" } });
});
;define("we-admin-hotel/templates/hotel-infrastructures", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "B0dt80lE", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-infrastructures.hbs" } });
});
;define("we-admin-hotel/templates/hotel-infrastructures/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DF2P67HC", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-infrastructures/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-infrastructures/create.hbs" } });
});
;define("we-admin-hotel/templates/hotel-infrastructures/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "KYuve04i", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar infraestrutura de apoio \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Cadastrar infraestrutura de apoio\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"name\",[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Nome da infraestrutura de apoio.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Sobre:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto pequeno que descreva a infraestrutura com no máximo 200 letras. Esse texto aparece nas listas.\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"about\",[23,[\"model\",\"record\",\"about\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Dados da estrutura:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descreva a estrutura com o máximo de informações. Esse texto aparece na página de informações da estrutura.\"],[10],[0,\"\\n              \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-picture-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Imagens\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem de no mínimo 900x400px que pode ser quadrada ou com a largura maior que a altura.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem qualquer tamanho, o sistema realiza o redimencionamento da imagem.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"hotel-infrastructures.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Lista de infraestruturas\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-tags\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n\"],[0,\"            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-globe\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Datas\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-random\"],[9],[10],[0,\" URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-infrastructures/form.hbs" } });
});
;define("we-admin-hotel/templates/hotel-infrastructures/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ufngob8k", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Infraestruturas de apoio\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"hotel-event-structure\",\"/hotel-infrastructures/create\"]],{\"statements\":[[0,\"Cadastrar infraestrutura\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-infrastructures/index.hbs" } });
});
;define("we-admin-hotel/templates/hotel-infrastructures/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "G0hEcM4c", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-infrastructures/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-infrastructures/item.hbs" } });
});
;define("we-admin-hotel/templates/hotel-rooms", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DWOx2C2P", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-rooms.hbs" } });
});
;define("we-admin-hotel/templates/hotel-rooms/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3OGGf4r1", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-rooms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-rooms/create.hbs" } });
});
;define("we-admin-hotel/templates/hotel-rooms/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Moe5SPY5", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar quarto \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Cadastrar quarto\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"name\",[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Nome do quarto ou do tipo de quarto, por exemplo: \\\"Quarto Luxo\\\" ou \\\"Quarto Standart\\\".\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Sobre:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto pequeno que descreva o quarto com no máximo 200 letras. Esse texto aparece nas listas.\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"about\",[23,[\"model\",\"record\",\"about\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Dados do quarto:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descreva o quarto com o máximo de informações. Esse texto aparece na página de informações do quarto.\"],[10],[0,\"\\n              \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-picture-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Imagens\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem de no mínimo 900x400px que pode ser quadrada ou com a largura maior que a altura.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem qualquer tamanho, o sistema realiza o redimencionamento da imagem.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-tags\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-globe\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n\\n            \"],[7,\"hr\"],[9],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"showInLists\"]]]]],false],[0,\" Exibir nas listas?\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-comment\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Comentários\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"name\",\"type\",\"checked\"],[\"allowComments\",\"checkbox\",[23,[\"model\",\"record\",\"allowComments\"]]]]],false],[0,\" Permitir comentários?\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Datas\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-random\"],[9],[10],[0,\" URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"content.Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"hotel-rooms.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Quartos\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-rooms/form.hbs" } });
});
;define("we-admin-hotel/templates/hotel-rooms/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "U3eOmU5/", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Quartos\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"hotel-room\",\"/hotel-rooms/create\"]],{\"statements\":[[0,\"Cadastrar quarto\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-rooms/index.hbs" } });
});
;define("we-admin-hotel/templates/hotel-rooms/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "doDeDc5z", "block": "{\"symbols\":[],\"statements\":[[15,\"hotel-rooms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/hotel-rooms/item.hbs" } });
});
;define("we-admin-hotel/templates/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+fKa5ldQ", "block": "{\"symbols\":[\"user\",\"content\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-lg-12\"],[9],[0,\"\\n    \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"admin.Dashboard\"],null],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\"],[4,\"acl-can\",[\"update_user\"],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"col-lg-3 col-md-6\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"panel panel-primary\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-3\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-users fa-5x\"],[9],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-9 text-right\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"huge\"],[9],[1,[23,[\"model\",\"newUsers\",\"meta\",\"count\"]],false],[10],[0,\"\\n            \"],[7,\"div\"],[9],[1,[27,\"t\",[\"user.find\"],null],false],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"],[4,\"link-to\",[\"users.index\"],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel-footer\"],[9],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"pull-left\"],[9],[1,[27,\"t\",[\"admin.dashboard.view.all\"],null],false],[10],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"pull-right\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-circle-right\"],[9],[10],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"clearfix\"],[9],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"acl-can\",[\"create_news\"],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"col-lg-3 col-md-6\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"panel panel-yellow\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-3\"],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-file-text fa-5x\"],[9],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-9 text-right\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"huge\"],[9],[1,[23,[\"model\",\"contentCount\"]],false],[10],[0,\"\\n            \"],[7,\"div\"],[9],[1,[27,\"t\",[\"content.find\"],null],false],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"],[4,\"link-to\",[\"contents.index\"],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel-footer\"],[9],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"pull-left\"],[9],[1,[27,\"t\",[\"admin.dashboard.view.all\"],null],false],[10],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"pull-right\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-circle-right\"],[9],[10],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"clearfix\"],[9],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-lg-8\"],[9],[0,\"\\n\"],[4,\"acl-can\",[\"create_news\"],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-file-text\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"admin.dashboard.content.unpublished\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-lg-12\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"table-responsive\"],[9],[0,\"\\n              \"],[7,\"table\"],[11,\"class\",\"table table-bordered table-hover table-striped\"],[9],[0,\"\\n                \"],[7,\"thead\"],[9],[0,\"\\n                    \"],[7,\"tr\"],[9],[0,\"\\n                        \"],[7,\"th\"],[9],[0,\"#\"],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-content-title\"],null],false],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-content-createdAt\"],null],false],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-content-updatedAt\"],null],false],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"Actions\"],null],false],[10],[0,\"\\n                    \"],[10],[0,\"\\n                \"],[10],[0,\"\\n                \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"unPublishedContents\"]]],null,{\"statements\":[[0,\"                    \"],[7,\"tr\"],[9],[0,\"\\n                      \"],[7,\"td\"],[9],[1,[22,2,[\"id\"]],false],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[1,[22,2,[\"title\"]],false],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[0,\"\\n                        \"],[1,[27,\"moment-format\",[[22,2,[\"createdAt\"]],\"LLL\"],null],false],[0,\"\\n                      \"],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[0,\"\\n                        \"],[1,[27,\"moment-format\",[[22,2,[\"updatedAt\"]],\"LLL\"],null],false],[0,\"\\n                      \"],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"contents.item\",[22,2,[\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"                          \"],[1,[27,\"t\",[\"View\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"acl-can\",[\"update_user\"],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-users\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"user.newest\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-lg-12\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"table-responsive\"],[9],[0,\"\\n              \"],[7,\"table\"],[11,\"class\",\"table table-bordered table-hover table-striped\"],[9],[0,\"\\n                \"],[7,\"thead\"],[9],[0,\"\\n                    \"],[7,\"tr\"],[9],[0,\"\\n                        \"],[7,\"th\"],[9],[0,\"#\"],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-user-displayName\"],null],false],[10],[0,\"\\n\"],[0,\"                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-user-active\"],null],false],[10],[0,\"\\n                        \"],[7,\"th\"],[9],[1,[27,\"t\",[\"form-user-createdAt\"],null],false],[10],[0,\"\\n                    \"],[10],[0,\"\\n                \"],[10],[0,\"\\n                \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"newUsers\",\"user\"]]],null,{\"statements\":[[0,\"                    \"],[7,\"tr\"],[9],[0,\"\\n                      \"],[7,\"td\"],[9],[1,[22,1,[\"id\"]],false],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[1,[22,1,[\"displayName\"]],false],[10],[0,\"\\n\"],[0,\"                      \"],[7,\"td\"],[9],[0,\"\\n\"],[4,\"if\",[[22,1,[\"active\"]]],null,{\"statements\":[[0,\"                          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"                      \"],[10],[0,\"\\n                      \"],[7,\"td\"],[9],[0,\"\\n                        \"],[1,[27,\"moment-format\",[[22,1,[\"createdAt\"]],\"LLL\"],null],false],[0,\"\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-lg-4\"],[9],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/index.hbs" } });
});
;define("we-admin-hotel/templates/links/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "1MPxv9o4", "block": "{\"symbols\":[\"acc\",\"page\",\"linkType\"],\"statements\":[[7,\"form\"],[3,\"action\",[[22,0,[]],\"saveLink\",[23,[\"model\",\"record\"]],[23,[\"modal\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"fieldset\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-text\"],null],false],[0,\"*:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"text\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-text\"],null],\"required\"]]],false],[0,\"\\n      \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto do link, o texto que aparece para o usuário.\"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-href\"],null],false],[0,\"*:\"],[10],[0,\"\\n        \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"href\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-href\"],null],\"required\"]]],false],[0,\"\\n        \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL para onde o usuário irá apois clicar.\"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[0,\"Tipo de link*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"placeholder\",\"onchange\"],[[23,[\"model\",\"linkTypes\"]],[23,[\"model\",\"selectedLinkType\"]],false,\"Clique e selecione uma opção\",[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"selectedLinkType\"]]],null]],null]]],{\"statements\":[[0,\"          \"],[1,[22,3,[\"text\"]],false],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"      \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[27,\"eq\",[[23,[\"model\",\"selectedLinkType\",\"id\"]],\"toURL\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"hr\"],[9],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-href\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"href\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-href\"],null],\"required\"]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL para onde o usuário irá apois clicar.\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"hr\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[27,\"eq\",[[23,[\"model\",\"selectedLinkType\",\"id\"]],\"selectPage\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"hr\"],[9],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"Selecionar página*:\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"searchEnabled\",\"search\",\"selected\",\"placeholder\",\"onchange\"],[true,[27,\"action\",[[22,0,[]],\"searchPages\"],null],[23,[\"model\",\"selectedPage\"]],\"Clique aqui para selecionar uma página\",[27,\"action\",[[22,0,[]],\"selectPage\"],null]]],{\"statements\":[[0,\"            [id:\"],[1,[22,2,[\"id\"]],false],[0,\"] \"],[1,[22,2,[\"title\"]],false],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Use o campo acima para selecionar uma página existente.\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"hr\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[27,\"eq\",[[23,[\"model\",\"selectedLinkType\",\"id\"]],\"createPage\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"hr\"],[9],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n\"],[0,\"            \"],[1,[27,\"we-page-form\",null,[[\"showActionBar\",\"page\",\"alias\"],[false,[23,[\"model\",\"pageRecord\"]],null]]],false],[0,\"\\n          \"],[10],[0,\"\\n        \"],[7,\"hr\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-userRole\"],null],false],[0,\":\"],[10],[0,\"\\n      \"],[1,[27,\"field-role-selector\",null,[[\"value\",\"roles\",\"placeholder\"],[[23,[\"model\",\"record\",\"userRole\"]],[23,[\"model\",\"userRoles\"]],[27,\"t\",[\"form-placeholder-link-userRole\"],null]]]],false],[0,\"\\n      \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[1,[27,\"t\",[\"form-helper-link-userRole\"],null],false],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n\"],[4,\"bs-accordion\",null,null,{\"statements\":[[4,\"component\",[[22,1,[\"item\"]]],[[\"value\",\"title\"],[\"1\",\"Campos avançados\"]],{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-target\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\"],[[23,[\"model\",\"record\",\"target\"]],\"form-control\"]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Esse campo controla onde a página será aberta. Exemplo: _blank\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-class\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"model\",\"record\",\"class\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-class\"],null]]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Attributo do link para controlar o visual: text-success\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-key\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"model\",\"record\",\"key\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-key\"],null]]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Attributo que permite exibir ativar o link apertando um botão no teclado.\"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-rel\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"model\",\"record\",\"rel\"]],\"form-control\",[27,\"t\",[\"form-placeholder-link-rel\"],null]]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-link-title\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\"],[[23,[\"model\",\"record\",\"title\"]],\"form-control\"]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Informação que aparece quando um usuário posiciona o mouse em cima do link.\"],[10],[0,\"\\n        \"],[10],[0,\"\\n\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null],[0,\"    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"submit\"],[9],[1,[27,\"t\",[\"Save\"],null],false],[10],[0,\"\\n\"],[4,\"link-to\",[\"menus.item\",[23,[\"model\",\"menuId\"]]],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"        \"],[1,[27,\"t\",[\"Cancel\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/links/form.hbs" } });
});
;define("we-admin-hotel/templates/login", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "CP6Vk/Jt", "block": "{\"symbols\":[],\"statements\":[[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"isLoading\"]]],null,{\"statements\":[[0,\"    \"],[1,[21,\"bootstrap-loading\"],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"\\n\"],[4,\"if\",[[23,[\"settings\",\"systemSettings\",\"logoUrlOriginal\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"login-project-logo\"],[9],[0,\"\\n        \"],[7,\"img\"],[12,\"src\",[28,[[23,[\"settings\",\"systemSettings\",\"logoUrlOriginal\"]]]]],[11,\"class\",\"img-square\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"panel panel-primary\"],[9],[0,\"\\n\"],[0,\"      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        \"],[7,\"form\"],[11,\"class\",\"form\"],[3,\"action\",[[22,0,[]],\"authenticate\"],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"input-group input-group-lg\"],[9],[0,\"\\n              \"],[7,\"label\"],[11,\"for\",\"inputEmail\"],[11,\"class\",\"input-group-addon\"],[9],[1,[27,\"t\",[\"form-login-email\"],null],false],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"id\",\"type\",\"placeholder\",\"value\",\"required\",\"autofocus\",\"class\"],[\"identification\",\"email\",[27,\"t\",[\"form-placeholder-login-email\"],null],[23,[\"identification\"]],\"required\",\"true\",\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"input-group input-group-lg\"],[9],[0,\"\\n              \"],[7,\"label\"],[11,\"for\",\"inputPassword\"],[11,\"class\",\"input-group-addon\"],[9],[0,\" \"],[1,[27,\"t\",[\"form-login-password\"],null],false],[0,\" \"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"id\",\"placeholder\",\"type\",\"value\",\"required\",\"class\"],[\"password\",[27,\"t\",[\"form-placeholder-login-password\"],null],\"password\",[23,[\"password\"]],\"required\",\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-lg btn-primary\"],[11,\"type\",\"submit\"],[9],[1,[27,\"t\",[\"form-login-submit\"],null],false],[10],[0,\" \"],[4,\"link-to\",[\"forgot-password\"],null,{\"statements\":[[0,\"\\n            Recuperar senha\\n\"]],\"parameters\":[]},null],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-footer text-center\"],[9],[0,\"\\n        \"],[1,[23,[\"settings\",\"systemSettings\",\"siteName\"]],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/login.hbs" } });
});
;define("we-admin-hotel/templates/logout", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZXBWpQac", "block": "{\"symbols\":[],\"statements\":[[0,\"Loggin out, wait ...\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/logout.hbs" } });
});
;define("we-admin-hotel/templates/menus/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ixUKsPRp", "block": "{\"symbols\":[],\"statements\":[[15,\"menus/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/menus/create.hbs" } });
});
;define("we-admin-hotel/templates/menus/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "WULSRFfP", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"menu.edit\"],[[\"name\"],[[23,[\"model\",\"record\",\"name\"]]]]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"menu.create\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"fieldset\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-menu-name\"],null],false],[0,\"*:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"name\"]],\"form-control\",[27,\"t\",[\"form-placeholder-menu-name\"],null],\"required\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-menu-class\"],null],false],[0,\":\"],[10],[0,\"\\n      \"],[1,[27,\"textarea\",null,[[\"value\",\"class\"],[[23,[\"model\",\"record\",\"class\"]],\"form-control\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n      \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"menus.index\"]],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n      \"],[1,[27,\"t\",[\"menu.find\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/menus/form.hbs" } });
});
;define("we-admin-hotel/templates/menus/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "M1vU2qoS", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"menu.find\"],null],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"menus.create\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"menu.create\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/menus/index.hbs" } });
});
;define("we-admin-hotel/templates/menus/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "EElHe74y", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/menus/item.hbs" } });
});
;define("we-admin-hotel/templates/menus/item/add-link", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZYcHJMxj", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Adicionar link\"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[15,\"links/form\",[]],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/menus/item/add-link.hbs" } });
});
;define("we-admin-hotel/templates/menus/item/edit-link", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+drBwq8D", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar link \"],[1,[23,[\"model\",\"record\",\"text\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[15,\"links/form\",[]],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/menus/item/edit-link.hbs" } });
});
;define("we-admin-hotel/templates/menus/item/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Uw1yma9U", "block": "{\"symbols\":[\"acc\",\"mlc\",\"index\",\"aitem\",\"menu\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n    \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"menu.edit\"],[[\"name\"],[[23,[\"model\",\"record\",\"name\"]]]]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-12 menu-editinig-selector\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        Selecione um menu para editar \"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"allowClear\",\"onchange\"],[[23,[\"model\",\"menus\"]],[23,[\"model\",\"menuSelected\"]],false,false,[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"menuSelected\"]]],null]],null]]],{\"statements\":[[0,\"\\n            \"],[1,[22,5,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[5]},null],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"menuSelected\",\"id\"]]],null,{\"statements\":[[4,\"link-to\",[\"menus.item\",[23,[\"model\",\"menuSelected\",\"id\"]]],[[\"class\"],[\"btn btn-sm btn-default\"]],{\"statements\":[[0,\"              Selecionar\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"          ou\\n\"],[4,\"link-to\",[\"menus.create\"],null,{\"statements\":[[0,\"            crie um menu.\\n\"]],\"parameters\":[]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-3 menu-item-editing-sidebar\"],[9],[0,\"\\n    \"],[7,\"h5\"],[9],[0,\"Adicionar link:\"],[10],[0,\"\\n\"],[4,\"bs-accordion\",null,[[\"onChange\",\"selected\"],[[27,\"action\",[[22,0,[]],\"onChangeMenuComponent\"],null],[23,[\"model\",\"selectedMenuComponent\"]]]],{\"statements\":[[4,\"each\",[[23,[\"model\",\"menuLinkSelectorComponents\"]]],null,{\"statements\":[[4,\"component\",[[22,1,[\"item\"]]],[[\"value\"],[[22,3,[]]]],{\"statements\":[[4,\"component\",[[22,4,[\"title\"]]],null,{\"statements\":[[0,\"            \"],[1,[22,2,[\"title\"]],false],[0,\" \"],[4,\"if\",[[27,\"eq\",[[23,[\"model\",\"selectedMenuComponent\"]],[22,3,[]]],null]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-minus pull-right text-primary\"],[11,\"aria-hidden\",\"true\"],[9],[10]],\"parameters\":[]},{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-plus pull-right text-success\"],[11,\"aria-hidden\",\"true\"],[9],[10]],\"parameters\":[]}],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,4,[\"body\"]]],null,{\"statements\":[[0,\"            \"],[1,[27,\"component\",[[22,2,[\"componentName\"]]],[[\"addLink\"],[\"addLink\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[4]},null]],\"parameters\":[2,3]},null]],\"parameters\":[1]},null],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-md-9\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"panel panel-default menu-links-painel\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n\\n        \"],[7,\"form\"],[11,\"class\",\"form-inline\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\" Nome do menu:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[15,\"menus/partials/menu-form-actions\",[]],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"menu-links\"],[9],[0,\"\\n          \"],[7,\"h4\"],[9],[0,\"Estrutura do menu / links:\"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"menu-links-sortable-wrapper\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"links\"]]],null,{\"statements\":[[0,\"              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Clique e arraste cada link abaixo para ordenar os links do menu.\\n              \"],[7,\"br\"],[9],[10],[0,\"A ordem só será salva após clicar no botão \\\"Salvar ordem\\\"\\n              \"],[10],[0,\"\\n              \"],[1,[27,\"menu-links-sort-list\",null,[[\"links\",\"onSortEnd\"],[[23,[\"model\",\"links\",\"links\"]],\"onSortEnd\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[10],[0,\"\\n\\n          \"],[7,\"hr\"],[9],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"menu-settings\"],[9],[0,\"\\n            \"],[7,\"h4\"],[9],[0,\"Configurações do menu\"],[10],[0,\"\\n              \"],[7,\"form\"],[11,\"class\",\"form-horizontal\"],[9],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"label\"],[11,\"for\",\"inputEmail3\"],[11,\"class\",\"col-sm-4\"],[9],[0,\"Localização de exibição:\"],[10],[0,\"\\n                  \"],[7,\"div\"],[11,\"class\",\"col-sm-8\"],[9],[0,\"\\n                    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n                      \"],[7,\"label\"],[9],[0,\"\\n                        \"],[7,\"input\"],[11,\"name\",\"isMainMenu\"],[12,\"checked\",[23,[\"model\",\"isMainMenu\"]]],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"menuUpdated\",\"isMainMenu\"],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Menu principal\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n                    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n                      \"],[7,\"label\"],[9],[0,\"\\n                        \"],[7,\"input\"],[11,\"name\",\"isSecondaryMenu\"],[12,\"checked\",[23,[\"model\",\"isSecondaryMenu\"]]],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"menuUpdated\",\"isSecondaryMenu\"],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Menu lateral / secundário\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n                    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n                      \"],[7,\"label\"],[9],[0,\"\\n                        \"],[7,\"input\"],[11,\"name\",\"isFooterMenu\"],[12,\"checked\",[23,[\"model\",\"isFooterMenu\"]]],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"menuUpdated\",\"isFooterMenu\"],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Menu do rodapé\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n                    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n                      \"],[7,\"label\"],[9],[0,\"\\n                        \"],[7,\"input\"],[11,\"name\",\"isSocialMenu\"],[12,\"checked\",[23,[\"model\",\"isSocialMenu\"]]],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"menuUpdated\",\"isSocialMenu\"],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Menu das redes sociais\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n                    \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n                      \"],[7,\"label\"],[9],[0,\"\\n                        \"],[7,\"input\"],[11,\"name\",\"isAuthenticatedMenu\"],[12,\"checked\",[23,[\"model\",\"isAuthenticatedMenu\"]]],[11,\"type\",\"checkbox\"],[3,\"action\",[[22,0,[]],\"menuUpdated\",\"isAuthenticatedMenu\"],[[\"on\"],[\"change\"]]],[9],[10],[0,\" Menu do usuário autenticado\\n                      \"],[10],[0,\"\\n                    \"],[10],[0,\"\\n                  \"],[10],[0,\"\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"menu-links-footer panel-footer\"],[9],[0,\"\\n         \\n\"],[4,\"if\",[[27,\"gt\",[[23,[\"model\",\"record\",\"id\"]],2],null]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-link\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"model\",\"record\"]]]],[9],[7,\"span\"],[11,\"class\",\"text-danger\"],[9],[0,\"Deletar menu\"],[10],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[15,\"menus/partials/menu-form-actions\",[]],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/menus/item/index.hbs" } });
});
;define("we-admin-hotel/templates/menus/partials/menu-form-actions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "YEYsdiZ/", "block": "{\"symbols\":[],\"statements\":[[7,\"span\"],[11,\"class\",\"menu-links-actions pull-right\"],[9],[0,\"\\n\"],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"updated\"]]],null,{\"statements\":[[0,\"    \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-primary\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"saveAll\",[23,[\"model\",\"record\"]],[23,[\"model\",\"record\",\"sortedLinks\"]]]],[9],[0,\"Salvar\\n      \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Clique para salvar as configurações e ordenação dos links do menu\"]],\"parameters\":[]},null],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"     \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"disabled\",\"disabled\"],[11,\"type\",\"button\"],[9],[0,\"Salvo\\n      \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"As configurações e ordenação estão salva\"]],\"parameters\":[]},null],[0,\"\\n     \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/menus/partials/menu-form-actions.hbs" } });
});
;define("we-admin-hotel/templates/news", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "P+w2yc0p", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/news.hbs" } });
});
;define("we-admin-hotel/templates/news/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Y0cTqXgu", "block": "{\"symbols\":[],\"statements\":[[15,\"news/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/news/create.hbs" } });
});
;define("we-admin-hotel/templates/news/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "MeZ8WWF+", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar notícia \\\"\"],[1,[23,[\"model\",\"record\",\"title\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Adicionar notícia\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-title\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"title\"]],\"title\",\"form-control\",[27,\"t\",[\"form-placeholder-news-title\"],null],\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-about\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"record\",\"about\"]],\"about\",\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-body\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"field-text-editor\",null,[[\"value\"],[[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Images\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Attachment\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-attachment\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"file-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"attachment\"]],true]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Publicação\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[1,[27,\"field-content-publication\",null,[[\"class\",\"publicationDate\",\"isPublished\"],[\"form-group\",[23,[\"model\",\"record\",\"publishedAt\"]],[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\"\\n\"],[0,\"          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Comentários\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"name\",\"type\",\"checked\"],[\"allowComments\",\"checkbox\",[23,[\"model\",\"record\",\"allowComments\"]]]]],false],[0,\" Permitir comentários?\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Dates\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-createdAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-news-updatedAt\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"news.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Notícias\\n        \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"linkPermanent\"]]],null,{\"statements\":[[0,\"          \"],[7,\"a\"],[12,\"href\",[28,[[23,[\"model\",\"record\",\"linkPermanent\"]]]]],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"target\",\"_blank\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-eye-open\"],[9],[10],[0,\"\\n          \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Ver\"]],\"parameters\":[]},null],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"model\",\"record\"]]]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n          \"],[4,\"bs-tooltip\",null,[[\"placement\"],[\"top\"]],{\"statements\":[[0,\"Deletar\"]],\"parameters\":[]},null],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/news/form.hbs" } });
});
;define("we-admin-hotel/templates/news/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "gGdFk8ih", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"news.find\"],null],false],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\"],[\"news\"]],{\"statements\":[[1,[27,\"t\",[\"news.create\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/news/index.hbs" } });
});
;define("we-admin-hotel/templates/news/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "CnGfENn2", "block": "{\"symbols\":[],\"statements\":[[15,\"news/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/news/item.hbs" } });
});
;define("we-admin-hotel/templates/not-found", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "L3HToIAu", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"text-center\"],[9],[0,\"\\n  \"],[7,\"h1\"],[9],[0,\"A página ou o conteúdo não está disponível\"],[10],[0,\"\\n  \"],[7,\"p\"],[9],[7,\"code\"],[9],[0,\"404\"],[10],[0,\" não encontrado.\"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/not-found.hbs" } });
});
;define("we-admin-hotel/templates/partials/file-selector-modal", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "EN9IR5tw", "block": "{\"symbols\":[\"modal\",\"footer\",\"tab\",\"p\"],\"statements\":[[4,\"bs-modal\",null,[[\"open\",\"onSubmit\",\"onHidden\",\"class\"],[[23,[\"upload\",\"modalOpen\"]],[27,\"action\",[[22,0,[]],\"upload\"],null],[27,\"action\",[[22,0,[]],\"onHideUploadModal\"],null],\"file-selector-modal\"]],{\"statements\":[[4,\"component\",[[22,1,[\"header\"]]],null,{\"statements\":[[0,\"    \"],[7,\"h4\"],[11,\"class\",\"modal-title\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-picture\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"image.selector\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"body\"]]],null,{\"statements\":[[4,\"if\",[[23,[\"upload\",\"error\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"alert alert-danger text-center\"],[11,\"role\",\"alert\"],[9],[1,[23,[\"upload\",\"error\"]],true],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[23,[\"upload\",\"uploader\"]]],null,{\"statements\":[[4,\"if\",[[23,[\"upload\",\"uploader\",\"isUploading\"]]],null,{\"statements\":[[4,\"bs-progress\",null,null,{\"statements\":[[0,\"            \"],[1,[27,\"component\",[[22,4,[\"bar\"]]],[[\"value\",\"minValue\",\"maxValue\",\"roundDigits\",\"showLabel\",\"animate\",\"type\",\"striped\"],[[23,[\"upload\",\"percent\"]],0,100,[23,[\"upload\",\"percent\"]],true,true,\"success\",true]]],false],[0,\"\\n\"]],\"parameters\":[4]},null]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-md-2\"],[9],[0,\"\\n              \"],[7,\"img\"],[12,\"src\",[23,[\"upload\",\"previewImageSrc\"]]],[11,\"class\",\"content-image preview\"],[9],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-md-10\"],[9],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"upload\",\"description\"]],\"form-control\",\"Clique aqui e descreve a imagem\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descrição da imagem. Essa descrição é usada como informação alternativa para leitores de tela.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},{\"statements\":[[4,\"bs-tab\",null,null,{\"statements\":[[4,\"component\",[[22,3,[\"pane\"]]],[[\"title\"],[\"Upload / enviar\"]],{\"statements\":[[0,\"            \"],[1,[27,\"image-upload\",null,[[\"uploader\",\"url\",\"progress\",\"didUpload\",\"didError\",\"selected\"],[[23,[\"upload\",\"uploader\"]],[23,[\"upload\",\"url\"]],\"progress\",\"didUpload\",\"didError\",\"selected\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,3,[\"pane\"]]],[[\"title\"],[\"Selecionar imagem salva\"]],{\"statements\":[[0,\"            \"],[1,[27,\"we-images-to-select\",null,[[\"onSelectImage\"],[[27,\"action\",[[22,0,[]],\"onSelectSalvedImage\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[]}]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"footer\"]]],null,{\"statements\":[[4,\"bs-button\",null,[[\"onClick\",\"type\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"close\"]]],null],\"default\",\"cancel-image-btn\"]],{\"statements\":[[0,\"      \"],[1,[27,\"t\",[\"Cancel\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-button\",null,[[\"onClick\",\"type\",\"disabled\",\"class\"],[[27,\"action\",[[22,0,[]],[22,1,[\"submit\"]]],null],\"primary\",[23,[\"upload\",\"notReadyToUpload\"]],\"submit-image-btn\"]],{\"statements\":[[0,\"      \"],[1,[27,\"t\",[\"image.Add\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/partials/file-selector-modal.hbs" } });
});
;define("we-admin-hotel/templates/partials/header", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "OFLTjMqz", "block": "{\"symbols\":[\"navbar\"],\"statements\":[[4,\"bs-navbar\",null,[[\"position\"],[\"static-top\"]],{\"statements\":[[0,\"\\t\"],[7,\"div\"],[11,\"class\",\"navbar-header\"],[9],[0,\"\\n\"],[4,\"component\",[[22,1,[\"toggle\"]]],null,{\"statements\":[[0,\"\\t\\t\\t\"],[7,\"span\"],[11,\"class\",\"sr-only\"],[9],[0,\"Toggle navigation\"],[10],[0,\"\\n\\t\\t\\t\"],[7,\"span\"],[11,\"class\",\"icon-bar\"],[9],[10],[0,\"\\n\\t\\t\\t\"],[7,\"span\"],[11,\"class\",\"icon-bar\"],[9],[10],[0,\"\\n\\t\\t\\t\"],[7,\"span\"],[11,\"class\",\"icon-bar\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[7,\"a\"],[11,\"href\",\"/\"],[11,\"class\",\"navbar-brand\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"settings\",\"systemSettings\",\"logoUrlOriginal\"]]],null,{\"statements\":[[0,\"        \"],[7,\"img\"],[11,\"class\",\"site-logo\"],[12,\"src\",[28,[[23,[\"settings\",\"imageHost\"]],[23,[\"settings\",\"systemSettings\",\"logoUrlOriginal\"]]]]],[9],[10],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"sr-only\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"settings\",\"systemSettings\",\"siteName\"]]],null,{\"statements\":[[0,\"            \"],[1,[23,[\"settings\",\"systemSettings\",\"siteName\"]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[1,[21,\"appName\"],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"span\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"settings\",\"systemSettings\",\"siteName\"]]],null,{\"statements\":[[0,\"            \"],[1,[23,[\"settings\",\"systemSettings\",\"siteName\"]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[1,[21,\"appName\"],false],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n\\t\"],[10],[0,\"\\n\\n\\t\"],[15,\"partials/navbar-top-links\",[1]],[0,\"\\n\\t\"],[15,\"partials/sidebar-menu\",[1]],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/partials/header.hbs" } });
});
;define("we-admin-hotel/templates/partials/home-not-manager", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lkRQLywi", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"id\",\"wrapper\"],[9],[0,\"\\n  \"],[15,\"partials/header\",[]],[0,\"\\n  \"],[7,\"div\"],[11,\"id\",\"page-wrapper\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[1,[21,\"outlet\"],false],[0,\"\\n    \"],[10],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/partials/home-not-manager.hbs" } });
});
;define("we-admin-hotel/templates/partials/home-un-authenticated", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "9Tqujhtf", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"container\"],[9],[1,[21,\"outlet\"],false],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/partials/home-un-authenticated.hbs" } });
});
;define("we-admin-hotel/templates/partials/list-item-created-at", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "tfSHuPSC", "block": "{\"symbols\":[],\"statements\":[[1,[27,\"moment-format\",[[23,[\"record\",\"createdAt\"]],\"LLL\"],null],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/partials/list-item-created-at.hbs" } });
});
;define("we-admin-hotel/templates/partials/navbar-top-links", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "vzTji3o7", "block": "{\"symbols\":[\"nav\",\"dd\",\"ddm\"],\"statements\":[[4,\"component\",[[23,[\"navbar\",\"nav\"]]],[[\"class\"],[\"nav navbar-top-links navbar-right\"]],{\"statements\":[[4,\"bs-dropdown\",null,[[\"tagName\"],[\"li\"]],{\"statements\":[[4,\"component\",[[22,2,[\"toggle\"]]],null,{\"statements\":[[4,\"if\",[[23,[\"settings\",\"user\",\"avatar\"]]],null,{\"statements\":[[0,\"        \"],[1,[27,\"we-image\",null,[[\"file\",\"size\",\"class\"],[[23,[\"settings\",\"user\",\"avatar\"]],\"thumbnail\",\"navbar-user-avatar\"]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-user fa-fw\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[1,[23,[\"settings\",\"user\",\"displayName\"]],false],[0,\" \"],[7,\"span\"],[11,\"class\",\"caret\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,2,[\"menu\"]]],null,{\"statements\":[[4,\"active-link\",null,null,{\"statements\":[[4,\"link-to\",[\"profile.index\"],null,{\"statements\":[[0,\"          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"menu.user.edit\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"active-link\",null,null,{\"statements\":[[4,\"link-to\",[\"profile.change-password\"],null,{\"statements\":[[0,\"          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-lock\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"auth.change-password\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"      \"],[7,\"li\"],[11,\"role\",\"separator\"],[11,\"class\",\"divider\"],[9],[10],[0,\"\\n\"],[4,\"active-link\",null,null,{\"statements\":[[4,\"link-to\",[\"logout\"],null,{\"statements\":[[0,\"          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-off\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"Logout\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/partials/navbar-top-links.hbs" } });
});
;define("we-admin-hotel/templates/partials/sidebar-menu", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "J5yAcI0U", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"navbar-default sidebar\"],[11,\"role\",\"navigation\"],[9],[0,\"\\n\"],[4,\"component\",[[23,[\"navbar\",\"content\"]]],[[\"class\"],[\"sidebar-nav\"]],{\"statements\":[[0,\"    \"],[1,[21,\"menu-admin\"],false],[0,\"\\n\"]],\"parameters\":[]},null],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/partials/sidebar-menu.hbs" } });
});
;define("we-admin-hotel/templates/permissions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "rFDKM/GM", "block": "{\"symbols\":[\"permissionName\",\"role\",\"role\"],\"statements\":[[7,\"h1\"],[9],[1,[27,\"t\",[\"permission.link\"],null],false],[10],[0,\"\\n\\n\"],[7,\"table\"],[11,\"class\",\"table table-bordered permissions-table\"],[9],[0,\"\\n  \"],[7,\"thead\"],[9],[0,\"\\n    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"#\"],[10],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"roleNames\"]]],null,{\"statements\":[[0,\"        \"],[7,\"th\"],[9],[1,[22,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"permissionNames\"]]],null,{\"statements\":[[0,\"      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"td\"],[9],[1,[22,1,[]],false],[10],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"roleNames\"]]],null,{\"statements\":[[0,\"          \"],[7,\"td\"],[9],[0,\"\\n            \"],[1,[27,\"role-permission-check\",null,[[\"roleName\",\"permissionName\",\"roles\",\"class\",\"addPermission\",\"removePermission\"],[[22,2,[]],[22,1,[]],[23,[\"model\",\"data\",\"roles\"]],\"btn btn-default\",\"addPermission\",\"removePermission\"]]],false],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/permissions.hbs" } });
});
;define("we-admin-hotel/templates/profile/change-password", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "NNloRcUM", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"content-box-large\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n    \"],[7,\"h1\"],[9],[1,[27,\"t\",[\"auth.change-password\"],null],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n    \"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"changePassword\",[23,[\"model\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n    \"],[7,\"fieldset\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-change-password-password\"],null],false],[10],[0,\"\\n        \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"type\"],[[23,[\"model\",\"oldPassword\"]],\"form-control\",[27,\"t\",[\"form-placeholder-change-password-password\"],null],\"required\",\"password\"]]],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-change-password-newPassword\"],null],false],[10],[0,\"\\n        \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"type\"],[[23,[\"model\",\"newPassword\"]],\"form-control\",[27,\"t\",[\"form-placeholder-change-password-newPassword\"],null],\"required\",\"password\"]]],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n        \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-change-password-rNewPassword\"],null],false],[10],[0,\"\\n        \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"type\"],[[23,[\"model\",\"rNewPassword\"]],\"form-control\",[27,\"t\",[\"form-placeholder-change-password-rNewPassword\"],null],\"required\",\"password\"]]],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"submit\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-floppy-save\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"form-change-password-submit\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/profile/change-password.hbs" } });
});
;define("we-admin-hotel/templates/profile/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "BVi/EHZS", "block": "{\"symbols\":[\"locale\"],\"statements\":[[7,\"div\"],[11,\"class\",\"content-box-large\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n    \"],[7,\"h1\"],[9],[1,[27,\"t\",[\"Profile\"],null],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n    \"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"user\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-displayName\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"user\",\"displayName\"]],\"form-control\",[27,\"t\",[\"form-placeholder-user-displayName\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-email\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"disabled\"],[[23,[\"model\",\"user\",\"email\"]],\"form-control\",[27,\"t\",[\"form-placeholder-user-email\"],null],[23,[\"settings\",\"notIsAdmin\"]]]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-biography\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"model\",\"user\",\"biography\"]],\"form-control\",\"4\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-language\"],null],false],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"onchange\"],[[23,[\"settings\",\"data\",\"locales\"]],[23,[\"model\",\"user\",\"language\"]],false,[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"user\",\"language\"]]],null]],null]]],{\"statements\":[[0,\"            \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"        \"],[10],[0,\"\\n\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-avatar\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"user\",\"avatar\"]]]]],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-floppy-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/profile/index.hbs" } });
});
;define("we-admin-hotel/templates/roles", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0cFHgCyk", "block": "{\"symbols\":[\"role\"],\"statements\":[[7,\"h1\"],[9],[1,[27,\"t\",[\"roles.link\"],null],false],[10],[0,\"\\n\"],[7,\"ul\"],[11,\"class\",\"list-group\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"roles\"]]],null,{\"statements\":[[0,\"    \"],[7,\"li\"],[11,\"class\",\"list-group-item\"],[9],[0,\"\\n      \"],[1,[22,1,[\"name\"]],false],[0,\"\\n\"],[4,\"unless\",[[22,1,[\"isSystemRole\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[3,\"action\",[[22,0,[]],\"deleteRole\",[22,1,[]]]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[7,\"li\"],[11,\"class\",\"list-group-item\"],[9],[0,\"\\n    \"],[7,\"form\"],[11,\"class\",\"form-inline\"],[3,\"action\",[[22,0,[]],\"createRole\",[23,[\"model\",\"newRole\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[11,\"class\",\"sr-only\"],[9],[1,[27,\"t\",[\"form-role-name\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"newRole\",\"name\"]],\"form-control\",[27,\"t\",[\"form-placeholder-role-name\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"submit\"],[9],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/roles.hbs" } });
});
;define("we-admin-hotel/templates/settings", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "nPkz8v90", "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[1,[21,\"outlet\"],false],[10],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings.hbs" } });
});
;define("we-admin-hotel/templates/settings/email", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/FbU1w+Z", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Emails e contato do site\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Configurações do email de contato:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Email de contato do site*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"settings\",\"emailContact\"]],\"form-control\",\"Digite o email aqui...\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Endereço de email de contato do site que é usado para recebimento das mensagens de contato e avisos aos administradores.\"],[7,\"br\"],[9],[10],[0,\"\\n              Normalmente as organizações usam um email das suas áreas de comunicação.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n\"],[0,\"      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/email.hbs" } });
});
;define("we-admin-hotel/templates/settings/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "IFhU2Lhi", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Configurações do sistema\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Dados do site:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Título do site*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"settings\",\"siteName\"]],\"form-control\",\"Digite o título do sistema aqui...\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O \\\"nome do site\\\" é usado nos títulos do site e como nome do sistema.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Descrição:\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"model\",\"settings\",\"siteDescription\"]],\"form-control\",\"3\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descrição usada nas páginas e nos compartilhamentos nas redes sociais.\"],[7,\"br\"],[9],[10],[0,\"\\n              Para uma melhor apresentação evite passar de 200 palavras.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Texto do rodapé:\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"model\",\"settings\",\"siteFooter\"]],\"form-control\",\"3\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O texto que é exibido na parte de baixo do site, no rodapé.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Assuntos (keywords):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"metatagKeywords\"]],\"metatagKeywords\",\"form-control\",\"Ex: tecnologia,site,comida\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Palavras separadas por \"],[7,\"strong\"],[9],[0,\",\"],[10],[0,\".\\n                \"],[7,\"br\"],[9],[10],[0,\"Os assuntos são opcionais e são usados por alguns motores de busca para indexação do site.\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Email do sistema*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"name\"],[[23,[\"model\",\"settings\",\"emailContact\"]],\"form-control\",\"Ex: nao-responda <contato@linkysystems.com>\",\"required\",\"emailContact\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Endereço de email do sistema que é usado para recebimento das mensagens de contato e avisos aos administradores.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Subtítulo do site*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"name\"],[[23,[\"model\",\"settings\",\"subTitle\"]],\"form-control\",\"subTitle\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Subtítulo que normalmente é exibido abaixo do título do site caso o tema suporte um subtítulo.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4 system-settings-sidebar\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Logo e ícone:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Logo do site:\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"logo\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem com 35px de altura (height) e no máximo 200px de largura (width).\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Ícone do site:\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"icon\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem quadrada com 32x23px ou 48x48px ou 64x64px ou 128x128px.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Imagem para redes sociais:\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"ogImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem com 1200x630px.\\n                \"],[7,\"br\"],[9],[10],[0,\"Essa imagem é exibida ao compartilhar páginas sem imagens de destaque nas redes sociais.\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Imagem de fundo:\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"bgImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem com 1900x1200px.\\n                \"],[7,\"br\"],[9],[10],[0,\"Imagem de fundo disponível se o tema selecionado usar uma imagem de fundo.\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/index.hbs" } });
});
;define("we-admin-hotel/templates/settings/integrations", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "1kaJRioS", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Integrações\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"alert alert-warning\"],[11,\"role\",\"alert\"],[9],[0,\"Atenção! Altere as configurações abaixo com cuidado pois podem desativar funções importantes do sistema.\"],[7,\"br\"],[9],[10],[0,\"Em caso de dúvidas entre em contato com a Linky Systems pelo email contact@linkysystems.com\"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-google\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Google analytics:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"ID de acompanhamento:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"googleAnalyticsID\"]],\"googleAnalyticsID\",\"form-control\",\"Digite o id aqui...\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O ID de acompanhamento pego no site do google analytics. Ex: UA-00000000-0.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-facebook\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Facebook:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Client id (client_id):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"fbClientId\"]],\"fbClientId\",\"form-control\",\"Digite o client_id aqui...\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O client_id pego na página do aplicativo do facebook.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Client secret (client_secret):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"fbclientSecret\"]],\"fbclientSecret\",\"form-control\",\"Digite o client_secret aqui...\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O client_secret pego na página do aplicativo do facebook.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Id da página:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"fbPageId\"]],\"fbPageId\",\"form-control\",\"Digite o id da página aqui...\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O id da página pego na url página facebook, normalmente um número grande como: 189264414423109.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-envelope-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" SMTP:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Servidor (host):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"smtp__host\"]],\"smtp__host\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Endereço do servidor SMTP. Exemplo: smtp.gmail.com\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Porta (port):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"smtp__port\"]],\"smtp__port\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Porta de conexão com o servidor de e-mail. Exemplo: 465\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome de usuário (username):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"autocomplete\",\"value\",\"name\",\"class\"],[\"off\",[23,[\"model\",\"settings\",\"smtp__auth__user\"]],\"smtp__auth__user\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Nome de usuário no servidor de e-mail.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Senha do SMTP:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"type\",\"autocomplete\",\"value\",\"name\",\"class\"],[\"password\",\"new-password\",[23,[\"model\",\"settings\",\"smtp__auth__pass\"]],\"smtp__auth__pass\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Senha usuário no servidor de e-mail.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"checkbox\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\",\"name\"],[\"checkbox\",[23,[\"model\",\"settings\",\"smtp__secure\"]],\"smtp__secure\"]]],false],[0,\" Usar TLS na conexão?\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"hr\"],[9],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Remetente padrão (from):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"smtp__mailOptions__from\"]],\"smtp__mailOptions__from\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Usado como from, deve ter o mesmo domínio da conta de email de SMTP. \"],[7,\"br\"],[9],[10],[0,\"Exemplo: contact@linkysystems.com\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Responder para padrão (replyTo):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"smtp__mailOptions__replyTo\"]],\"smtp__mailOptions__replyTo\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Email padrão que receberá a resposta do usuário. Qualquer email válido pode ser usado\"],[7,\"br\"],[9],[10],[0,\"Exemplo: contato@albertosouza.net\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Assunto padrão (subject):\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"smtp__mailOptions__subject\"]],\"smtp__mailOptions__subject\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Usado caso o tipo de e-mail enviado não possua um assunto.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-6\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-map\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Google maps:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"API Key:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\",\"placeholder\"],[[23,[\"model\",\"settings\",\"googleMapsKey\"]],\"googleMapsKey\",\"form-control\",\"Ex: AIzaSyDa_THpEmCgLPCOKDIj-q7IRTkyIku99TE\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Chave pública (key) do google maps criada no \\\"google maps console\\\", link: https://developers.google.com/maps/documentation/embed/guide?hl=pt-br.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-shield\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Recaptcha:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Recaptcha key:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"recaptchaKey\"]],\"recaptchaKey\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Chave pública (key) criada em: https://www.google.com/recaptcha/admin.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Recaptcha secret:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"name\",\"class\"],[[23,[\"model\",\"settings\",\"recaptchaSecret\"]],\"recaptchaSecret\",\"form-control\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Chave privada (secret) criada em: https://www.google.com/recaptcha/admin.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/integrations.hbs" } });
});
;define("we-admin-hotel/templates/settings/project", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LWC6Zk/R", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Dados do hotel\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Dados do hotel:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Telefone de contato 1*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"sitePhone1\",[23,[\"model\",\"settings\",\"sitePhone1\"]],\"form-control\",\"Ex: 011 21 1234-5678\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O telefone principal de contato com o hotel.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Telefone de contato 2:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"sitePhone2\",[23,[\"model\",\"settings\",\"sitePhone2\"]],\"form-control\",\"Ex: 011 21 2345-6789\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Um segundo telefone de contato com o hotel.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Email de contato 1*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"siteEmail1\",[23,[\"model\",\"settings\",\"siteEmail1\"]],\"form-control\",\"Ex: contato@hotel.com.br\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Email principal de contato com o site.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Email de contato 2:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"siteEmail2\",[23,[\"model\",\"settings\",\"siteEmail2\"]],\"form-control\",\"Ex: contato2@hotel.com.br\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Email secundário de contato com o site.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Horário de atendimento:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"siteDaysOfService\",[23,[\"model\",\"settings\",\"siteDaysOfService\"]],\"form-control\",\"Ex: De segunda à sexta feira das 09:00hs as 18:00hs\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Dias e horários de atendimeno para contatos por telefone, email e(ou) presencial.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Endereço:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"siteAddress\",[23,[\"model\",\"settings\",\"siteAddress\"]],\"form-control\",\"Ex: Rua Itaberaba - Vila Maria Helena, Duque de Caxias - RJ\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Endereço principal do hotel.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4 system-settings-sidebar\"],[9],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/project.hbs" } });
});
;define("we-admin-hotel/templates/settings/theme", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ldoX8zcr", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/theme.hbs" } });
});
;define("we-admin-hotel/templates/settings/theme/change", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "XVF1BAaC", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/theme/change.hbs" } });
});
;define("we-admin-hotel/templates/settings/theme/change/color", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mOBuOZYv", "block": "{\"symbols\":[\"color\",\"name\",\"c\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Mudar tema\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"h3\"],[9],[0,\"Selecionar cor do tema \\\"\"],[1,[23,[\"model\",\"theme\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"],[4,\"each\",[[27,\"-each-in\",[[23,[\"model\",\"theme\",\"themejs\",\"configs\",\"colors\"]]],null]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"col-md-4 theme-item-color-preview\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n            \"],[7,\"h3\"],[11,\"class\",\"panel-title\"],[9],[1,[22,2,[]],false],[0,\" \"],[4,\"each\",[[22,1,[\"colors\"]]],null,{\"statements\":[[0,\"\\n              \"],[7,\"span\"],[12,\"style\",[28,[\"background-color:\",[22,3,[\"value\"]],\";color:\",[22,3,[\"value\"]],\";\"]]],[9],[0,\"   \"],[10],[0,\"\\n            \"]],\"parameters\":[3]},null],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            \"],[7,\"img\"],[11,\"class\",\"img-responsive\"],[12,\"src\",[28,[[23,[\"model\",\"ENV\",\"GLOBAL_HOST\"]],\"/seeds-files/\",[23,[\"model\",\"theme\",\"gitRepositoryName\"]],\"/files/public/previews/\",[22,2,[]],\".jpg\"]]],[9],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-footer\"],[9],[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"btn btn-sm btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"installTheme\",[23,[\"model\",\"theme\"]],[22,1,[]],[22,2,[]]]],[9],[0,\"Selecionar e instalar\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/theme/change/color.hbs" } });
});
;define("we-admin-hotel/templates/settings/theme/change/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "6kneTDQg", "block": "{\"symbols\":[\"theme\",\"image\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Mudar tema\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"themes\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"col-md-4 col-xl-3\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"thumbnail\"],[9],[0,\"\\n\"],[4,\"each\",[[22,1,[\"featuredImage\"]]],null,{\"statements\":[[0,\"            \"],[7,\"img\"],[12,\"src\",[28,[[23,[\"model\",\"ENV\",\"GLOBAL_HOST\"]],[22,2,[\"urls\",\"original\"]]]]],[9],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"          \"],[7,\"div\"],[11,\"class\",\"caption\"],[9],[0,\"\\n            \"],[7,\"h3\"],[9],[1,[22,1,[\"name\"]],false],[10],[0,\"\\n            \"],[7,\"p\"],[9],[1,[22,1,[\"description\"]],true],[10],[0,\"\\n            \"],[7,\"p\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"settings.theme.change.color\",[22,1,[\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"                \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-download\"],[9],[10],[0,\" Selecionar\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/theme/change/index.hbs" } });
});
;define("we-admin-hotel/templates/settings/theme/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "giehN3FR", "block": "{\"symbols\":[\"opts\",\"color\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Tema e visual do sistema\"],[10],[0,\"\\n\\n\"],[1,[21,\"settings-menu\"],false],[0,\"\\n\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"settings\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Configurações do tema:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"themeCollorOptions\",\"length\"]]],null,{\"statements\":[[0,\"                \"],[7,\"label\"],[9],[0,\"Cores do site:\"],[10],[0,\"\\n                \"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"onchange\"],[[23,[\"model\",\"themeCollorOptions\"]],[23,[\"model\",\"themeCollor\"]],false,[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"themeCollor\"]]],null]],null]]],{\"statements\":[[0,\"[\"],[1,[22,1,[\"id\"]],false],[0,\"] \"],[1,[22,1,[\"label\"]],false],[0,\" \"],[4,\"each\",[[22,1,[\"colors\"]]],null,{\"statements\":[[1,[27,\"theme-color-item\",null,[[\"color\"],[[22,2,[\"value\"]]]]],false]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                Cores do tema: \"],[7,\"strong\"],[9],[0,\" padrão\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"Configurações Atuais:\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"p\"],[9],[0,\"Tema ativo: \"],[7,\"strong\"],[9],[1,[23,[\"model\",\"themeConfigs\",\"enabled\"]],false],[10],[10],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"updateAvaible\",\"v\"]]],null,{\"statements\":[[0,\"              \"],[7,\"p\"],[9],[0,\"Update disponível: \"],[7,\"strong\"],[9],[1,[23,[\"model\",\"updateAvaible\",\"v\"]],false],[10],[0,\" \"],[7,\"button\"],[11,\"class\",\"btn btn-primary btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"updateTheme\",[23,[\"model\",\"themeConfigs\",\"enabled\"]],[23,[\"model\",\"updateAvaible\",\"release\"]]]],[9],[0,\" \"],[7,\"i\"],[11,\"class\",\"fa fa-download\"],[9],[10],[0,\" Atualizar\"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          Salvar\\n        \"],[10],[0,\"\\n\\n\"],[4,\"link-to\",[\"settings.theme.change\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"          Mudar tema\\n\"]],\"parameters\":[]},null],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"verifyThemesUpdate\"]],[9],[0,\"Buscar atualização\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/settings/theme/index.hbs" } });
});
;define("we-admin-hotel/templates/simple-events/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Thk69PPH", "block": "{\"symbols\":[],\"statements\":[[15,\"simple-events/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/simple-events/create.hbs" } });
});
;define("we-admin-hotel/templates/simple-events/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VijEXQuV", "block": "{\"symbols\":[\"term\"],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar evento \\\"\"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\\"\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Cadastrar evento\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-pencil-square\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Dados básicos\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Nome*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"name\",[23,[\"model\",\"record\",\"name\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Nome do evento.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Sobre:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Texto pequeno que descreva o evento com no máximo 200 letras. Esse texto aparece nas listas.\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"name\",\"value\",\"class\",\"required\"],[\"about\",[23,[\"model\",\"record\",\"about\"]],\"form-control\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Dados do evento:\"],[10],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Descreva o evento com o máximo de informações. Esse texto aparece na página de informações do evento.\"],[10],[0,\"\\n              \"],[1,[27,\"tinymce-editor\",null,[[\"options\",\"value\"],[[23,[\"editorOptions\"]],[23,[\"model\",\"record\",\"body\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-picture-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Imagens\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-featuredImage\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"featuredImage\"]]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem de no mínimo 900x400px que pode ser quadrada ou com a largura maior que a altura.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-images\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"record\",\"images\"]],true]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Imagem qualquer tamanho, o sistema realiza o redimencionamento da imagem.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"content.Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"simple-events.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Eventos\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-primary\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Inscrição\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[0,\"Link para inscrição:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"type\",\"name\",\"value\",\"class\"],[\"url\",\"registrationLink\",[23,[\"model\",\"record\",\"registrationLink\"]],\"form-control\"]]],false],[0,\"\\n          \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Link completo para plataforma de inscrição.\"],[7,\"br\"],[9],[10],[0,\"A sessão de eventos não possuí um sistema de inscrição e pagamentos de eventos mas permite adição de um link para uma plataforma externa.\"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-calendar-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Datas\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n\"],[0,\"          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Início do evento:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"eventStartDate\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"eventStartDate\"]]],null]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Data e horário inicial do evento.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Fim do evento:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"eventEndDate\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"eventEndDate\"]]],null]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Data e horário final do evento.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"],[0,\"          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Início das inscrições:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"registrationStartDate\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"registrationStartDate\"]]],null]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Dia e horário inicial para as inscrições no evento.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Fim das inscrições:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"registrationEndDate\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"registrationEndDate\"]]],null]]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Ultimo dia e horário para inscrições no evento.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"hr\"],[9],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Criado em:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"createdAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"createdAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Atualizado em:\"],[10],[0,\"\\n              \"],[1,[27,\"date-time-picker\",null,[[\"onChange\",\"date\"],[[27,\"action\",[[22,0,[]],\"changeDate\",[23,[\"model\",\"record\"]],\"updatedAt\"],null],[27,\"readonly\",[[23,[\"model\",\"record\",\"updatedAt\"]]],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-tags\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.terms.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-content-tags\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select-multiple\",null,[[\"search\",\"selected\",\"onchange\"],[[27,\"action\",[[22,0,[]],\"searchTagsTerms\"],null],[23,[\"model\",\"record\",\"tags\"]],[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"record\",\"tags\"]]],null]],null]]],{\"statements\":[[0,\"                \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-globe\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-comment\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Comentários\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"name\",\"type\",\"checked\"],[\"allowComments\",\"checkbox\",[23,[\"model\",\"record\",\"allowComments\"]]]]],false],[0,\" Permitir comentários?\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-random\"],[9],[10],[0,\" URL\"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n            \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n            \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Url limpa de acesso ao conteúdo, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/simple-events/form.hbs" } });
});
;define("we-admin-hotel/templates/simple-events/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "u2Yjabr1", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Eventos\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"simple-event\",\"/simple-events/create\"]],{\"statements\":[[0,\"Cadastrar evento\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/simple-events/index.hbs" } });
});
;define("we-admin-hotel/templates/simple-events/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "QrND40+P", "block": "{\"symbols\":[],\"statements\":[[15,\"simple-events/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/simple-events/item.hbs" } });
});
;define("we-admin-hotel/templates/site-contact-forms/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "OLsYhQa/", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contact-forms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contact-forms/create.hbs" } });
});
;define("we-admin-hotel/templates/site-contact-forms/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yInpAZ02", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contact-forms/menu-local\",[]],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h3\"],[9],[0,\"Editar assunto de contato #\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h3\"],[9],[0,\"Adicionar assunto de contato\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Assunto*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"record\",\"subject\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"O assunto da mensagem que aparecerá para seleção do usuário ao escrever a mensagem de contato no site.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Enviar para os emails:*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"record\",\"contactWithEmail\"]],\"form-control\",\"required\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Digite aqui os emails que receberão a mensagem separados por \"],[7,\"strong\"],[9],[0,\";\"],[10],[0,\"\\n                \"],[7,\"br\"],[9],[10],[0,\"Exemplo: Linky Systems <contact@linkysystems.com>;Alberto Souza <alberto@linkysystems.com>\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"site-contact-forms.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Voltar para lista\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n\"],[0,\"  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contact-forms/form.hbs" } });
});
;define("we-admin-hotel/templates/site-contact-forms/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "b/THOx9F", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contact-forms/menu-local\",[]],[0,\"\\n\\n\"],[7,\"h3\"],[9],[0,\"Assuntos de contato\"],[10],[0,\"\\n\\n\"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Assuntos disponíveis para seleção no formulário de contato do site que permitem enviar as mensagens de contato para emails diferentes.\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"site-contact-form\",\"/site-contact-forms/create\"]],{\"statements\":[[0,\"Adicionar assunto\"]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contact-forms/index.hbs" } });
});
;define("we-admin-hotel/templates/site-contact-forms/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cx4B99q0", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contact-forms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contact-forms/item.hbs" } });
});
;define("we-admin-hotel/templates/site-contact-forms/menu-local", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hOiVyVVV", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Mensagens de contato do site\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"site-contacts.index\"],null,{\"statements\":[[0,\"      Mensagens\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"site-contact-forms.index\"],null,{\"statements\":[[0,\"      Assuntos\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/site-contact-forms/menu-local.hbs" } });
});
;define("we-admin-hotel/templates/site-contacts/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Y8D76Rj5", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contacts/menu-local\",[]],[0,\"\\n\\n\"],[7,\"h3\"],[9],[0,\"Mensagens de contato\"],[10],[0,\"\\n\\n\"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"Mensagens de contato enviadas usando o formulário de contato do site.\"],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"changeStatus\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"changeStatus\",\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contacts/index.hbs" } });
});
;define("we-admin-hotel/templates/site-contacts/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VKxv4qqQ", "block": "{\"symbols\":[],\"statements\":[[15,\"site-contacts/menu-local\",[]],[0,\"\\n\\n\"],[7,\"h3\"],[9],[0,\"Mensagem #\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"site-contact\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"site-contact-name\"],[9],[0,\"\\n            \"],[7,\"strong\"],[9],[0,\"Nome:\"],[10],[0,\" \"],[1,[23,[\"model\",\"record\",\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"site-contact-email\"],[9],[0,\"\\n            \"],[7,\"strong\"],[9],[0,\"Email:\"],[10],[0,\" \"],[1,[23,[\"model\",\"record\",\"email\"]],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"site-contact-phone\"],[9],[0,\"\\n            \"],[7,\"strong\"],[9],[0,\"Telefone:\"],[10],[0,\" \"],[1,[23,[\"model\",\"record\",\"phone\"]],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"site-contact-message\"],[9],[0,\"\\n            \"],[7,\"div\"],[9],[7,\"strong\"],[9],[0,\"Mensagem:\"],[10],[10],[0,\"\\n            \"],[7,\"pre\"],[9],[1,[23,[\"model\",\"record\",\"message\"]],false],[10],[0,\"          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\\n        \"],[7,\"div\"],[9],[0,\"\\n\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"isClosed\"]]],null,{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeStatus\",[23,[\"model\",\"record\"]],\"opened\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-unchecked text-danger\"],[9],[10],[0,\"\\n            Marcar como pendente\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeStatus\",[23,[\"model\",\"record\"]],\"closed\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-check text-success\"],[9],[10],[0,\"\\n            Resolver\\n\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"site-contacts.index\"]],[9],[0,\"\\n            \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n            Ir para a lista\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/site-contacts/item.hbs" } });
});
;define("we-admin-hotel/templates/site-contacts/menu-local", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jpH6W8UP", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Mensagens de contato do site\"],[10],[0,\"\\n\\n\"],[7,\"ul\"],[11,\"class\",\"nav nav-tabs\"],[9],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[11,\"class\",\"active\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"site-contacts.index\"],null,{\"statements\":[[0,\"      Mensagens\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"role\",\"presentation\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"site-contact-forms.index\"],null,{\"statements\":[[0,\"      Assuntos\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/site-contacts/menu-local.hbs" } });
});
;define("we-admin-hotel/templates/sitecontact-form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "uYDWHa2T", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/sitecontact-form.hbs" } });
});
;define("we-admin-hotel/templates/slides/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "5vIC6a8r", "block": "{\"symbols\":[],\"statements\":[[15,\"slides/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/slides/create.hbs" } });
});
;define("we-admin-hotel/templates/slides/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TYBcWBH8", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Editar slide #\"],[1,[23,[\"model\",\"record\",\"id\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Adicionar slide\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Título*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"title\"]],\"form-control\",\"Digite o título do slide aqui...\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Link*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"link\"]],\"form-control\",\"Digite o link do slide aqui...\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Texto do link*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"linkText\"]],\"form-control\",\"Digite o texto do link aqui...\",\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"imagem*:\"],[10],[0,\"\\n              \"],[1,[27,\"image-uploader\",null,[[\"value\"],[[23,[\"model\",\"record\",\"image\"]]]]],false],[0,\"\\n            \"],[10],[0,\"\\n\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"Descrição:\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\"],[[23,[\"model\",\"record\",\"description\"]],\"form-control\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4\"],[9],[0,\"\\n\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.publish.Title\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"\\n                \"],[1,[27,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[23,[\"model\",\"record\",\"published\"]]]]],false],[0,\" \"],[1,[27,\"t\",[\"form-content-published\"],null],false],[0,\"?\\n              \"],[10],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"publishedAt\"]]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n                  \"],[7,\"strong\"],[9],[0,\"Publicado em:\"],[10],[0,\" \"],[1,[27,\"moment-format\",[[23,[\"model\",\"record\",\"publishedAt\"]],\"DD/MM/YYYY h:mm a\"],null],false],[0,\"\\n                \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"footer-actions\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"slides.index\"]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n          Slides\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/slides/form.hbs" } });
});
;define("we-admin-hotel/templates/slides/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "xCJ2gziY", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"Slideshow\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"slides.create\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" Adicionar slide\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\",\"changePublishedStatus\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\",\"changePublishedStatus\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/slides/index.hbs" } });
});
;define("we-admin-hotel/templates/slides/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "AcnuAw+H", "block": "{\"symbols\":[],\"statements\":[[15,\"slides/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/slides/item.hbs" } });
});
;define("we-admin-hotel/templates/url-alia/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GBRsWVwF", "block": "{\"symbols\":[],\"statements\":[[15,\"url-alia/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/url-alia/create.hbs" } });
});
;define("we-admin-hotel/templates/url-alia/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "7FHsuvPK", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"\\n  \"],[1,[27,\"t\",[\"urlAlias.create\"],[[\"target\"],[[23,[\"model\",\"record\",\"target\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"urlAlias.create\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"fieldset\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-urlAlias-alias\"],null],false],[0,\"*:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"alias\"]],\"form-control\",[27,\"t\",[\"form-placeholder-urlAlias-alias\"],null],\"required\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n      \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-urlAlias-target\"],null],false],[0,\"*:\"],[10],[0,\"\\n      \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"target\"]],\"form-control\",[27,\"t\",[\"form-placeholder-urlAlias-target\"],null],\"required\"]]],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n      \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"url-alia.index\"]],[9],[0,\"\\n      \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n      \"],[1,[27,\"t\",[\"urlAlias.find\"],null],false],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/url-alia/form.hbs" } });
});
;define("we-admin-hotel/templates/url-alia/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZhBYoD70", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"urlAlias.find\"],null],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"url-alia.create\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"urlAlias.create\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/url-alia/index.hbs" } });
});
;define("we-admin-hotel/templates/url-alia/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "YnUE+Hgg", "block": "{\"symbols\":[],\"statements\":[[15,\"url-alia/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/url-alia/item.hbs" } });
});
;define("we-admin-hotel/templates/url-alia/list-item-actions", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "+ihBwe05", "block": "{\"symbols\":[],\"statements\":[[4,\"link-to\",[\"url-alia.item\",[23,[\"record\",\"id\"]]],[[\"class\"],[\"btn btn-default btn-sm\"]],{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-pencil text-success\"],[9],[10],[0,\"\\n  \"],[1,[27,\"t\",[\"Edit\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"button\"],[11,\"class\",\"btn btn-default btn-sm\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"deleteRecord\",[23,[\"record\"]]]],[9],[0,\"\\n  \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-remove text-danger\"],[9],[10],[0,\"\\n  \"],[1,[27,\"t\",[\"Delete\"],null],false],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/url-alia/list-item-actions.hbs" } });
});
;define("we-admin-hotel/templates/users/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DMA4kmmU", "block": "{\"symbols\":[\"locale\"],\"statements\":[[7,\"div\"],[11,\"class\",\"content-box-large\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"\\n    \"],[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"user.create\"],null],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n    \"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"create\",[23,[\"model\",\"user\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-displayName\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"user\",\"displayName\"]],\"form-control\",[27,\"t\",[\"form-placeholder-user-displayName\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-fullName\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"user\",\"fullName\"]],\"form-control\",\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-email\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"user\",\"email\"]],\"form-control\",[27,\"t\",[\"form-placeholder-user-email\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-biography\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"rows\"],[[23,[\"model\",\"user\",\"biography\"]],\"form-control\",\"4\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-language\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"onchange\"],[[23,[\"settings\",\"data\",\"locales\"]],[23,[\"model\",\"user\",\"language\"]],false,[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"user\",\"language\"]]],null]],null]]],{\"statements\":[[0,\"            \"],[1,[22,1,[]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"        \"],[10],[0,\"\\n\\n        \"],[1,[27,\"input\",null,[[\"value\",\"type\",\"value\"],[[23,[\"model\",\"user\",\"active\"]],\"hidden\",true]]],false],[0,\"\\n\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/users/create.hbs" } });
});
;define("we-admin-hotel/templates/users/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "gIMWZ2PE", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"user.find\"],null],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[4,\"acl-btn-create\",null,[[\"model\",\"url\"],[\"user\",\"/users/create\"]],{\"statements\":[[1,[27,\"t\",[\"Register\"],null],false]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"users\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/users/index.hbs" } });
});
;define("we-admin-hotel/templates/users/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "95fRBPZB", "block": "{\"symbols\":[\"tab\",\"role\",\"locale\"],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"user.edit\"],[[\"username\"],[[23,[\"model\",\"user\",\"displayName\"]]]]],false],[10],[0,\"\\n\\n\"],[4,\"bs-tab\",null,[[\"activeId\"],[[23,[\"model\",\"tab\"]]]],{\"statements\":[[4,\"component\",[[22,1,[\"pane\"]]],[[\"elementId\",\"title\"],[\"userTabPaneData\",[27,\"t\",[\"user.Data\"],null]]],{\"statements\":[[0,\"    \"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"user\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-displayName\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"autocomplete\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"user\",\"displayName\"]],\"displayName\",\"form-control\",[27,\"t\",[\"form-placeholder-user-displayName\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-fullName\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"required\"],[[23,[\"model\",\"user\",\"fullName\"]],\"form-control\",\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-email\"],null],false],[0,\"*:\"],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"autocomplete\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"user\",\"email\"]],\"email\",\"form-control\",[27,\"t\",[\"form-placeholder-user-email\"],null],\"required\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-biography\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"textarea\",null,[[\"value\",\"autocomplete\",\"class\",\"rows\"],[[23,[\"model\",\"user\",\"biography\"]],\"biography\",\"form-control\",\"4\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-language\"],null],false],[0,\":\"],[10],[0,\"\\n\"],[4,\"power-select\",null,[[\"options\",\"selected\",\"searchEnabled\",\"onchange\"],[[23,[\"settings\",\"data\",\"locales\"]],[23,[\"model\",\"user\",\"language\"]],false,[27,\"action\",[[22,0,[]],[27,\"mut\",[[23,[\"model\",\"user\",\"language\"]]],null]],null]]],{\"statements\":[[0,\"            \"],[1,[22,3,[]],false],[0,\"\\n\"]],\"parameters\":[3]},null],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-user-avatar\"],null],false],[0,\":\"],[10],[0,\"\\n          \"],[1,[27,\"image-uploader\",null,[[\"value\",\"multiple\"],[[23,[\"model\",\"user\",\"avatar\"]],false]]],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n\\n        \"],[7,\"div\"],[11,\"class\",\"pull-right\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"user\",\"blocked\"]]],null,{\"statements\":[[0,\"            \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeBlockStatus\",[23,[\"model\",\"user\"]],false]],[9],[0,\"\\n              \"],[1,[27,\"t\",[\"Un Block\"],null],false],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[7,\"button\"],[11,\"class\",\"btn btn-danger\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeBlockStatus\",[23,[\"model\",\"user\"]],true]],[9],[0,\"\\n              \"],[1,[27,\"t\",[\"Block\"],null],false],[0,\"\\n            \"],[10],[0,\"\\n          \"]],\"parameters\":[]}],[0,\" \"],[4,\"if\",[[23,[\"model\",\"user\",\"active\"]]],null,{\"statements\":[[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"btn btn-warning\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeActiveStatus\",[23,[\"model\",\"user\"]],false]],[9],[0,\"\\n              \"],[1,[27,\"t\",[\"Disable\"],null],false],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[7,\"button\"],[11,\"class\",\"btn btn-success\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"changeActiveStatus\",[23,[\"model\",\"user\"]],true]],[9],[0,\"\\n              \"],[1,[27,\"t\",[\"Enable\"],null],false],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"pane\"]]],[[\"elementId\",\"title\"],[\"userTabPanePassword\",[27,\"t\",[\"auth.Password-and-login\"],null]]],{\"statements\":[[0,\"    \"],[7,\"h4\"],[9],[1,[27,\"t\",[\"auth.change-password\"],null],false],[10],[0,\"\\n    \"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"changePassword\",[23,[\"model\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n      \"],[7,\"fieldset\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-change-password-newPassword\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"type\"],[[23,[\"model\",\"newPassword\"]],\"form-control\",[27,\"t\",[\"form-placeholder-change-password-newPassword\"],null],\"required\",\"password\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n          \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-change-password-rNewPassword\"],null],false],[10],[0,\"\\n          \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\",\"type\"],[[23,[\"model\",\"rNewPassword\"]],\"form-control\",[27,\"t\",[\"form-placeholder-change-password-rNewPassword\"],null],\"required\",\"password\"]]],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[11,\"type\",\"submit\"],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n          \"],[1,[27,\"t\",[\"Send\"],null],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[22,1,[\"pane\"]]],[[\"elementId\",\"title\"],[\"userTabPaneRoles\",[27,\"t\",[\"roles.link\"],null]]],{\"statements\":[[0,\"    \"],[7,\"ul\"],[11,\"class\",\"list-group\"],[9],[0,\"\\n\"],[4,\"each\",[[23,[\"model\",\"roles\"]]],null,{\"statements\":[[4,\"if\",[[22,2,[\"canAddInUsers\"]]],null,{\"statements\":[[0,\"          \"],[7,\"li\"],[11,\"class\",\"list-group-item\"],[9],[0,\"\\n            \"],[1,[27,\"user-role-checkbox\",null,[[\"user\",\"roleId\",\"roleName\",\"class\",\"addUserRole\",\"removeUserRole\"],[[23,[\"model\",\"user\"]],[22,2,[\"id\"]],[22,2,[\"name\"]],\"btn btn-default\",\"addUserRole\",\"removeUserRole\"]]],false],[0,\"\\n            \"],[1,[22,2,[\"name\"]],false],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[2]},null],[0,\"    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/users/item.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lWvNWgy2", "block": "{\"symbols\":[],\"statements\":[[15,\"vocabulary/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/create.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zZ94eqwx", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[0,\"\\n  \"],[1,[27,\"t\",[\"vocabulary.edit\"],[[\"name\"],[[23,[\"model\",\"record\",\"name\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"vocabulary.create\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-vocabulary-name\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"name\"]],\"form-control\",[27,\"t\",[\"form-placeholder-vocabulary-name\"],null],\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-vocabulary-description\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"model\",\"record\",\"description\"]],\"form-control\",[27,\"t\",[\"form-placeholder-vocabulary-description\"],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4 main-sidebar\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"URL\"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL/caminho de acesso à página, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"vocabulary.index\"]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"vocabulary.find\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n  \"],[10],[0,\"\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/form.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "8+DqLNEi", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"vocabulary.find\"],null],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"vocabulary.create\"],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"vocabulary.create\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/index.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cVH22DJq", "block": "{\"symbols\":[],\"statements\":[[1,[21,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ZS54ESfv", "block": "{\"symbols\":[],\"statements\":[[15,\"vocabulary/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item/index.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item/terms/create", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "mVNG/D/D", "block": "{\"symbols\":[],\"statements\":[[15,\"vocabulary/item/terms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item/terms/create.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item/terms/form", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "m+CWmcJ1", "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"term.edit\"],[[\"text\"],[[23,[\"model\",\"record\",\"text\"]]]]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"term.create\"],null],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[7,\"form\"],[3,\"action\",[[22,0,[]],\"save\",[23,[\"model\",\"record\"]],[23,[\"model\",\"alias\"]]],[[\"on\"],[\"submit\"]]],[9],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-8\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[1,[27,\"t\",[\"content.form.terms.Data\"],null],false],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n          \"],[7,\"fieldset\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-term-text\"],null],false],[0,\"*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"value\",\"class\",\"placeholder\",\"required\"],[[23,[\"model\",\"record\",\"text\"]],\"form-control\",[27,\"t\",[\"form-placeholder-term-text\"],null],\"required\"]]],false],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[1,[27,\"t\",[\"form-term-description\"],null],false],[0,\":\"],[10],[0,\"\\n              \"],[1,[27,\"textarea\",null,[[\"value\",\"class\",\"placeholder\"],[[23,[\"model\",\"record\",\"description\"]],\"form-control\",[27,\"t\",[\"form-placeholder-term-description\"],null]]]],false],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-4 main-sidebar\"],[9],[0,\"\\n\"],[4,\"if\",[[23,[\"model\",\"record\",\"id\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"panel panel-default\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-heading\"],[9],[0,\"URL\"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"panel-body\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"form-group\"],[9],[0,\"\\n              \"],[7,\"label\"],[9],[0,\"URL de acesso*:\"],[10],[0,\"\\n              \"],[1,[27,\"input\",null,[[\"name\",\"value\",\"class\",\"placeholder\"],[\"setAlias\",[23,[\"model\",\"alias\",\"alias\"]],\"form-control\",\"Ex /sobre\"]]],false],[0,\"\\n              \"],[7,\"p\"],[11,\"class\",\"help-block\"],[9],[0,\"URL/caminho de acesso à página, use um texto simples sem espaço ou acentuação. Ex /sobre\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-12\"],[9],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-primary\"],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-save\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"Save\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"button\"],[11,\"class\",\"btn btn-default\"],[11,\"type\",\"button\"],[3,\"action\",[[22,0,[]],\"goTo\",\"vocabulary.item.terms\",[23,[\"model\",\"vocabulary\",\"id\"]]]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-step-backward\"],[9],[10],[0,\"\\n        \"],[1,[27,\"t\",[\"term.find\"],null],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n\"],[10]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item/terms/form.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item/terms/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lEYEYfG5", "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[11,\"class\",\"page-header\"],[9],[1,[27,\"t\",[\"term.find\"],null],false],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"actions\"],[9],[0,\"\\n\"],[4,\"link-to\",[\"vocabulary.item.terms.create\",[23,[\"model\",\"vocabulary\",\"id\"]]],[[\"class\"],[\"btn btn-default\"]],{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"glyphicon glyphicon-plus\"],[9],[10],[0,\" \"],[1,[27,\"t\",[\"term.create\"],null],false],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"br\"],[9],[10],[0,\"\\n\\n\"],[1,[27,\"conteudos-table\",null,[[\"data\",\"columns\",\"pageSize\",\"useFilteringByColumns\",\"deleteRecord\"],[[23,[\"model\",\"records\"]],[23,[\"model\",\"columns\"]],25,false,\"deleteRecord\"]]],false],[0,\"\\n\"]],\"hasEval\":false}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item/terms/index.hbs" } });
});
;define("we-admin-hotel/templates/vocabulary/item/terms/item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TS8Xr8Rh", "block": "{\"symbols\":[],\"statements\":[[15,\"vocabulary/item/terms/form\",[]]],\"hasEval\":true}", "meta": { "moduleName": "we-admin-hotel/templates/vocabulary/item/terms/item.hbs" } });
});
;define('we-admin-hotel/themes/bootstrap3', ['exports', 'ember-models-table/themes/bootstrap3'], function (exports, _bootstrap) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bootstrap.default;
    }
  });
});
;define('we-admin-hotel/themes/bootstrap4', ['exports', 'ember-models-table/themes/bootstrap4'], function (exports, _bootstrap) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _bootstrap.default;
    }
  });
});
;define('we-admin-hotel/themes/default', ['exports', 'ember-models-table/themes/default'], function (exports, _default) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _default.default;
    }
  });
});
;define('we-admin-hotel/themes/semanticui', ['exports', 'ember-models-table/themes/semanticui'], function (exports, _semanticui) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _semanticui.default;
    }
  });
});
;define('we-admin-hotel/transforms/array', ['exports', 'ember-data'], function (exports, _emberData) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberData.default.Transform.extend({
    deserialize(serialized) {
      return Ember.typeOf(serialized) === "array" ? Ember.A(serialized) : Ember.A();
    },

    serialize(deserialized) {
      let type = Ember.typeOf(deserialized);
      if (type === 'array') {
        return Ember.A(deserialized);
      } else if (type === 'string') {
        return Ember.A(deserialized.split(',').map(function (item) {
          return Ember.$.trim(item);
        }));
      } else {
        return Ember.A();
      }
    }
  });
});
;define('we-admin-hotel/uploaders/s3', ['exports', 'ember-uploader/uploaders/s3'], function (exports, _s) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _s.default;
    }
  });
});
;define('we-admin-hotel/uploaders/uploader', ['exports', 'ember-uploader/uploaders/uploader'], function (exports, _uploader) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _uploader.default;
    }
  });
});
;define('we-admin-hotel/utils/fmt', ['exports', 'ember-models-table/utils/fmt'], function (exports, _fmt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _fmt.default;
    }
  });
});
;define('we-admin-hotel/utils/i18n/compile-template', ['exports', 'ember-i18n/utils/i18n/compile-template'], function (exports, _compileTemplate) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _compileTemplate.default;
    }
  });
});
;define('we-admin-hotel/utils/i18n/missing-message', ['exports', 'ember-i18n/utils/i18n/missing-message'], function (exports, _missingMessage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _missingMessage.default;
    }
  });
});
;define('we-admin-hotel/utils/titleize', ['exports', 'ember-cli-string-helpers/utils/titleize'], function (exports, _titleize) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _titleize.default;
    }
  });
});
;

;define('we-admin-hotel/config/environment', [], function() {
  var prefix = 'we-admin-hotel';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

;
          if (!runningTests) {
            require("we-admin-hotel/app")["default"].create({"usingCors":false,"corsWithCreds":false,"apiURL":null,"name":"we-admin-hotel","version":"0.0.0+e1e9082e"});
          }
        
//# sourceMappingURL=we-admin-hotel.map
