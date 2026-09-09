import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | device event', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('device-event');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'device-event');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'device-event', {});
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'device-event', { event_type: 'contract-value' });

        assert.strictEqual(record.event_type, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('device-event', { event_type: 'contract-value' });

        assert.strictEqual(record.serialize().event_type, 'contract-value');
    });

    test('the device relationship is linked by uuid when it is not embedded', function (assert) {
        const related = this.store.push(this.store.normalize('device', { uuid: 'related_1' }));
        const record = this.store.createRecord('device-event');
        record.set('device', related);

        assert.strictEqual(record.serialize().device_uuid, 'related_1', 'the application serializer always adds the identifier');
    });

    test('an unset device contributes no identifier', function (assert) {
        const json = this.store.createRecord('device-event').serialize();

        assert.notOk(json.device_uuid, 'a relationship that was never set is simply absent');
    });
});
