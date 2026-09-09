import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { assertPolymorphicTypeContract, snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | order', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('order');
    });

    test('it keys records by uuid and declares the expected embedded relationships', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'order');
        assertEmbeddedAttrs(assert, this.store, 'order', {
            order_config: EMBEDDED,
            payload: EMBEDDED,
            driver_assigned: EMBEDDED,
            vehicle_assigned: EMBEDDED,
            facilitator: EMBEDDED,
            customer: EMBEDDED,
            transaction: EMBEDDED,
            purchase_rate: EMBEDDED,
            route: EMBEDDED,
            tracking_number: EMBEDDED,
            tracking_statuses: EMBEDDED,
            files: EMBEDDED,
            comments: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('server-computed and denormalized display fields are stripped before the order is sent back', function (assert) {
        const order = this.store.push(
            this.store.normalize('order', {
                uuid: 'order_1',
                driver_name: 'Ada',
                tracking: 'TRK1',
                total_entities: 3,
                transaction_amount: 100,
                customer_name: 'Acme',
                facilitator_name: 'Courier Co',
                customer_is_vendor: true,
                customer_is_contact: false,
                pickup_name: 'Depot',
                dropoff_name: 'Customer',
                payload_id: 'payload_abc',
                driver_id: 'driver_abc',
                created_by_name: 'Ada',
                updated_by_name: 'Ada',
                purchase_rate_id: 'pr_abc',
                notes: 'kept',
            })
        );

        const json = order.serialize();

        for (const attribute of [
            'order_config',
            'driver_name',
            'tracking',
            'total_entities',
            'transaction_amount',
            'customer_name',
            'facilitator_name',
            'customer_is_vendor',
            'customer_is_contact',
            'pickup_name',
            'dropoff_name',
            'payload_id',
            'driver_id',
            'created_by_name',
            'updated_by_name',
            'purchase_rate_id',
        ]) {
            assert.notOk(attribute in json, `${attribute} is server-owned and is not written back`);
        }

        assert.strictEqual(json.notes, 'kept', 'fields the client does own still travel');
    });

    test('the driver assignment is linked by identifier rather than embedded', function (assert) {
        const order = this.store.createRecord('order');
        order.set('driver_assigned', this.store.push(this.store.normalize('driver', { uuid: 'drv_1' })));

        const json = order.serialize();

        assert.notOk(json.driver_assigned, 'the whole driver is not echoed back');
        assert.strictEqual(json.driver_assigned_uuid, 'drv_1', 'only the identifier travels');
    });

    test('customer and facilitator send the bare backend type for every local subtype', function (assert) {
        for (const key of ['customer', 'facilitator']) {
            assertPolymorphicTypeContract(assert, {
                serializer: this.serializer,
                key,
                stripped: { 'facilitator-vendor': 'vendor', 'customer-contact': 'contact', 'maintenance-subject-vehicle': 'vehicle', vendor: 'vendor' },
            });
        }
    });

    test('a type the related record carries itself overrides its model name', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'customer-contact', attr: () => 'facilitator-vendor' } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:vendor', 'the record’s own type wins, and is still stripped');
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'vendor', attr: () => null } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:vendor');
    });

    test('selected order config scalar fields win over a stale relationship snapshot', function (assert) {
        let store = this.owner.lookup('service:store');
        let transport = store.push({
            data: {
                type: 'order-config',
                id: 'transport-config-uuid',
                attributes: {
                    key: 'transport',
                    name: 'Transport',
                },
            },
        });
        let haulage = store.push({
            data: {
                type: 'order-config',
                id: 'haulage-config-uuid',
                attributes: {
                    key: 'haulage',
                    name: 'Haulage',
                },
            },
        });
        let record = store.createRecord('order', {
            order_config: transport,
            order_config_uuid: haulage.id,
            type: haulage.key,
        });

        let serializedRecord = record.serialize();

        assert.strictEqual(serializedRecord.order_config_uuid, haulage.id);
        assert.strictEqual(serializedRecord.type, haulage.key);
        assert.notOk(serializedRecord.order_config);
    });
});
