import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | vendor', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('vendor');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'vendor');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'vendor', {
            place: { embedded: 'always' },
            personnels: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'vendor', { name: 'contract-value' });

        assert.strictEqual(record.name, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('vendor', { name: 'contract-value' });

        assert.strictEqual(record.serialize().name, 'contract-value');
    });

    test('the place relationship travels inline with the record', function (assert) {
        const record = this.store.createRecord('vendor');
        record.set('place', this.store.createRecord('place', { name: 'related-value' }));

        const json = record.serialize();

        assert.strictEqual(json.place.name, 'related-value', 'the related record is sent whole, not as an identifier');
    });

    test('an embedded payload normalizes into a linked record', function (assert) {
        const record = this.store.push(
            this.store.normalize('vendor', {
                uuid: 'vendor_1',
                place: { uuid: 'related_1', name: 'related-value' },
            })
        );

        assert.strictEqual(record.belongsTo('place').id(), 'related_1', 'the inline record becomes a real related record');
        assert.strictEqual(this.store.peekRecord('place', 'related_1').name, 'related-value', 'and it carries the embedded attributes');
    });
});
