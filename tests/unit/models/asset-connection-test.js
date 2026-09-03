import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | asset-connection', function (hooks) {
    setupTest(hooks);

    test('it represents an effective-dated towing relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const connection = store.createRecord('asset-connection', { relationship_type: 'towing', active: true, position: 1 });

        assert.strictEqual(connection.relationship_type, 'towing');
        assert.true(connection.active);
        assert.strictEqual(connection.position, 1);
    });
});
