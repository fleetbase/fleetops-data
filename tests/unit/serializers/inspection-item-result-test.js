import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | inspection-item-result', function (hooks) {
    setupTest(hooks);

    test('it is a plain Fleetbase application serializer keyed by uuid', function (assert) {
        const store = this.owner.lookup('service:store');

        assert.ok(store.serializerFor('inspection-item-result') instanceof ApplicationSerializer);
        assertPrimaryKeyIsUuid(assert, store, 'inspection-item-result');
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const result = assertNormalizesUuidAsId(assert, this.owner.lookup('service:store'), 'inspection-item-result', { item_key: 'brakes', passed: false });

        assert.strictEqual(result.item_key, 'brakes');
        assert.false(result.passed);
    });
});
