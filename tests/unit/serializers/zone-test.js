import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | zone', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('zone');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'zone');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'zone', {
            service_area: { serialize: 'ids' },
            custom_field_values: { embedded: 'always' },
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'zone', { name: 'contract-value' });

        assert.strictEqual(record.name, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('zone', { name: 'contract-value' });

        assert.strictEqual(record.serialize().name, 'contract-value');
    });
});
