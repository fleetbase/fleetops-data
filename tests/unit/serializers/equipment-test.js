import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | equipment', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('equipment');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'equipment');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'equipment', {
            warranty: EMBEDDED,
            photo: EMBEDDED,
            equipable: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'equipment', { name: 'contract-value' });

        assert.strictEqual(record.name, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('equipment', { name: 'contract-value' });

        assert.strictEqual(record.serialize().name, 'contract-value');
    });

    test('the warranty relationship is linked by uuid when it is not embedded', function (assert) {
        const related = this.store.push(this.store.normalize('warranty', { uuid: 'related_1' }));
        const record = this.store.createRecord('equipment');
        record.set('warranty', related);

        assert.strictEqual(record.serialize().warranty_uuid, 'related_1', 'the application serializer always adds the identifier');
    });

    test('an unset warranty contributes no identifier', function (assert) {
        const json = this.store.createRecord('equipment').serialize();

        assert.notOk(json.warranty_uuid, 'a relationship that was never set is simply absent');
    });

    test('it supports polymorphic vehicle and trailer attachments', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('equipment');
        const normalized = serializer.normalize(store.modelFor('equipment'), {
            uuid: 'equipment-1',
            equipable_uuid: 'trailer-1',
            equipable_type: 'Fleetbase\\FleetOps\\Models\\Trailer',
            equipable: { uuid: 'trailer-1', public_id: 'trailer_1', name: 'Flatbed 1' },
        });

        assert.strictEqual(normalized.data.relationships.equipable.data.type, 'attachable-trailer');

        const json = {};
        serializer.serializePolymorphicType(
            {
                attr: () => undefined,
                belongsTo: () => ({ modelName: 'attachable-vehicle' }),
            },
            json,
            { key: 'equipable' }
        );

        assert.strictEqual(json.equipable_type, 'fleet-ops:vehicle');
    });

    test('it resolves equipment issued to a driver through the attachable-driver model', function (assert) {
        const store = this.owner.lookup('service:store');
        const serializer = store.serializerFor('equipment');
        const normalized = serializer.normalize(store.modelFor('equipment'), {
            uuid: 'equipment-2',
            equipable_uuid: 'driver-1',
            equipable_type: 'fleet-ops:driver',
            equipable: { uuid: 'driver-1', public_id: 'driver_1', name: 'Dana Driver' },
        });

        assert.strictEqual(normalized.data.relationships.equipable.data.type, 'attachable-driver');
        assert.ok(store.modelFor('attachable-driver'), 'the attachable-driver model exists for the store');
    });
});

