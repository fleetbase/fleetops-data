import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | sensor', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('sensor');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'sensor');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'sensor', {
            telematic: { embedded: 'always' },
            device: { embedded: 'always' },
            warranty: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'sensor', { name: 'contract-value' });

        assert.strictEqual(record.name, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('sensor', { name: 'contract-value' });

        assert.strictEqual(record.serialize().name, 'contract-value');
    });

    test('the telematic relationship travels inline with the record', function (assert) {
        const record = this.store.createRecord('sensor');
        record.set('telematic', this.store.createRecord('telematic', { name: 'related-value' }));

        const json = record.serialize();

        assert.strictEqual(json.telematic.name, 'related-value', 'the related record is sent whole, not as an identifier');
    });

    test('an embedded payload normalizes into a linked record', function (assert) {
        const record = this.store.push(
            this.store.normalize('sensor', {
                uuid: 'sensor_1',
                telematic: { uuid: 'related_1', name: 'related-value' },
            })
        );

        assert.strictEqual(record.belongsTo('telematic').id(), 'related_1', 'the inline record becomes a real related record');
        assert.strictEqual(this.store.peekRecord('telematic', 'related_1').name, 'related-value', 'and it carries the embedded attributes');
    });
});
