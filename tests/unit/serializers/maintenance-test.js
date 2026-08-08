import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { assertPolymorphicTypeContract, snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | maintenance', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('maintenance');
    });

    test('it keys records by uuid', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'maintenance');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'maintenance', {
            maintainable: EMBEDDED,
            performed_by: EMBEDDED,
            work_order: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'maintenance');
    });

    test('server-computed attributes are stripped before the record is sent back', function (assert) {
        const record = this.store.push(
            this.store.normalize('maintenance', {
                uuid: 'maintenance_1',
                maintainable_name: 'computed',
                performed_by_name: 'computed',
                work_order_subject: 'computed',
                duration_hours: 'computed',
                is_overdue: 'computed',
                days_until_due: 'computed',
                cost_breakdown: 'computed',
            })
        );

        const json = record.serialize();

        for (const attribute of ['maintainable_name', 'performed_by_name', 'work_order_subject', 'duration_hours', 'is_overdue', 'days_until_due', 'cost_breakdown']) {
            assert.notOk(attribute in json, `${attribute} is read-only and is not written back`);
        }
    });

    test('maintainable sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'maintainable',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('performed_by sends the bare backend type for every local subtype', function (assert) {
        assertPolymorphicTypeContract(assert, {
            serializer: this.serializer,
            key: 'performed_by',
            stripped: { 'facilitator-vendor': 'vendor', 'maintenance-subject-vehicle': 'vehicle', 'customer-contact': 'contact', vendor: 'vendor' },
        });
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'vendor' } }), json, { key: 'maintainable' });

        assert.strictEqual(json['maintainable_type'], 'fleet-ops:vendor', 'the raw key still produces a usable type field');
    });
});
