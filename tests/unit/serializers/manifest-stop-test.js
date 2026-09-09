import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | manifest stop', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('manifest-stop');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'manifest-stop');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'manifest-stop', {
            order: { embedded: 'always' },
            place: { embedded: 'always' },
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'manifest-stop', { status: 'contract-value' });

        assert.strictEqual(record.status, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('manifest-stop', { status: 'contract-value' });

        assert.strictEqual(record.serialize().status, 'contract-value');
    });

    test('the place relationship travels inline with the record', function (assert) {
        const record = this.store.createRecord('manifest-stop');
        record.set('place', this.store.createRecord('place', { name: 'related-value' }));

        const json = record.serialize();

        assert.strictEqual(json.place.name, 'related-value', 'the related record is sent whole, not as an identifier');
    });

    test('an embedded payload normalizes into a linked record', function (assert) {
        const record = this.store.push(
            this.store.normalize('manifest-stop', {
                uuid: 'manifest-stop_1',
                place: { uuid: 'related_1', name: 'related-value' },
            })
        );

        assert.strictEqual(record.belongsTo('place').id(), 'related_1', 'the inline record becomes a real related record');
        assert.strictEqual(this.store.peekRecord('place', 'related_1').name, 'related-value', 'and it carries the embedded attributes');
    });
});
