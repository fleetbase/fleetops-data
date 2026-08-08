import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';
import { snapshotStub } from 'dummy/tests/helpers/polymorphic-contract';

module('Unit | Serializer | entity', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('entity');
    });

    test('it keys records by uuid and declares the expected relationship contract', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'entity');
        assertEmbeddedAttrs(assert, this.store, 'entity', {
            payload: { serialize: 'ids' },
            destination: EMBEDDED,
            trackingNumber: EMBEDDED,
            driver: EMBEDDED,
            photo: EMBEDDED,
            supplier: EMBEDDED,
            customer: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'entity', { name: 'Parcel A' });
    });

    test('the owning payload, supplier, customer and driver are linked by identifier rather than embedded', function (assert) {
        const entity = this.store.createRecord('entity');
        entity.set('payload', this.store.push(this.store.normalize('payload', { uuid: 'pay_1' })));
        entity.set('supplier', this.store.push(this.store.normalize('vendor', { uuid: 'ven_1' })));
        entity.set('driver', this.store.push(this.store.normalize('driver', { uuid: 'drv_1' })));

        const json = entity.serialize();

        assert.notOk(json.payload, 'the payload is not echoed back into itself');
        assert.notOk(json.supplier);
        assert.notOk(json.driver);
        assert.strictEqual(json.payload_uuid, 'pay_1', 'each is still linked by uuid');
        assert.strictEqual(json.supplier_uuid, 'ven_1');
        assert.strictEqual(json.driver_uuid, 'drv_1');
    });

    test('the destination place travels inline', function (assert) {
        const entity = this.store.createRecord('entity');
        entity.set('destination', this.store.createRecord('place', { name: 'Customer' }));

        assert.strictEqual(entity.serialize().destination.name, 'Customer');
    });

    test('the customer type is derived from the related record when none was chosen', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: { modelName: 'customer-contact' } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:customer-contact', 'entity sends the model name unstripped, unlike order and waypoint');
    });

    test('an explicitly chosen customer type is left untouched', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType(snapshotStub({ attrs: { customer_type: 'fleet-ops:vendor' }, belongsTo: { modelName: 'customer-contact' } }), json, { key: 'customer' });

        assert.deepEqual(json, {});
    });

    test('the relationship key is used verbatim when the serializer has no keyForAttribute hook', function (assert) {
        const json = {};

        this.serializer.serializePolymorphicType.call({}, snapshotStub({ belongsTo: { modelName: 'contact' } }), json, { key: 'customer' });

        assert.strictEqual(json.customer_type, 'fleet-ops:contact');
    });

    test('an unset customer throws instead of clearing the type', function (assert) {
        const json = {};

        // The serializer reads `belongsTo.modelName` before checking whether
        // `belongsTo` exists, so its own null branch can never run. See DEFECTS.md.
        assert.throws(() => this.serializer.serializePolymorphicType(snapshotStub({ belongsTo: null }), json, { key: 'customer' }), TypeError);
        assert.deepEqual(json, {}, 'and nothing is written');
    });
});
