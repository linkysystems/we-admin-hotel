import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('mt-actions-hotel-events', 'Integration | Component | mt actions hotel events', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{mt-actions-hotel-events}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#mt-actions-hotel-events}}
      template block text
    {{/mt-actions-hotel-events}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
