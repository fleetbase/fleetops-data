import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | service rate', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('service-rate', {});
        assert.ok(model);
    });

    test('rateFees returns per-drop fees sorted by min when using per_drop', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'per_drop',
        });

        serviceRate.rate_fees.pushObjects([
            store.createRecord('service-rate-fee', { min: 6, max: 10, unit: 'waypoint', fee: 200 }),
            store.createRecord('service-rate-fee', { min: 1, max: 5, unit: 'waypoint', fee: 100 }),
            store.createRecord('service-rate-fee', { distance: 0, fee: 50 }),
        ]);

        assert.deepEqual(
            serviceRate.rateFees.map((fee) => [fee.min, fee.max]),
            [
                [1, 5],
                [6, 10],
            ]
        );
    });

    test('rateFees filters fixed-distance fees by max_distance', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'fixed_rate',
            max_distance: 2,
        });

        serviceRate.rate_fees.pushObjects([
            store.createRecord('service-rate-fee', { distance: 0, fee: 100 }),
            store.createRecord('service-rate-fee', { distance: 1, fee: 200 }),
            store.createRecord('service-rate-fee', { distance: 2, fee: 300 }),
        ]);

        assert.deepEqual(
            serviceRate.rateFees.map((fee) => fee.distance),
            [0, 1]
        );
    });
});
