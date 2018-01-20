import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('menu-hotel-events-selector', 'Integration | Component | menu hotel events selector', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{menu-hotel-events-selector}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#menu-hotel-events-selector}}
      template block text
    {{/menu-hotel-events-selector}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
