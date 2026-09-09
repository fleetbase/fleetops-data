import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | vehicle', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('vehicle');

        assert.ok(serializer);
    });

    test('it serializes records', function (assert) {
        let store = this.owner.lookup('service:store');
        let record = store.createRecord('vehicle', {});

        let serializedRecord = record.serialize();

        assert.ok(serializedRecord);
    });

    test('it embeds the devices and current trailers the live feed sends with each vehicle', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('vehicle');

        assert.strictEqual(serializer.attrs.devices.embedded, 'always');
        assert.strictEqual(serializer.attrs.trailers.embedded, 'always');

        const payload = {
            vehicle: {
                id: 'vehicle-1',
                uuid: 'vehicle-1',
                public_id: 'vehicle_one',
                name: 'Truck 1',
                devices: [{ id: 'device-1', uuid: 'device-1', public_id: 'device_one', name: 'Tracker', online: true }],
                trailers: [{ id: 'trailer-1', uuid: 'trailer-1', public_id: 'trailer_one', name: 'Reefer 12', type: 'reefer', attachment_state: 'attached', online: false }],
            },
        };

        const normalized = serializer.normalizeResponse(store, store.modelFor('vehicle'), payload, 'vehicle-1', 'findRecord');
        const includedTypes = normalized.included.map((resource) => resource.type);

        assert.deepEqual(normalized.data.relationships.trailers.data, [{ id: 'trailer-1', type: 'trailer' }]);
        assert.deepEqual(normalized.data.relationships.devices.data, [{ id: 'device-1', type: 'device' }]);
        assert.ok(includedTypes.includes('trailer'), 'embedded trailers are pushed alongside the vehicle');
        assert.ok(includedTypes.includes('device'), 'embedded devices are pushed alongside the vehicle');
    });
});
