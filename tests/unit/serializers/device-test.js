import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | device', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('device');

        assert.ok(serializer);
    });

    test('it serializes records', function (assert) {
        let store = this.owner.lookup('service:store');
        let record = store.createRecord('device', {});

        let serializedRecord = record.serialize();

        assert.ok(serializedRecord);
    });

    test('it normalizes an embedded vehicle attachable relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('device');
        const modelClass = store.modelFor('device');

        const normalized = serializer.normalize(modelClass, {
            uuid: 'device-1',
            public_id: 'device_1',
            attachable_uuid: 'vehicle-1',
            attachable_type: 'fleet-ops:vehicle',
            attachable: {
                uuid: 'vehicle-1',
                public_id: 'vehicle_1',
                display_name: 'Truck 100',
            },
        });

        assert.strictEqual(normalized.data.relationships.attachable.data.type, 'attachable-vehicle');
        assert.strictEqual(normalized.data.relationships.attachable.data.id, 'vehicle-1');
    });

    test('it normalizes an embedded asset attachable relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('device');
        const modelClass = store.modelFor('device');

        const normalized = serializer.normalize(modelClass, {
            uuid: 'device-1',
            public_id: 'device_1',
            attachable_uuid: 'asset-1',
            attachable_type: 'fleet-ops:asset',
            attachable: {
                uuid: 'asset-1',
                public_id: 'asset_1',
                name: 'Cold Chain Pallet',
            },
        });

        assert.strictEqual(normalized.data.relationships.attachable.data.type, 'attachable-asset');
        assert.strictEqual(normalized.data.relationships.attachable.data.id, 'asset-1');
    });

    test('it normalizes a PHP vehicle attachable type without treating vehicle kind as model type', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('device');
        const modelClass = store.modelFor('device');

        const normalized = serializer.normalize(modelClass, {
            uuid: 'device-1',
            public_id: 'device_1',
            attachable_uuid: 'vehicle-1',
            attachable_type: 'Fleetbase\\FleetOps\\Models\\Vehicle',
            attachable: {
                uuid: 'vehicle-1',
                public_id: 'vehicle_1',
                display_name: 'Van 100',
                type: 'van',
            },
        });

        const attachable = normalized.data.relationships.attachable.data;
        const included = normalized.included.find((resource) => resource.type === attachable.type && resource.id === attachable.id);

        assert.strictEqual(attachable.type, 'attachable-vehicle');
        assert.strictEqual(attachable.id, 'vehicle-1');
        assert.strictEqual(included.attributes.type, 'van');
    });

    test('it normalizes a PHP asset attachable type', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('device');
        const modelClass = store.modelFor('device');

        const normalized = serializer.normalize(modelClass, {
            uuid: 'device-1',
            public_id: 'device_1',
            attachable_uuid: 'asset-1',
            attachable_type: 'Fleetbase\\FleetOps\\Models\\Asset',
            attachable: {
                uuid: 'asset-1',
                public_id: 'asset_1',
                name: 'Cold Chain Pallet',
            },
        });

        assert.strictEqual(normalized.data.relationships.attachable.data.type, 'attachable-asset');
        assert.strictEqual(normalized.data.relationships.attachable.data.id, 'asset-1');
    });

    test('it serializes attachable vehicle type for polymorphic mutations', function (assert) {
        const store = this.owner.lookup('service:store');
        const vehicle = store.push({
            data: {
                type: 'attachable-vehicle',
                id: 'vehicle-1',
                attributes: {
                    display_name: 'Truck 100',
                },
            },
        });
        const device = store.createRecord('device', { attachable: vehicle });

        const serialized = device.serialize();

        assert.strictEqual(serialized.attachable_uuid, 'vehicle-1');
        assert.strictEqual(serialized.attachable_type, 'fleet-ops:vehicle');
    });
});
