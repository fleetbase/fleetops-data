import { module, test } from 'qunit';
import buildIdentityStub from '@fleetbase/fleetops-data/utils/identity-stub';

module('Unit | Utility | identity-stub', function () {
    test('it names the stub from the row, an explicit name, or not at all', function (assert) {
        const stub = buildIdentityStub({ driver_name: 'Ada' }, { type: 'driver' });

        assert.strictEqual(stub.name, 'Ada');
        assert.strictEqual(stub.displayName, 'Ada');
        assert.strictEqual(stub.display_name, 'Ada');
        assert.strictEqual(stub.resourceType, 'driver');
        assert.true(stub.isIdentityStub);

        assert.strictEqual(buildIdentityStub({ pickupName: 'Depot' }, { type: 'place', nameKey: 'pickupName' }).name, 'Depot');
        assert.strictEqual(buildIdentityStub(null, { type: 'place', name: 'Depot', extra: { city: 'SG' } }).city, 'SG');
        assert.strictEqual(buildIdentityStub({}, { type: 'driver' }), null, 'a row without the name has no stub');
        assert.strictEqual(buildIdentityStub(null, { type: 'driver' }), null, 'no row, no stub');
    });

    test('loadResource resolves to null without a loader', async function (assert) {
        const stub = buildIdentityStub({ driver_name: 'Ada' }, { type: 'driver' });

        assert.strictEqual(await stub.loadResource(), null);
    });

    test('concurrent loads of one row share a request, a failed load resolves to null, and a later load runs again', async function (assert) {
        const row = { driver_name: 'Ada' };
        const record = { id: 'driver_1' };
        let calls = 0;
        const stub = buildIdentityStub(row, {
            type: 'driver',
            load: () => {
                calls++;
                return calls === 2 ? Promise.reject(new Error('offline')) : record;
            },
        });

        const [first, second] = await Promise.all([stub.loadResource(), stub.loadResource()]);
        assert.strictEqual(first, record);
        assert.strictEqual(second, record);
        assert.strictEqual(calls, 1, 'one request for both callers');

        assert.strictEqual(await stub.loadResource(), null, 'the failed second load resolves to null');
        assert.strictEqual(calls, 2);

        assert.strictEqual(await stub.loadResource(), record, 'the third load runs afresh');
        assert.strictEqual(calls, 3);
    });

    test('two stubs of different types on one row load independently', async function (assert) {
        const row = { driver_name: 'Ada', vehicle_name: 'Truck' };
        const driver = buildIdentityStub(row, { type: 'driver', load: () => 'D' });
        const vehicle = buildIdentityStub(row, { type: 'vehicle', load: () => 'V' });

        assert.deepEqual(await Promise.all([driver.loadResource(), vehicle.loadResource()]), ['D', 'V']);
    });
});
