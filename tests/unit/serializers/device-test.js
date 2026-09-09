import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';
import { snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | device', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('device');
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

    module('serializePolymorphicType', function () {
        test('a non-attachable relationship is handed to the application serializer untouched', function (assert) {
            const json = {};

            this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'telematic' } }), json, { key: 'telematic' });

            assert.strictEqual(json.telematic_type, 'telematic', 'the inherited implementation types it, without the fleet-ops prefix this serializer adds for attachables');
        });

        test('the attachable type is derived from the related record, without the local prefix', function (assert) {
            for (const [modelName, expected] of Object.entries({ 'attachable-vehicle': 'vehicle', 'attachable-asset': 'asset', vehicle: 'vehicle' })) {
                const json = {};

                this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName } }), json, { key: 'attachable' });

                assert.strictEqual(json.attachable_type, `fleet-ops:${expected}`, `${modelName} is sent as fleet-ops:${expected}`);
            }
        });

        test('an explicitly chosen attachable type is left untouched', function (assert) {
            const json = {};

            this.serializer.serializePolymorphicType(snapshotStub({ attrs: { attachable_type: 'Fleetbase\\Models\\Vehicle' }, belongsTo: { modelName: 'attachable-asset' } }), json, {
                key: 'attachable',
            });

            assert.deepEqual(json, {}, 'a device that already knows its own domain type keeps it');
        });

        test('an unset attachable clears the type rather than leaving it stale', function (assert) {
            const json = {};

            this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: null }), json, { key: 'attachable' });

            assert.strictEqual(json.attachable_type, null);
        });

        test('a non-string model name is passed through rather than crashing the prefix strip', function (assert) {
            const json = {};

            this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 42 } }), json, { key: 'attachable' });

            assert.strictEqual(json.attachable_type, 'fleet-ops:42');
        });

        test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
            const json = {};
            const bare = Object.create(null);
            bare.serializePolymorphicType = this.serializer.serializePolymorphicType;

            bare.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'attachable-vehicle' } }), json, { key: 'attachable' });

            assert.strictEqual(json.attachable_type, 'fleet-ops:vehicle');
        });
    });

    module('attachableModelNameFromType', function () {
        test('a Fleetbase PHP class name resolves to the local attachable subtype', function (assert) {
            assert.strictEqual(this.serializer.attachableModelNameFromType('Fleetbase\\FleetOps\\Models\\Vehicle'), 'attachable-vehicle');
            assert.strictEqual(this.serializer.attachableModelNameFromType('Fleetbase\\FleetOps\\Models\\Asset'), 'attachable-asset');
        });

        test('the fleet-ops and attachable prefixes are both accepted', function (assert) {
            assert.strictEqual(this.serializer.attachableModelNameFromType('fleet-ops:vehicle'), 'attachable-vehicle');
            assert.strictEqual(this.serializer.attachableModelNameFromType('attachable-asset'), 'attachable-asset');
        });

        test('a type outside the supported set is not resolved', function (assert) {
            assert.strictEqual(this.serializer.attachableModelNameFromType('Fleetbase\\Models\\Driver'), undefined);
            assert.strictEqual(this.serializer.attachableModelNameFromType('trailer'), undefined);
        });

        test('a missing or non-string type is not resolved', function (assert) {
            assert.strictEqual(this.serializer.attachableModelNameFromType(), undefined);
            assert.strictEqual(this.serializer.attachableModelNameFromType(''), undefined);
            assert.strictEqual(this.serializer.attachableModelNameFromType(42), undefined);
        });
    });

    module('restoring the domain type after normalization', function () {
        test('an unsupported attachable type is written back onto the included record', function (assert) {
            const normalized = this.serializer.normalize(this.store.modelFor('device'), {
                uuid: 'device_1',
                attachable_type: 'Fleetbase\\FleetOps\\Models\\Vehicle',
                attachable: { uuid: 'veh_1', type: 'Fleetbase\\FleetOps\\Models\\Trailer', name: 'Trailer 1' },
            });

            const included = normalized.included.find((resource) => resource.id === 'veh_1');

            assert.strictEqual(included.attributes.type, 'Fleetbase\\FleetOps\\Models\\Trailer', 'the original domain type survives normalization');
        });

        test('a supported attachable type is left as the normalized model name', function (assert) {
            const normalized = this.serializer.normalize(this.store.modelFor('device'), {
                uuid: 'device_2',
                attachable_type: 'Fleetbase\\FleetOps\\Models\\Vehicle',
                attachable: { uuid: 'veh_2', type: 'vehicle', name: 'Van 1' },
            });

            assert.strictEqual(normalized.data.relationships.attachable.data.type, 'attachable-vehicle');
        });

        test('a device with no attachable normalizes without inventing one', function (assert) {
            const normalized = this.serializer.normalize(this.store.modelFor('device'), { uuid: 'device_3', name: 'Gateway' });

            assert.notOk(normalized.data.relationships.attachable);
        });

        test('restoring is skipped when the normalized payload has no matching included record', function (assert) {
            const normalized = { data: { relationships: { attachable: { data: { type: 'attachable-vehicle', id: 'veh_9' } } } }, included: [] };

            this.serializer.restoreAttachableDomainType(normalized, 'Fleetbase\\FleetOps\\Models\\Trailer');

            assert.deepEqual(normalized.included, [], 'nothing is fabricated');
        });

        test('restoring is skipped when there is no attachable relationship at all', function (assert) {
            const normalized = { data: { relationships: {} } };

            this.serializer.restoreAttachableDomainType(normalized, 'Fleetbase\\FleetOps\\Models\\Trailer');

            assert.deepEqual(normalized, { data: { relationships: {} } });
        });

        test('a supported or missing type never triggers a restore', function (assert) {
            assert.false(this.serializer.shouldRestoreAttachableDomainType('vehicle'));
            assert.false(this.serializer.shouldRestoreAttachableDomainType());
            assert.false(this.serializer.shouldRestoreAttachableDomainType(42));
            assert.true(this.serializer.shouldRestoreAttachableDomainType('Fleetbase\\FleetOps\\Models\\Trailer'));
        });
    });

    test('the domain type is restored onto an included record that carries no attributes', function (assert) {
        const normalized = {
            data: { relationships: { attachable: { data: { type: 'attachable-vehicle', id: 'veh_1' } } } },
            included: [{ type: 'attachable-vehicle', id: 'veh_1' }],
        };

        this.serializer.restoreAttachableDomainType(normalized, 'Fleetbase\\FleetOps\\Models\\Trailer');

        assert.deepEqual(normalized.included[0].attributes, { type: 'Fleetbase\\FleetOps\\Models\\Trailer' }, 'an attributes object is created rather than crashing');
    });
});
