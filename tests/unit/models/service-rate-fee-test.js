import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | service rate fee', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'service-rate-fee', {
            service_area: { kind: 'belongsTo', type: 'service-area' },
            zone: { kind: 'belongsTo', type: 'zone' },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('service-rate-fee'), {
            is_fallback: false,
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('service-rate-fee'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
                updatedAtShort: FIXED_DATE_SHORT,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('service-rate-fee'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
                createdAtShort: FIXED_DATE_SHORT,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    module('geography_type', function () {
        test('an explicit selection wins over anything inferred', function (assert) {
            const fee = this.store.createRecord('service-rate-fee', { selected_geography_type: 'zone', is_fallback: true, service_area_uuid: 'sa_1' });

            assert.strictEqual(fee.geography_type, 'zone', 'the editor’s choice is preserved across a re-render');
        });

        test('a fallback rule reports itself as the fallback', function (assert) {
            assert.strictEqual(this.store.createRecord('service-rate-fee', { is_fallback: true }).geography_type, 'fallback');
        });

        test('a rule bound to a zone identifier reports zone', function (assert) {
            assert.strictEqual(this.store.createRecord('service-rate-fee', { zone_uuid: 'zone_1' }).geography_type, 'zone');
        });

        test('a rule bound to a loaded zone record reports zone even without the identifier', function (assert) {
            const fee = this.store.createRecord('service-rate-fee');
            fee.set('zone', this.store.push(this.store.normalize('zone', { uuid: 'zone_1' })));

            assert.strictEqual(fee.geography_type, 'zone');
        });

        test('anything else defaults to a service area', function (assert) {
            assert.strictEqual(this.store.createRecord('service-rate-fee').geography_type, 'service_area');
            assert.strictEqual(this.store.createRecord('service-rate-fee', { service_area_uuid: 'sa_1' }).geography_type, 'service_area');
        });
    });

    test('toJSON emits the pricing fields the backend accepts and nothing else', function (assert) {
        const fee = this.store.push(
            this.store.normalize('service-rate-fee', {
                uuid: 'fee_1',
                service_rate_uuid: 'rate_1',
                service_area_uuid: 'sa_1',
                zone_uuid: 'zone_1',
                label: 'Main City',
                priority: 10,
                is_fallback: false,
                distance: 5,
                distance_unit: 'km',
                min: 1,
                max: 5,
                unit: 'multi_zone_distance',
                fee: '250',
                currency: 'SAR',
                selected_geography_type: 'zone',
            })
        );

        assert.deepEqual(fee.toJSON(), {
            uuid: 'fee_1',
            service_rate_uuid: 'rate_1',
            service_area_uuid: 'sa_1',
            zone_uuid: 'zone_1',
            label: 'Main City',
            priority: 10,
            is_fallback: false,
            distance: 5,
            distance_unit: 'km',
            min: 1,
            max: 5,
            unit: 'multi_zone_distance',
            fee: '250',
            currency: 'SAR',
        });
        assert.notOk('selected_geography_type' in fee.toJSON(), 'the editor-only field stays client-side');
    });
});
