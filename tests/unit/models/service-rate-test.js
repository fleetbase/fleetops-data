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

    test('rateFees returns multi-zone distance rules sorted by priority', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'multi_zone_distance',
        });

        serviceRate.rate_fees.pushObjects([
            store.createRecord('service-rate-fee', { label: 'Fallback', unit: 'multi_zone_distance', priority: 0, is_fallback: true }),
            store.createRecord('service-rate-fee', { label: 'Main City', unit: 'multi_zone_distance', priority: 20 }),
            store.createRecord('service-rate-fee', { distance: 0, fee: 50 }),
            store.createRecord('service-rate-fee', { label: 'Remote', unit: 'multi_zone_distance', priority: 10 }),
        ]);

        assert.deepEqual(
            serviceRate.rateFees.map((fee) => fee.label),
            ['Main City', 'Remote', 'Fallback']
        );
    });

    test('rateFees prefers persisted multi-zone fees over duplicate unsaved rows', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'multi_zone_distance',
        });

        const unsavedRule = store.createRecord('service-rate-fee', {
            label: 'Main City',
            service_area_uuid: 'service-area-1',
            priority: 10,
            unit: 'multi_zone_distance',
            fee: '0',
        });

        const persistedRule = store.push({
            data: {
                type: 'service-rate-fee',
                id: 'rate-fee-1',
                attributes: {
                    label: 'Main City',
                    service_area_uuid: 'service-area-1',
                    priority: 10,
                    unit: 'multi_zone_distance',
                    fee: '2',
                },
            },
        });

        serviceRate.rate_fees.pushObjects([unsavedRule, persistedRule]);

        assert.strictEqual(serviceRate.rateFees.length, 1);
        assert.strictEqual(serviceRate.rateFees[0].id, 'rate-fee-1');
        assert.strictEqual(serviceRate.rateFees[0].fee, '2');
    });

    test('rateFees prefers the latest duplicate persisted multi-zone fee', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'multi_zone_distance',
        });

        const updatedRule = store.push({
            data: {
                type: 'service-rate-fee',
                id: 'rate-fee-updated',
                attributes: {
                    label: 'Main City',
                    service_area_uuid: 'service-area-1',
                    priority: 10,
                    unit: 'multi_zone_distance',
                    fee: '300',
                    updated_at: new Date('2026-05-22T04:45:00.000Z'),
                },
            },
        });

        const staleRule = store.push({
            data: {
                type: 'service-rate-fee',
                id: 'rate-fee-stale',
                attributes: {
                    label: 'Main City',
                    service_area_uuid: 'service-area-1',
                    priority: 10,
                    unit: 'multi_zone_distance',
                    fee: '0',
                    updated_at: new Date('2026-05-22T04:40:00.000Z'),
                },
            },
        });

        serviceRate.rate_fees.pushObjects([updatedRule, staleRule]);

        assert.strictEqual(serviceRate.rateFees.length, 1);
        assert.strictEqual(serviceRate.rateFees[0].id, 'rate-fee-updated');
        assert.strictEqual(serviceRate.rateFees[0].fee, '300');
    });

    test('parcelFees prefers persisted parcel fees over duplicate unsaved defaults', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'parcel',
        });

        const unsavedDefault = store.createRecord('service-rate-parcel-fee', {
            size: 'small',
            length: 34,
            width: 18,
            height: 10,
            dimensions_unit: 'cm',
            weight: 2,
            weight_unit: 'kg',
            fee: 0,
        });

        const persistedFee = store.push({
            data: {
                type: 'service-rate-parcel-fee',
                id: 'parcel-fee-1',
                attributes: {
                    size: 'small',
                    length: '34',
                    width: '18',
                    height: '10',
                    dimensions_unit: 'cm',
                    weight: '2',
                    weight_unit: 'kg',
                    fee: '5',
                },
            },
        });

        serviceRate.parcel_fees.pushObjects([unsavedDefault, persistedFee]);

        assert.strictEqual(serviceRate.parcelFees.length, 1);
        assert.strictEqual(serviceRate.parcelFees[0].id, 'parcel-fee-1');
        assert.strictEqual(serviceRate.parcelFees[0].fee, '5');
    });

    test('parcelFees prefers the latest duplicate persisted parcel fee in store state', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'parcel',
        });

        const staleFee = store.createRecord('service-rate-parcel-fee', {
            size: 'small',
            length: 34,
            width: 18,
            height: 10,
            dimensions_unit: 'cm',
            weight: 2,
            weight_unit: 'kg',
            fee: '0',
        });
        staleFee.set('id', 'parcel-fee-stale');

        const updatedFee = store.createRecord('service-rate-parcel-fee', {
            size: 'small',
            length: 34,
            width: 18,
            height: 10,
            dimensions_unit: 'cm',
            weight: 2,
            weight_unit: 'kg',
            fee: '12',
        });
        updatedFee.set('id', 'parcel-fee-updated');

        serviceRate.parcel_fees.pushObjects([staleFee, updatedFee]);

        assert.strictEqual(serviceRate.parcelFees.length, 1);
        assert.strictEqual(serviceRate.parcelFees[0].id, 'parcel-fee-updated');
        assert.strictEqual(serviceRate.parcelFees[0].fee, '12');
    });

    test('addPerDropRateFee increments numeric ranges even when existing values are strings', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'per_drop',
            currency: 'USD',
        });

        serviceRate.rate_fees.pushObject(
            store.createRecord('service-rate-fee', {
                min: '1',
                max: '2',
                unit: 'waypoint',
                fee: 100,
            })
        );

        serviceRate.addPerDropRateFee();

        const addedFee = serviceRate.rate_fees[1];

        assert.strictEqual(addedFee.min, 3);
        assert.strictEqual(addedFee.max, 8);
    });

    test('addMultiZoneDistanceRule creates generic geographic pricing rules', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'multi_zone_distance',
            currency: 'SAR',
        });

        serviceRate.addMultiZoneDistanceRule({ label: 'Main City', fee: 250 });
        serviceRate.addMultiZoneDistanceFallbackRule();

        assert.strictEqual(serviceRate.rate_fees.length, 2);
        assert.strictEqual(serviceRate.rate_fees[0].unit, 'multi_zone_distance');
        assert.strictEqual(serviceRate.rate_fees[0].distance_unit, 'km');
        assert.strictEqual(serviceRate.rate_fees[0].currency, 'SAR');
        assert.false(serviceRate.rate_fees[0].is_fallback);
        assert.true(serviceRate.rate_fees[1].is_fallback);
    });

    test('rateFees prefers persisted per-drop fees over duplicate unsaved rows', function (assert) {
        const store = this.owner.lookup('service:store');
        const serviceRate = store.createRecord('service-rate', {
            rate_calculation_method: 'per_drop',
        });

        const unsavedDefault = store.createRecord('service-rate-fee', {
            min: 1,
            max: 5,
            unit: 'waypoint',
            fee: 0,
        });

        const persistedFee = store.push({
            data: {
                type: 'service-rate-fee',
                id: 'rate-fee-1',
                attributes: {
                    min: 1,
                    max: 5,
                    unit: 'waypoint',
                    fee: '5',
                },
            },
        });

        serviceRate.rate_fees.pushObjects([unsavedDefault, persistedFee]);

        assert.strictEqual(serviceRate.rateFees.length, 1);
        assert.strictEqual(serviceRate.rateFees[0].id, 'rate-fee-1');
        assert.strictEqual(serviceRate.rateFees[0].fee, '5');
    });
});
