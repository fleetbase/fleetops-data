import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | trailer', function (hooks) {
    setupTest(hooks);

    test('it embeds Trailer relationships without writing read-only projections', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('trailer');

        assert.ok(serializer);
        assert.strictEqual(serializer.attrs.vendor.embedded, 'always');
        assert.strictEqual(serializer.attrs.category.embedded, 'always');
        assert.strictEqual(serializer.attrs.current_vehicle.serialize, false);
        assert.strictEqual(serializer.attrs.connections.serialize, false);
        assert.strictEqual(serializer.attrs.devices.serialize, false);
        assert.strictEqual(serializer.attrs.equipments.serialize, false);
    });

    test('it normalizes a `trailers` collection envelope into an array of Trailer records', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('trailer');
        const payload = {
            trailers: [
                { id: 'trailer-1', uuid: 'trailer-1', public_id: 'trailer_one', name: 'Reefer 12', type: 'reefer', status: 'available', attachment_state: 'detached' },
                { id: 'trailer-2', uuid: 'trailer-2', public_id: 'trailer_two', name: 'Flatbed 3', type: 'flatbed', status: 'in_use', attachment_state: 'attached' },
            ],
            meta: { total: 2, current_page: 1, last_page: 1 },
        };

        const normalized = serializer.normalizeResponse(store, store.modelFor('trailer'), payload, null, 'query');

        assert.ok(Array.isArray(normalized.data), 'query responses normalize to an array');
        assert.strictEqual(normalized.data.length, 2);
        assert.deepEqual(
            normalized.data.map((resource) => resource.type),
            ['trailer', 'trailer']
        );
        assert.strictEqual(normalized.data[0].attributes.attachment_state, 'detached');
        assert.deepEqual(normalized.meta, { total: 2, current_page: 1, last_page: 1 });
    });

    test('it normalizes an empty `trailers` collection to an empty array', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('trailer');

        const normalized = serializer.normalizeResponse(store, store.modelFor('trailer'), { trailers: [], meta: { total: 0 } }, null, 'query');

        assert.deepEqual(normalized.data, []);
    });

    test('it normalizes a single `trailer` record envelope with embedded connection state', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('trailer');
        const payload = {
            trailer: {
                id: 'trailer-1',
                uuid: 'trailer-1',
                public_id: 'trailer_one',
                name: 'Reefer 12',
                current_vehicle: { id: 'vehicle-1', uuid: 'vehicle-1', public_id: 'vehicle_one', name: 'Truck 1' },
                current_connection: { id: 'connection-1', uuid: 'connection-1', public_id: 'connection_one', relationship_type: 'towing', position: 1, active: true },
                connections: [{ id: 'connection-1', uuid: 'connection-1', public_id: 'connection_one', relationship_type: 'towing', position: 1, active: true }],
            },
        };

        const normalized = serializer.normalizeResponse(store, store.modelFor('trailer'), payload, 'trailer-1', 'findRecord');

        assert.strictEqual(normalized.data.type, 'trailer');
        assert.strictEqual(normalized.data.relationships.current_vehicle.data.id, 'vehicle-1');
        assert.strictEqual(normalized.data.relationships.current_connection.data.type, 'asset-connection');
        assert.strictEqual(normalized.data.relationships.connections.data.length, 1);
        assert.ok(normalized.included.some((resource) => resource.type === 'vehicle' && resource.id === 'vehicle-1'));
    });
});
