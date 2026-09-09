import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { assertPolymorphicTypeContract, snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | maintenance schedule', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('maintenance-schedule');
    });

    test('it keys records by uuid and declares the expected embedded relationships', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'maintenance-schedule');
        assertEmbeddedAttrs(assert, this.store, 'maintenance-schedule', {
            subject: EMBEDDED,
            default_assignee: EMBEDDED,
        });
    });

    test('server-computed names are stripped before the record is sent back', function (assert) {
        const record = this.store.push(this.store.normalize('maintenance-schedule', { uuid: 'sched_1', subject_name: 'Van 1', default_assignee_name: 'Ada' }));

        const json = record.serialize();

        assert.notOk('subject_name' in json, 'subject_name is read-only');
        assert.notOk('default_assignee_name' in json, 'default_assignee_name is read-only');
        assert.strictEqual(json.code, null, 'and unset fields travel as an explicit null');
    });

    test('subject sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'subject',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('default_assignee sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'default_assignee',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'vendor' } }), json, { key: 'subject' });

        assert.strictEqual(json.subject_type, 'fleet-ops:vendor');
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
