import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | purchase rate', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('purchase-rate');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'purchase-rate');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'purchase-rate', {
            service_quote: { embedded: 'always' },
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'purchase-rate', { status: 'contract-value' });

        assert.strictEqual(record.status, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('purchase-rate', { status: 'contract-value' });

        assert.strictEqual(record.serialize().status, 'contract-value');
    });

    test('the service_quote relationship travels inline with the record', function (assert) {
        const record = this.store.createRecord('purchase-rate');
        record.set('service_quote', this.store.createRecord('service-quote', { service_rate_name: 'related-value' }));

        const json = record.serialize();

        assert.strictEqual(json.service_quote.service_rate_name, 'related-value', 'the related record is sent whole, not as an identifier');
    });

    test('an embedded payload normalizes into a linked record', function (assert) {
        const record = this.store.push(
            this.store.normalize('purchase-rate', {
                uuid: 'purchase-rate_1',
                service_quote: { uuid: 'related_1', service_rate_name: 'related-value' },
            })
        );

        assert.strictEqual(record.belongsTo('service_quote').id(), 'related_1', 'the inline record becomes a real related record');
        assert.strictEqual(this.store.peekRecord('service-quote', 'related_1').service_rate_name, 'related-value', 'and it carries the embedded attributes');
    });
});
