import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | service rate parcel fee', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('service-rate-parcel-fee'),
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
            this.store.createRecord('service-rate-parcel-fee'),
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

    test('toJSON emits the parcel dimensions and price the backend accepts', function (assert) {
        const fee = this.store.push(
            this.store.normalize('service-rate-parcel-fee', {
                uuid: 'pf_1',
                service_rate_uuid: 'rate_1',
                size: 'small',
                length: '34',
                width: '18',
                height: '10',
                dimensions_unit: 'cm',
                weight: '2',
                weight_unit: 'kg',
                fee: '5',
                currency: 'SGD',
            })
        );

        assert.deepEqual(fee.toJSON(), {
            uuid: 'pf_1',
            service_rate_uuid: 'rate_1',
            size: 'small',
            length: '34',
            width: '18',
            height: '10',
            dimensions_unit: 'cm',
            weight: '2',
            weight_unit: 'kg',
            fee: '5',
            currency: 'SGD',
        });
    });
});
