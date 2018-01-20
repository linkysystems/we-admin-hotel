import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('d-form-fields-sort-list', 'Integration | Component | d form fields sort list', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{d-form-fields-sort-list}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#d-form-fields-sort-list}}
      template block text
    {{/d-form-fields-sort-list}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
