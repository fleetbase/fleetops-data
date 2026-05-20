import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | order', function (hooks) {
    setupTest(hooks);

    // Replace this with your real tests.
    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('order', {});
        assert.ok(model);
    });

    test('order config is embedded synchronously', function (assert) {
        let store = this.owner.lookup('service:store');
        let relationship = store.modelFor('order').relationshipsByName.get('order_config');

        assert.strictEqual(relationship.options.async, false);
    });
});
