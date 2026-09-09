import isRelationMissing from '@fleetbase/fleetops-data/utils/is-relation-missing';
import shouldNotLoadRelation from '@fleetbase/fleetops-data/utils/should-not-load-relation';
import { setupTest } from 'dummy/tests/helpers';
import { module, test } from 'qunit';

/**
 * `isRelationMissing` is the guard the driver, fuel-report and issue loaders
 * open with. It answers "do I still need to fetch this?" and says yes only when
 * there is an identifier to fetch by and the related record is not in hand.
 */
module('Unit | Utility | is-relation-missing', function (hooks) {
    setupTest(hooks);

    test('a relationship with no identifier is not missing, because there is nothing to fetch', function (assert) {
        const driver = this.owner.lookup('service:store').createRecord('driver');

        assert.false(isRelationMissing(driver, 'vehicle'));
    });

    test('an identifier with nothing loaded yet is missing', function (assert) {
        const driver = this.owner.lookup('service:store').createRecord('driver', { vehicle_uuid: 'veh_1' });

        assert.true(isRelationMissing(driver, 'vehicle'), 'the fetch is worth making');
    });

    test('an already-loaded relationship is not missing, even when it is async', function (assert) {
        const store = this.owner.lookup('service:store');
        const driver = store.createRecord('driver', { vehicle_uuid: 'veh_1' });

        driver.set('vehicle', store.push(store.normalize('vehicle', { uuid: 'veh_1' })));

        assert.false(isRelationMissing(driver, 'vehicle'), 'the record is already in hand');
    });

    test('an explicit identifier attribute is honoured', function (assert) {
        const subject = { driver_assigned_uuid: 'drv_1', driver_uuid: null };

        assert.true(isRelationMissing(subject, 'driver', 'driver_assigned_uuid'));
        assert.false(isRelationMissing(subject, 'driver'), 'the derived key says there is nothing to fetch');
    });

    test('it is the exact negation of shouldNotLoadRelation', function (assert) {
        const store = this.owner.lookup('service:store');
        const cases = [store.createRecord('issue'), store.createRecord('issue', { vehicle_uuid: 'veh_1' }), { vehicle_uuid: 'veh_1', vehicle: {} }];

        for (const subject of cases) {
            assert.strictEqual(isRelationMissing(subject, 'vehicle'), !shouldNotLoadRelation(subject, 'vehicle'));
        }
    });
});
