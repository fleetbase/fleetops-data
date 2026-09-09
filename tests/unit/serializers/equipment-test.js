import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

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
        assertEmbeddedAttrs(assert, this.store, 'equipment', {});
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