module('Unit | Serializer | equipment | polymorphic equipable', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('equipment');
    });

    test('a non-equipable relationship is handed to the application serializer untouched', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'warranty' } }), json, { key: 'warranty' });

        assert.strictEqual(json.warranty_type, 'warranty', 'the inherited implementation types it, without the fleet-ops prefix this serializer adds for equipables');
    });

    test('the equipable type is derived from the related record, without the local prefix', function (assert) {
        for (const [modelName, expected] of Object.entries({ 'attachable-vehicle': 'vehicle', 'attachable-trailer': 'trailer', 'attachable-driver': 'driver', vehicle: 'vehicle' })) {
            const json = {};

            this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName } }), json, { key: 'equipable' });

            assert.strictEqual(json.equipable_type, `fleet-ops:${expected}`, `${modelName} is sent as fleet-ops:${expected}`);
        }
    });

    test('an explicitly chosen equipable type is left untouched', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ attrs: { equipable_type: 'fleet-ops:driver' }, belongsTo: { modelName: 'attachable-vehicle' } }), json, { key: 'equipable' });

        assert.deepEqual(json, {}, 'equipment that already knows its own domain type keeps it');
    });

    test('an unset equipable clears the type rather than leaving it stale', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: null }), json, { key: 'equipable' });

        assert.strictEqual(json.equipable_type, null);
    });

    test('a non-string model name is passed through rather than crashing the prefix strip', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 42 } }), json, { key: 'equipable' });

        assert.strictEqual(json.equipable_type, 'fleet-ops:42');
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};
        const bare = Object.create(null);
        bare.serializePolymorphicType = this.serializer.serializePolymorphicType;

        bare.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'attachable-trailer' } }), json, { key: 'equipable' });

        assert.strictEqual(json.equipable_type, 'fleet-ops:trailer');
    });

    module('equipableModelNameFromType', function () {
        test('PHP class names and prefixed types resolve to the attachable subtype', function (assert) {
            assert.strictEqual(this.serializer.equipableModelNameFromType('Fleetbase\\FleetOps\\Models\\Vehicle'), 'attachable-vehicle');
            assert.strictEqual(this.serializer.equipableModelNameFromType('Fleetbase\\FleetOps\\Models\\Trailer'), 'attachable-trailer');
            assert.strictEqual(this.serializer.equipableModelNameFromType('fleet-ops:driver'), 'attachable-driver');
            assert.strictEqual(this.serializer.equipableModelNameFromType('attachable-asset'), 'attachable-asset');
        });

        test('a type outside the supported set, or no type at all, is not resolved', function (assert) {
            assert.strictEqual(this.serializer.equipableModelNameFromType('Fleetbase\\FleetOps\\Models\\Place'), undefined);
            assert.strictEqual(this.serializer.equipableModelNameFromType(), undefined);
            assert.strictEqual(this.serializer.equipableModelNameFromType(''), undefined);
            assert.strictEqual(this.serializer.equipableModelNameFromType(42), undefined);
        });
    });

    module('restoring the domain type after normalization', function () {
        test('an unsupported equipable type is written back onto the included record', function (assert) {
            const normalized = this.serializer.normalize(this.store.modelFor('equipment'), {
                uuid: 'equipment_1',
                equipable_type: 'Fleetbase\\FleetOps\\Models\\Vehicle',
                equipable: { uuid: 'veh_1', type: 'Fleetbase\\FleetOps\\Models\\Place', name: 'Depot' },
            });

            const included = normalized.included.find((resource) => resource.id === 'veh_1');

            assert.strictEqual(included.attributes.type, 'Fleetbase\\FleetOps\\Models\\Place', 'the original domain type survives normalization');
        });

        test('a supported equipable type is left as the normalized model name', function (assert) {
            const normalized = this.serializer.normalize(this.store.modelFor('equipment'), {
                uuid: 'equipment_2',
                equipable_type: 'Fleetbase\\FleetOps\\Models\\Trailer',
                equipable: { uuid: 'trl_1', type: 'trailer', name: 'Flatbed 1' },
            });

            assert.strictEqual(normalized.data.relationships.equipable.data.type, 'attachable-trailer');
        });

        test('restoring is skipped when there is no matching included record, or no equipable at all', function (assert) {
            const withoutIncluded = { data: { relationships: { equipable: { data: { type: 'attachable-vehicle', id: 'veh_9' } } } }, included: [] };
            const withoutEquipable = { data: { relationships: {} } };

            this.serializer.restoreEquipableDomainType(withoutIncluded, 'Fleetbase\\FleetOps\\Models\\Place');
            this.serializer.restoreEquipableDomainType(withoutEquipable, 'Fleetbase\\FleetOps\\Models\\Place');

            assert.deepEqual(withoutIncluded.included, [], 'nothing is fabricated');
            assert.deepEqual(withoutEquipable, { data: { relationships: {} } });
        });

        test('the domain type is restored onto an included record that carries no attributes', function (assert) {
            const normalized = {
                data: { relationships: { equipable: { data: { type: 'attachable-vehicle', id: 'veh_1' } } } },
                included: [{ type: 'attachable-vehicle', id: 'veh_1' }],
            };

            this.serializer.restoreEquipableDomainType(normalized, 'Fleetbase\\FleetOps\\Models\\Place');

            assert.deepEqual(normalized.included[0].attributes, { type: 'Fleetbase\\FleetOps\\Models\\Place' }, 'an attributes object is created rather than crashing');
        });

        test('a supported or missing type never triggers a restore', function (assert) {
            assert.false(this.serializer.shouldRestoreEquipableDomainType('vehicle'));
            assert.false(this.serializer.shouldRestoreEquipableDomainType());
            assert.false(this.serializer.shouldRestoreEquipableDomainType(42));
            assert.true(this.serializer.shouldRestoreEquipableDomainType('Fleetbase\\FleetOps\\Models\\Place'));
        });
    });
});
