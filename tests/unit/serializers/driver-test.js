import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | driver', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('driver');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer);
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer));
        assertPrimaryKeyIsUuid(assert, this.store, 'driver');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'driver', {
            user: EMBEDDED,
            fleets: EMBEDDED,
            vendor: EMBEDDED,
            vehicle: EMBEDDED,
            devices: EMBEDDED,
            current_job: EMBEDDED,
            jobs: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const driver = assertNormalizesUuidAsId(assert, this.store, 'driver', { name: 'Ada Lovelace', status: 'available' });

        assert.strictEqual(driver.name, 'Ada Lovelace');
        assert.strictEqual(driver.status, 'available');
    });

    module('relationships the driver never owns', function () {
        /**
         * These are read-only from the driver's point of view: the server decides
         * which user account backs the driver, which vendor employs them, and
         * which job is current. Sending the whole record back would let a stale
         * client clobber server state — the identifier alone is enough.
         */
        const NOT_EMBEDDED = [
            { key: 'user', modelName: 'user' },
            { key: 'vendor', modelName: 'vendor' },
            { key: 'current_job', modelName: 'order' },
        ];

        for (const { key, modelName } of NOT_EMBEDDED) {
            test(`${key} is linked by identifier rather than embedded`, function (assert) {
                const driver = this.store.createRecord('driver');
                driver.set(key, this.store.push(this.store.normalize(modelName, { uuid: 'rel_1' })));

                const json = driver.serialize();

                assert.notOk(json[key], `the whole ${key} record is not written back`);
                assert.strictEqual(json[`${key}_uuid`], 'rel_1', `${key} is still linked by uuid`);
            });
        }

        test('fleets and jobs are omitted from the outgoing payload', function (assert) {
            const driver = this.store.createRecord('driver');
            const json = driver.serialize();

            assert.notOk(json.fleets, 'fleet membership is managed server-side');
            assert.notOk(json.jobs, 'the job list is managed server-side');
        });
    });

    test('the vehicle relationship is embedded on the way out', function (assert) {
        const driver = this.store.createRecord('driver');
        driver.set('vehicle', this.store.createRecord('vehicle', { name: 'Van 1' }));

        const json = driver.serialize();

        assert.strictEqual(json.vehicle.name, 'Van 1', 'the assigned vehicle travels inline');
    });

    test('a vehicle already present as an array is reduced to an identifier instead of being embedded', function (assert) {
        // Defensive legacy path: when the payload under construction already
        // carries `vehicle` as a collection, the serializer refuses to embed and
        // writes an identifier key instead.
        const json = { vehicle: [{ uuid: 'veh_1', name: 'Van 1' }] };

        this.serializer.serializeBelongsTo(null, json, { key: 'vehicle' });

        assert.deepEqual(json.vehicle, [{ uuid: 'veh_1', name: 'Van 1' }], 'the collection is left untouched');
        assert.true('vehicle_uuid' in json, 'and an identifier key is written in its place');
    });

    test('a hasMany that is not on the skip list is still serialized', function (assert) {
        const driver = this.store.createRecord('driver');
        driver.custom_field_values.pushObject(this.store.createRecord('custom-field-value', { name: 'Shift' }));

        const json = driver.serialize();

        assert.strictEqual(json.custom_field_values.length, 1, 'custom fields are the driver’s to send');
    });

    test('an embedded user payload normalizes into a linked record without being echoed back', function (assert) {
        const driver = this.store.push(
            this.store.normalize('driver', {
                uuid: 'drv_1',
                name: 'Ada Lovelace',
                user: { uuid: 'usr_1', name: 'Ada' },
            })
        );

        assert.strictEqual(driver.belongsTo('user').id(), 'usr_1', 'the inline user becomes a real related record');
        assert.notOk(driver.serialize().user, 'but it is not written back');
    });
});
