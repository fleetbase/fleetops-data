import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { settled } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

/**
 * The service-rate editor creates fee rows optimistically, so a save response
 * can come back describing rows the client already has as unsaved drafts.
 * `normalizeSaveResponse` schedules a reconciliation pass that drops the drafts
 * which the backend has now persisted, keyed by the most stable identity each
 * fee shape has.
 */
module('Unit | Serializer | service rate', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('service-rate');
        this.modelClass = this.store.modelFor('service-rate');

        /**
         * Push a persisted service rate, then run a save response through the
         * serializer and let the scheduled reconciliation settle.
         *
         * @param {Model} serviceRate
         * @return {Promise}
         */
        this.reconcile = async (serviceRate) => {
            // The reconciliation is scheduled with `next()`, so it has to be
            // started inside a run loop for `settled()` to wait for it.
            run(() => {
                this.serializer.normalizeSaveResponse(this.store, this.modelClass, { serviceRate: { uuid: serviceRate.id } }, serviceRate.id, 'updateRecord');
            });
            await settled();
        };

        /**
         * @param {String} id
         * @param {Object} attributes
         * @return {Model} a fee that the backend has already persisted
         */
        this.savedFee = (id, attributes) => this.store.push({ data: { type: 'service-rate-fee', id, attributes } });
    });

    test('it keys records by uuid and declares the expected embedded relationships', function (assert) {
        assertPrimaryKeyIsUuid(assert, this.store, 'service-rate');
        assertEmbeddedAttrs(assert, this.store, 'service-rate', {
            order_config: EMBEDDED,
            zone: EMBEDDED,
            service_area: EMBEDDED,
            parcel_fees: EMBEDDED,
            rate_fees: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        assertNormalizesUuidAsId(assert, this.store, 'service-rate', { service_name: 'Standard' });
    });

    module('reconciling rate fees after a save', function () {
        test('a per-drop draft is dropped once the backend returns the same band', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_1' }));
            const draft = this.store.createRecord('service-rate-fee', { min: 1, max: 5, unit: 'waypoint' });

            serviceRate.rate_fees.pushObjects([this.savedFee('fee_1', { min: 1, max: 5, unit: 'waypoint' }), draft]);

            await this.reconcile(serviceRate);

            assert.deepEqual(
                serviceRate.rate_fees.toArray().map((fee) => fee.id),
                ['fee_1'],
                'only the persisted row remains'
            );
        });

        test('an unsaved per-drop draft with a different band is kept', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_2' }));
            const draft = this.store.createRecord('service-rate-fee', { min: 6, max: 10, unit: 'waypoint' });

            serviceRate.rate_fees.pushObjects([this.savedFee('fee_1', { min: 1, max: 5, unit: 'waypoint' }), draft]);

            await this.reconcile(serviceRate);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 2, 'a genuinely new band survives');
        });

        test('every unsaved multi-zone draft is dropped once the backend has persisted any of them', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_3' }));

            serviceRate.rate_fees.pushObjects([
                this.savedFee('fee_1', { unit: 'multi_zone_distance', label: 'Main City', priority: 10 }),
                this.store.createRecord('service-rate-fee', { unit: 'multi_zone_distance', label: 'Remote', priority: 20 }),
            ]);

            await this.reconcile(serviceRate);

            assert.deepEqual(
                serviceRate.rate_fees.toArray().map((fee) => fee.id),
                ['fee_1'],
                'the whole multi-zone set is replaced by what came back'
            );
        });

        test('a fixed-distance draft is dropped once the backend returns the same distance', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_4' }));

            serviceRate.rate_fees.pushObjects([this.savedFee('fee_1', { distance: 5 }), this.store.createRecord('service-rate-fee', { distance: 5 })]);

            await this.reconcile(serviceRate);

            assert.deepEqual(
                serviceRate.rate_fees.toArray().map((fee) => fee.id),
                ['fee_1'],
                'the draft matched the persisted row by distance'
            );
        });

        test('a fixed-distance draft at a different distance is kept', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_4b' }));

            serviceRate.rate_fees.pushObjects([this.savedFee('fee_1', { distance: 5 }), this.store.createRecord('service-rate-fee', { distance: 10 })]);

            await this.reconcile(serviceRate);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 2, 'a genuinely new distance survives');
        });

        test('a save response with no drafts to reconcile leaves the fees alone', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_5' }));
            serviceRate.rate_fees.pushObject(this.savedFee('fee_1', { min: 1, max: 5, unit: 'waypoint' }));

            await this.reconcile(serviceRate);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 1);
        });
    });

    module('reconciling parcel fees after a save', function () {
        test('an unsaved parcel draft matching a persisted one by dimensions is dropped', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_6' }));

            serviceRate.parcel_fees.pushObjects([
                this.store.push({ data: { type: 'service-rate-parcel-fee', id: 'pf_1', attributes: { size: 'small', length: 34, width: 18, height: 10 } } }),
                this.store.createRecord('service-rate-parcel-fee', { size: 'small', length: 34, width: 18, height: 10 }),
            ]);

            await this.reconcile(serviceRate);

            assert.deepEqual(
                serviceRate.parcel_fees.toArray().map((fee) => fee.id),
                ['pf_1']
            );
        });

        test('an unsaved parcel draft with different dimensions is kept', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_7' }));

            serviceRate.parcel_fees.pushObjects([
                this.store.push({ data: { type: 'service-rate-parcel-fee', id: 'pf_1', attributes: { size: 'small', length: 34, width: 18, height: 10 } } }),
                this.store.createRecord('service-rate-parcel-fee', { size: 'large', length: 60, width: 40, height: 30 }),
            ]);

            await this.reconcile(serviceRate);

            assert.strictEqual(serviceRate.parcel_fees.toArray().length, 2);
        });
    });

    module('when there is nothing to reconcile', function () {
        test('a response for a record that is no longer in the store is ignored', async function (assert) {
            run(() => {
                this.serializer.normalizeSaveResponse(this.store, this.modelClass, { serviceRate: { uuid: 'never_pushed' } }, 'never_pushed', 'updateRecord');
            });

            await settled();

            assert.strictEqual(this.store.peekRecord('service-rate', 'never_pushed'), null, 'the scheduled pass finds nothing and does nothing');
        });

        test('a response for a different model type schedules no reconciliation', async function (assert) {
            const normalized = run(() =>
                this.store
                    .serializerFor('service-rate-fee')
                    .normalizeSaveResponse(this.store, this.store.modelFor('service-rate-fee'), { serviceRateFee: { uuid: 'fee_1' } }, 'fee_1', 'updateRecord')
            );

            await settled();

            assert.strictEqual(normalized.data.type, 'service-rate-fee', 'the fee serializer is untouched by the rate reconciliation');
        });

        test('the normalized payload is returned unchanged to the caller', async function (assert) {
            const normalized = run(() =>
                this.serializer.normalizeSaveResponse(this.store, this.modelClass, { serviceRate: { uuid: 'rate_8', service_name: 'Standard' } }, 'rate_8', 'updateRecord')
            );

            await settled();

            assert.strictEqual(normalized.data.type, 'service-rate');
            assert.strictEqual(normalized.data.id, 'rate_8');
            assert.strictEqual(normalized.data.attributes.service_name, 'Standard');
        });
    });

    module('multi-zone draft keys', function () {
        test('a multi-zone draft is keyed by its geography when nothing multi-zone came back', async function (assert) {
            const serviceRate = this.store.push(this.store.normalize('service-rate', { uuid: 'rate_9' }));

            serviceRate.rate_fees.pushObjects([
                this.savedFee('fee_1', { min: 1, max: 5, unit: 'waypoint' }),
                this.store.createRecord('service-rate-fee', { unit: 'multi_zone_distance', label: 'Remote', priority: 20, zone_uuid: 'zone_1' }),
            ]);

            await this.reconcile(serviceRate);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 2, 'with no saved multi-zone rows the draft is kept, since no persisted row shares its shape');
        });

        test('a response normalizing to another model type schedules no reconciliation', async function (assert) {
            const normalized = run(() =>
                this.serializer.normalizeSaveResponse(this.store, this.store.modelFor('service-rate-fee'), { serviceRateFee: { uuid: 'fee_2' } }, 'fee_2', 'updateRecord')
            );

            await settled();

            assert.strictEqual(normalized.data.type, 'service-rate-fee', 'the rate reconciliation only runs for service-rate payloads');
        });
    });
});
