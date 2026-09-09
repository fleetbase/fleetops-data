import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | attachable-driver', function (hooks) {
    setupTest(hooks);

    test('it resolves equipment issued to a driver through the attachable family', function (assert) {
        const store = this.owner.lookup('service:store');
        const driver = store.createRecord('attachable-driver', { name: 'Dana Driver', internal_id: 'DRV-1' });

        assert.strictEqual(driver.displayName, 'Dana Driver');
        assert.strictEqual(driver.internal_id, 'DRV-1');
    });
});
