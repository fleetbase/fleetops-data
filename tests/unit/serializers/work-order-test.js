import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { assertPolymorphicTypeContract, snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | work order', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('work-order');
    });

    test('it keys records by uuid', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'work-order');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'work-order', {
            target: EMBEDDED,
            assignee: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'work-order');
    });

    test('server-computed attributes are stripped before the record is sent back', function (assert) {
        const record = this.store.push(
            this.store.normalize('work-order', {
                uuid: 'work-order_1',
                target_name: 'computed',
                assignee_name: 'computed',
                is_overdue: 'computed',
                days_until_due: 'computed',
                completion_percentage: 'computed',
            })
        );

        const json = record.serialize();

        for (const attribute of ['target_name', 'assignee_name', 'is_overdue', 'days_until_due', 'completion_percentage']) {
            assert.notOk(attribute in json, `${attribute} is read-only and is not written back`);
        }
    });

    test('target sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'target',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('assignee sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'assignee',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'vendor' } }), json, { key: 'target' });

        assert.strictEqual(json['target_type'], 'fleet-ops:vendor', 'the raw key still produces a usable type field');
    });
});
