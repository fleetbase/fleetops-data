import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | facilitator driver', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('facilitator-driver', {
            name: 'Test Driver',
            public_id: 'driver_test',
        });

        assert.ok(model);
        assert.strictEqual(model.displayName, 'Test Driver');
    });
});
