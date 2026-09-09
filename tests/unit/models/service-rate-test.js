import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

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

        // `rate_fees` is an async hasMany, so it is a PromiseManyArray rather
        // than an indexable array until it is materialized.
        const addedFee = serviceRate.rate_fees.toArray()[1];

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

        // `rate_fees` is an async hasMany, so it is a PromiseManyArray rather
        // than an indexable array until it is materialized.
        const fees = serviceRate.rate_fees.toArray();

        assert.strictEqual(fees.length, 2);
        assert.strictEqual(fees[0].unit, 'multi_zone_distance');
        assert.strictEqual(fees[0].distance_unit, 'km');
        assert.strictEqual(fees[0].currency, 'SAR');
        assert.false(fees[0].is_fallback);
        assert.true(fees[1].is_fallback);
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

    module('schema and formatting', function () {
        test('relationships target the right models with the right loading strategy', function (assert) {
            const store = this.owner.lookup('service:store');

            assertRelationships(assert, store, 'service-rate', {
                rate_fees: { kind: 'hasMany', type: 'service-rate-fee' },
                parcel_fees: { kind: 'hasMany', type: 'service-rate-parcel-fee' },
                service_area: { kind: 'belongsTo', type: 'service-area' },
                order_config: { kind: 'belongsTo', type: 'order-config' },
                zone: { kind: 'belongsTo', type: 'zone' },
                custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
            });
        });

        test('a new rate defaults to a one kilometre maximum distance', function (assert) {
            assertDefaults(assert, this.owner.lookup('service:store').createRecord('service-rate'), {
                max_distance_unit: 'km',
                max_distance: 1,
            });
        });

        test('updated_at renders its formatting getters', function (assert) {
            assertDateGetters(
                assert,
                this.owner.lookup('service:store').createRecord('service-rate'),
                'updated_at',
                { updatedAt: FIXED_DATE_LONG, updatedAtShort: FIXED_DATE_SHORT },
                { updatedAgo: THREE_DAYS_DISTANCE }
            );
        });

        test('created_at renders its formatting getters', function (assert) {
            assertDateGetters(
                assert,
                this.owner.lookup('service:store').createRecord('service-rate'),
                'created_at',
                { createdAt: FIXED_DATE_LONG, createdAtShort: FIXED_DATE_SHORT },
                { createdAgo: THREE_DAYS_DISTANCE }
            );
        });
    });

    module('rate calculation method flags', function () {
        const FLAGS = {
            fixed_meter: ['isFixedMeter', 'isFixedRate'],
            fixed_rate: ['isFixedMeter', 'isFixedRate'],
            per_meter: ['isPerMeter'],
            multi_zone_distance: ['isMultiZoneDistance'],
            per_drop: ['isPerDrop'],
            algo: ['isAlgorithm'],
            parcel: ['isParcelService'],
        };
        const ALL = ['isFixedMeter', 'isFixedRate', 'isPerMeter', 'isMultiZoneDistance', 'isPerDrop', 'isAlgorithm', 'isParcelService'];

        test('each calculation method lights exactly its own flags', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            for (const [method, expected] of Object.entries(FLAGS)) {
                serviceRate.set('rate_calculation_method', method);

                for (const flag of ALL) {
                    assert.strictEqual(serviceRate[flag], expected.includes(flag), `${flag} is ${expected.includes(flag)} for ${method}`);
                }
            }
        });

        test('fixed_meter and fixed_rate are deliberately interchangeable', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { rate_calculation_method: 'fixed_meter' });

            assert.true(serviceRate.isFixedRate, 'a fixed-meter rate is also a fixed rate');
        });

        test('an unrecognized method lights no flag', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { rate_calculation_method: 'surge' });

            for (const flag of ALL) {
                assert.false(serviceRate[flag], `${flag} is false`);
            }
        });
    });

    module('surcharge method flags', function () {
        test('peak hours flags follow the configured calculation method', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            assert.false(serviceRate.hasPeakHoursFlatFee);
            assert.false(serviceRate.hasPeakHoursPercentageFee);

            serviceRate.set('peak_hours_calculation_method', 'flat');
            assert.true(serviceRate.hasPeakHoursFlatFee);
            assert.false(serviceRate.hasPeakHoursPercentageFee);

            serviceRate.set('peak_hours_calculation_method', 'percentage');
            assert.false(serviceRate.hasPeakHoursFlatFee);
            assert.true(serviceRate.hasPeakHoursPercentageFee);
        });

        test('cash-on-delivery flags follow the configured calculation method', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            assert.false(serviceRate.hasCodFlatFee);
            assert.false(serviceRate.hasCodPercentageFee);

            serviceRate.set('cod_calculation_method', 'flat');
            assert.true(serviceRate.hasCodFlatFee);

            serviceRate.set('cod_calculation_method', 'percentage');
            assert.true(serviceRate.hasCodPercentageFee);
            assert.false(serviceRate.hasCodFlatFee);
        });
    });

    module('rateFees edge cases', function () {
        test('deleted fees are excluded from every calculation method', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'per_drop' });
            const fee = store.push({ data: { type: 'service-rate-fee', id: 'fee_1', attributes: { min: 1, max: 5, unit: 'waypoint' } } });

            serviceRate.rate_fees.pushObject(fee);
            fee.deleteRecord();

            assert.deepEqual(serviceRate.rateFees, [], 'a fee marked for deletion is no longer priced');
        });

        test('a fixed-distance rate with no max_distance prices nothing', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'fixed_rate', max_distance: null });

            serviceRate.rate_fees.pushObject(store.createRecord('service-rate-fee', { distance: 0, fee: 100 }));

            assert.deepEqual(serviceRate.rateFees, [], 'zero kilometres of coverage means no applicable band');
        });

        test('fixed-distance fees with no distance at all are skipped', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'fixed_rate', max_distance: 5 });

            serviceRate.rate_fees.pushObjects([store.createRecord('service-rate-fee', { fee: 100 }), store.createRecord('service-rate-fee', { distance: 1, fee: 200 })]);

            assert.deepEqual(
                serviceRate.rateFees.map((fee) => fee.distance),
                [1],
                'a band with no distance cannot be placed on the scale'
            );
        });

        test('multi-zone rules are grouped by zone as well as by service area', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'multi_zone_distance' });

            serviceRate.rate_fees.pushObjects([
                store.createRecord('service-rate-fee', { label: 'A', unit: 'multi_zone_distance', priority: 10, zone_uuid: 'zone_1' }),
                store.createRecord('service-rate-fee', { label: 'A', unit: 'multi_zone_distance', priority: 10, zone_uuid: 'zone_2' }),
            ]);

            assert.strictEqual(serviceRate.rateFees.length, 2, 'two zones are two distinct rules, not duplicates');
        });

        test('a multi-zone rule with no geography of its own is grouped as unassigned', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'multi_zone_distance' });

            serviceRate.rate_fees.pushObjects([
                store.createRecord('service-rate-fee', { label: 'A', unit: 'multi_zone_distance', priority: 10 }),
                store.createRecord('service-rate-fee', { label: 'A', unit: 'multi_zone_distance', priority: 10 }),
            ]);

            assert.strictEqual(serviceRate.rateFees.length, 1, 'two ungeographed rules with the same label collapse');
        });

        test('parcelFees drops duplicates that differ only by persistence', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'parcel' });

            serviceRate.parcel_fees.pushObject(store.createRecord('service-rate-parcel-fee', { size: 'small', fee: 0 }));
            assert.strictEqual(serviceRate.parcelFees.length, 1);

            const deleted = store.push({ data: { type: 'service-rate-parcel-fee', id: 'pf_1', attributes: { size: 'large' } } });
            deleted.deleteRecord();
            serviceRate.parcel_fees.pushObject(deleted);

            assert.strictEqual(serviceRate.parcelFees.length, 1, 'a parcel fee marked for deletion is not priced');
        });
    });

    module('fee builders', function () {
        test('createDefaultPerDropFee builds a one-to-five drop band in the rate currency', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { currency: 'SGD' });
            const fee = serviceRate.createDefaultPerDropFee();

            assert.strictEqual(fee.min, 1);
            assert.strictEqual(fee.max, 5);
            assert.strictEqual(fee.fee, 0);
            assert.strictEqual(fee.unit, 'waypoint');
            assert.strictEqual(fee.currency, 'SGD');
        });

        test('createDefaultPerDropFee lets the caller override any field', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { currency: 'SGD' });
            const fee = serviceRate.createDefaultPerDropFee({ min: 6, max: 10, fee: 250 });

            assert.strictEqual(fee.min, 6);
            assert.strictEqual(fee.max, 10);
            assert.strictEqual(fee.fee, 250);
            assert.strictEqual(fee.unit, 'waypoint', 'unspecified fields keep their defaults');
        });

        test('addPerDropRateFee starts the first band at one', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { currency: 'SGD' });
            const fee = serviceRate.addPerDropRateFee();

            assert.strictEqual(fee.min, 1);
            assert.strictEqual(fee.max, 6);
            assert.strictEqual(fee.currency, 'SGD');
            assert.strictEqual(serviceRate.rate_fees.toArray().length, 1, 'and attaches it to the rate');
        });

        test('addPerDropRateFee continues from a previous band whose max cannot be read as a number', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate');

            serviceRate.rate_fees.pushObject(store.createRecord('service-rate-fee', { min: 1, max: 'unbounded', unit: 'waypoint' }));

            const fee = serviceRate.addPerDropRateFee();

            assert.strictEqual(fee.min, 1, 'an unreadable maximum is treated as zero, so the next band starts at one');
            assert.strictEqual(fee.max, 6);
        });

        test('removePerDropFee detaches and destroys the fee', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate');
            const fee = serviceRate.addPerDropRateFee();

            serviceRate.removePerDropFee(fee);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 0);
            assert.true(fee.isDeleted);
        });

        test('removePerDropFee ignores anything that is not a record', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');
            serviceRate.addPerDropRateFee();

            serviceRate.removePerDropFee();
            serviceRate.removePerDropFee({ min: 1 });

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 1, 'the real fee is left alone');
        });

        test('resetPerDropFees replaces every drop band with a single default', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate');
            const distanceFee = store.createRecord('service-rate-fee', { distance: 1, fee: 100 });

            serviceRate.addPerDropRateFee();
            serviceRate.addPerDropRateFee();
            serviceRate.rate_fees.pushObject(distanceFee);

            serviceRate.resetPerDropFees();

            const fees = serviceRate.rate_fees.toArray();

            assert.strictEqual(fees.length, 2, 'one default drop band plus the untouched distance fee');
            assert.true(fees.includes(distanceFee), 'fees of other units are not swept up');
            assert.deepEqual(
                fees.filter((fee) => fee.unit === 'waypoint').map((fee) => [fee.min, fee.max]),
                [[1, 5]]
            );
        });
    });

    module('multi-zone rule builders', function () {
        test('addMultiZoneDistanceRule creates a kilometre-based rule at the next priority', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate', { currency: 'SAR' });

            serviceRate.addMultiZoneDistanceRule();

            const [rule] = serviceRate.rate_fees.toArray();

            assert.strictEqual(rule.label, 'Distance rule');
            assert.strictEqual(rule.priority, 10, 'the first rule starts at ten');
            assert.strictEqual(rule.distance_unit, 'km');
            assert.strictEqual(rule.unit, 'multi_zone_distance');
            assert.strictEqual(rule.currency, 'SAR');
            assert.false(rule.is_fallback);
        });

        test('each new rule takes priority over the last', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            serviceRate.addMultiZoneDistanceRule();
            serviceRate.addMultiZoneDistanceRule();

            assert.deepEqual(
                serviceRate.rate_fees.toArray().map((rule) => rule.priority),
                [10, 20]
            );
        });

        test('priorities are counted only across multi-zone rules', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate');

            serviceRate.rate_fees.pushObject(store.createRecord('service-rate-fee', { unit: 'waypoint', priority: 500 }));
            serviceRate.addMultiZoneDistanceRule();

            assert.strictEqual(serviceRate.rate_fees.toArray()[1].priority, 10, 'a drop band does not inflate the multi-zone ladder');
        });

        test('a rule whose priority cannot be read as a number does not break the ladder', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate');

            serviceRate.rate_fees.pushObject(store.createRecord('service-rate-fee', { unit: 'multi_zone_distance', priority: 'highest' }));
            serviceRate.addMultiZoneDistanceRule();

            assert.strictEqual(serviceRate.rate_fees.toArray()[1].priority, 10);
        });

        test('addMultiZoneDistanceFallbackRule creates the catch-all rule at priority zero', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            serviceRate.addMultiZoneDistanceFallbackRule();

            const [fallback] = serviceRate.rate_fees.toArray();

            assert.strictEqual(fallback.label, 'Fallback distance');
            assert.strictEqual(fallback.priority, 0, 'the fallback is considered last');
            assert.true(fallback.is_fallback);
        });

        test('a second fallback is refused and the existing one is returned', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            serviceRate.addMultiZoneDistanceFallbackRule();
            const [existing] = serviceRate.rate_fees.toArray();

            assert.strictEqual(serviceRate.addMultiZoneDistanceFallbackRule(), existing, 'the existing fallback is handed back');
            assert.strictEqual(serviceRate.rate_fees.toArray().length, 1, 'and no duplicate is created');
        });

        test('a deleted fallback does not block creating a new one', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            serviceRate.addMultiZoneDistanceFallbackRule();
            serviceRate.removeMultiZoneDistanceRule(serviceRate.rate_fees.toArray()[0]);

            serviceRate.addMultiZoneDistanceFallbackRule();

            assert.strictEqual(serviceRate.rate_fees.toArray().filter((rule) => rule.is_fallback && !rule.isDeleted).length, 1, 'exactly one live fallback remains');
        });

        test('removeMultiZoneDistanceRule detaches and destroys the rule', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');

            serviceRate.addMultiZoneDistanceRule();
            const [rule] = serviceRate.rate_fees.toArray();

            serviceRate.removeMultiZoneDistanceRule(rule);

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 0);
            assert.true(rule.isDeleted);
        });

        test('removeMultiZoneDistanceRule ignores anything that is not a record', function (assert) {
            const serviceRate = this.owner.lookup('service:store').createRecord('service-rate');
            serviceRate.addMultiZoneDistanceRule();

            serviceRate.removeMultiZoneDistanceRule();
            serviceRate.removeMultiZoneDistanceRule({ label: 'not a record' });

            assert.strictEqual(serviceRate.rate_fees.toArray().length, 1);
        });
    });

    module('rateFees ranking edge cases', function () {
        test('multi-zone rules with an unreadable priority sort as zero', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'multi_zone_distance' });

            serviceRate.rate_fees.pushObjects([
                store.createRecord('service-rate-fee', { label: 'Unranked', unit: 'multi_zone_distance', priority: 'highest' }),
                store.createRecord('service-rate-fee', { label: 'Main City', unit: 'multi_zone_distance', priority: 20 }),
            ]);

            assert.deepEqual(
                serviceRate.rateFees.map((fee) => fee.label),
                ['Main City', 'Unranked'],
                'an unreadable priority sinks to the bottom rather than breaking the sort'
            );
        });

        test('a per-drop draft seen after its persisted twin does not displace it', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'per_drop' });
            const persisted = store.push({ data: { type: 'service-rate-fee', id: 'fee_1', attributes: { min: 1, max: 5, unit: 'waypoint', fee: '5' } } });

            serviceRate.rate_fees.pushObjects([persisted, store.createRecord('service-rate-fee', { min: 1, max: 5, unit: 'waypoint', fee: 0 })]);

            assert.strictEqual(serviceRate.rateFees.length, 1);
            assert.strictEqual(serviceRate.rateFees[0].id, 'fee_1', 'the lower-ranked draft is discarded even though it came second');
        });
    });

    module('remaining ranking edges', function () {
        test('per-drop bands with no minimum sort as zero', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'per_drop' });

            // Three bands, two of them without a minimum, so the comparator sees a
            // missing minimum on both sides of the comparison.
            serviceRate.rate_fees.pushObjects([
                store.createRecord('service-rate-fee', { min: 6, max: 10, unit: 'waypoint' }),
                store.createRecord('service-rate-fee', { max: 5, unit: 'waypoint' }),
                store.createRecord('service-rate-fee', { max: 20, unit: 'waypoint' }),
            ]);

            assert.deepEqual(
                serviceRate.rateFees.map((fee) => fee.max),
                [5, 20, 10],
                'bands with no minimum sort to the front rather than breaking the sort'
            );
        });

        test('multi-zone rules all sort even when several priorities are unreadable', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'multi_zone_distance' });

            serviceRate.rate_fees.pushObjects([
                store.createRecord('service-rate-fee', { label: 'A', unit: 'multi_zone_distance', priority: 'high', zone_uuid: 'z1' }),
                store.createRecord('service-rate-fee', { label: 'B', unit: 'multi_zone_distance', priority: 'low', zone_uuid: 'z2' }),
                store.createRecord('service-rate-fee', { label: 'C', unit: 'multi_zone_distance', priority: 20, zone_uuid: 'z3' }),
            ]);

            assert.strictEqual(serviceRate.rateFees[0].label, 'C', 'the only readable priority wins');
            assert.strictEqual(serviceRate.rateFees.length, 3);
        });

        test('a parcel draft seen after its persisted twin does not displace it', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceRate = store.createRecord('service-rate', { rate_calculation_method: 'parcel' });
            const persisted = store.push({
                data: {
                    type: 'service-rate-parcel-fee',
                    id: 'pf_1',
                    attributes: { size: 'small', length: 34, width: 18, height: 10, dimensions_unit: 'cm', weight: 2, weight_unit: 'kg', fee: '5' },
                },
            });

            serviceRate.parcel_fees.pushObjects([
                persisted,
                store.createRecord('service-rate-parcel-fee', { size: 'small', length: 34, width: 18, height: 10, dimensions_unit: 'cm', weight: 2, weight_unit: 'kg', fee: 0 }),
            ]);

            assert.strictEqual(serviceRate.parcelFees.length, 1);
            assert.strictEqual(serviceRate.parcelFees[0].id, 'pf_1', 'the lower-ranked draft is discarded even though it came second');
        });
    });
});
