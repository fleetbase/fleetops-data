import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | asset-connection', function (hooks) {
    setupTest(hooks);

    test('it serializes connection metadata', function (assert) {
        const store = this.owner.lookup('service:store');
        const serialized = store.createRecord('asset-connection', { relationship_type: 'towing', source: 'manual' }).serialize();

        assert.strictEqual(serialized.relationship_type, 'towing');
        assert.strictEqual(serialized.source, 'manual');
    });
});
