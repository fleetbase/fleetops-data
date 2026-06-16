import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | maintenance schedule', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('maintenance-schedule');

        assert.ok(serializer);
    });

    test('it normalizes an embedded facilitator driver default assignee', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('maintenance-schedule');
        let modelClass = store.modelFor('maintenance-schedule');

        let normalized = serializer.normalize(modelClass, {
            uuid: 'schedule-1',
            public_id: 'schedule_1',
            name: 'Oil Change',
            default_assignee_uuid: 'driver-1',
            default_assignee_type: 'fleet-ops:driver',
            default_assignee: {
                uuid: 'driver-1',
                public_id: 'driver_1',
                type: 'facilitator-driver',
                facilitator_type: 'driver',
                name: 'Test Driver',
            },
        });

        assert.strictEqual(normalized.data.relationships.default_assignee.data.type, 'facilitator-driver');
        assert.strictEqual(normalized.data.relationships.default_assignee.data.id, 'driver-1');
    });
});
