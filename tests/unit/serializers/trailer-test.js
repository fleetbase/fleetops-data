import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | trailer', function (hooks) {
    setupTest(hooks);

    test('it embeds Trailer relationships without writing read-only projections', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('trailer');

        assert.ok(serializer);
        assert.strictEqual(serializer.attrs.vendor.embedded, 'always');
        assert.strictEqual(serializer.attrs.current_vehicle.serialize, false);
        assert.strictEqual(serializer.attrs.connections.serialize, false);
        assert.strictEqual(serializer.attrs.devices.serialize, false);
    });
});
