import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('mt-actions-d-form', 'Integration | Component | mt actions d form', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{mt-actions-d-form}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#mt-actions-d-form}}
      template block text
    {{/mt-actions-d-form}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
