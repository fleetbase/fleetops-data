import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | fleet driver', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('fleet-driver');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'fleet-driver');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'fleet-driver', {});
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'fleet-driver');
    });

    test('the fleet relationship is linked by uuid when it is not embedded', function (assert) {
        const related = this.store.push(this.store.normalize('fleet', { uuid: 'related_1' }));
        const record = this.store.createRecord('fleet-driver');
        record.set('fleet', related);

        assert.strictEqual(record.serialize().fleet_uuid, 'related_1', 'the application serializer always adds the identifier');
    });

    test('an unset fleet contributes no identifier', function (assert) {
        const json = this.store.createRecord('fleet-driver').serialize();

        assert.notOk(json.fleet_uuid, 'a relationship that was never set is simply absent');
    });
});
