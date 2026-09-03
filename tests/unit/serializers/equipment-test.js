import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | equipment', function (hooks) {
    setupTest(hooks);

    // Replace this with your real tests.
    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('equipment');

        assert.ok(serializer);
    });

    test('it serializes records', function (assert) {
        let store = this.owner.lookup('service:store');
        let record = store.createRecord('equipment', {});

        let serializedRecord = record.serialize();

        assert.ok(serializedRecord);
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
});
