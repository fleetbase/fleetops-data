import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertPointAccessors, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | vehicle', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'vehicle', {
            driver: { kind: 'belongsTo', type: 'driver', async: false },
            vendor: { kind: 'belongsTo', type: 'vendor', async: false },
            devices: { kind: 'hasMany', type: 'device', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('vehicle'), {
            measurement_system: 'km',
            odometer_unit: 'km',
            status: 'available',
        });
    });

    test('image defaults come from application configuration rather than being hard-coded', function (assert) {
        const record = this.store.createRecord('vehicle');

        assert.strictEqual(record.photo_url, ENV.defaultValues.vehicleImage, 'photo_url falls back to defaultValues.vehicleImage');
        assert.strictEqual(record.avatar_url, ENV.defaultValues.vehicleAvatar, 'avatar_url falls back to defaultValues.vehicleAvatar');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('vehicle'),
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
            this.store.createRecord('vehicle'),
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

    test('the GeoJSON point accessors read the location attribute', function (assert) {
        assertPointAccessors(assert, this.store.createRecord('vehicle'), { attribute: 'location' });
    });

    module('display', function () {
        test('displayName prefers the name and falls back to the server display name', function (assert) {
            const vehicle = this.store.createRecord('vehicle', { name: 'Van 1', display_name: '2020 Ford Transit' });
            assert.strictEqual(vehicle.displayName, 'Van 1');

            vehicle.set('name', null);
            assert.strictEqual(vehicle.displayName, '2020 Ford Transit');
        });

        test('displayName is undefined when neither is set', function (assert) {
            assert.strictEqual(this.store.createRecord('vehicle').displayName, undefined);
        });

        test('yearMakeModel joins the parts that are present', function (assert) {
            assert.strictEqual(this.store.createRecord('vehicle', { year: '2020', make: 'Ford', model: 'Transit' }).yearMakeModel, '2020 Ford Transit');
        });

        test('yearMakeModel omits missing parts rather than leaving gaps', function (assert) {
            assert.strictEqual(this.store.createRecord('vehicle', { make: 'Ford' }).yearMakeModel, 'Ford');
            assert.strictEqual(this.store.createRecord('vehicle').yearMakeModel, '', 'a vehicle with no identity renders as empty');
        });

        test('searchString gathers every identifier a user might search by', function (assert) {
            const vehicle = this.store.createRecord('vehicle', {
                name: 'Van 1',
                display_name: 'Fleet Van 1',
                vin: 'VIN123',
                serial_number: 'SN1',
                call_sign: 'Alpha',
                plate_number: 'SGX1234A',
                year: '2020',
                make: 'Ford',
                model: 'Transit',
            });

            assert.strictEqual(vehicle.searchString, 'Van 1 Fleet Van 1 VIN123 SN1 Alpha SGX1234A 2020 Ford Transit');
        });

        test('searchString skips the identifiers a vehicle does not have', function (assert) {
            assert.strictEqual(this.store.createRecord('vehicle', { name: 'Van 1' }).searchString, 'Van 1');
        });
    });

    module('relationship loading', function () {
        test('loadDriver fetches the assigned driver and caches it', async function (assert) {
            const calls = [];
            const driver = this.store.createRecord('driver');
            this.store.findRecord = (...args) => {
                calls.push(args);
                return Promise.resolve(driver);
            };

            const vehicle = this.store.createRecord('vehicle');
            vehicle.set('driver_uuid', 'drv_1');

            assert.strictEqual(await vehicle.loadDriver(), driver);
            assert.strictEqual(vehicle.driver, driver, 'the driver is attached to the vehicle');
            assert.deepEqual(calls[0], ['driver', 'drv_1']);
        });

        test('loadDriver does nothing when no driver is assigned', async function (assert) {
            const calls = [];
            this.store.findRecord = (...args) => {
                calls.push(args);
                return Promise.resolve(null);
            };

            assert.strictEqual(await this.store.createRecord('vehicle').loadDriver(), undefined);
            assert.deepEqual(calls, [], 'no request is made');
        });

        test('loadDevices queries the devices attached to this vehicle', async function (assert) {
            const calls = [];
            const devices = [this.store.createRecord('device')];
            this.store.query = (...args) => {
                calls.push(args);
                return Promise.resolve(devices);
            };

            const vehicle = this.store.push(this.store.normalize('vehicle', { uuid: 'veh_1' }));

            assert.strictEqual(await vehicle.loadDevices(), devices);
            assert.deepEqual(calls[0], ['device', { vehicle_uuid: 'veh_1' }]);
            assert.strictEqual(vehicle.devices.length, 1, 'the devices land on the vehicle');
        });
    });
});
