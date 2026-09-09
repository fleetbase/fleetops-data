import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';
import {
    FIXED_DATE_LONG,
    FIXED_DATE_SHORT,
    THREE_DAYS_DISTANCE,
    assertDateGetters,
    assertDefaults,
    assertPointAccessors,
    assertRelationLoader,
    assertRelationships,
} from 'dummy/tests/helpers/model-contract';

module('Unit | Model | driver', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'driver', {
            user: { kind: 'belongsTo', type: 'user', async: true },
            fleets: { kind: 'hasMany', type: 'fleet', async: true },
            devices: { kind: 'hasMany', type: 'user-device', async: true },
            jobs: { kind: 'hasMany', type: 'order', async: true },
            vehicle: { kind: 'belongsTo', type: 'vehicle', async: true },
            current_job: { kind: 'belongsTo', type: 'order', async: true },
            vendor: { kind: 'belongsTo', type: 'vendor', async: true },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
            schedules: { kind: 'hasMany', type: 'schedule', async: true },
            schedule_items: { kind: 'hasMany', type: 'schedule-item', async: true },
            availabilities: { kind: 'hasMany', type: 'schedule-availability', async: true },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('driver'), {
            status: 'available',
        });
    });

    test('image defaults come from application configuration rather than being hard-coded', function (assert) {
        const record = this.store.createRecord('driver');

        assert.strictEqual(record.photo_url, ENV.defaultValues.driverImage, 'photo_url falls back to defaultValues.driverImage');
        assert.strictEqual(record.vehicle_avatar, ENV.defaultValues.vehicleAvatar, 'vehicle_avatar falls back to defaultValues.vehicleAvatar');
        assert.strictEqual(record.avatar_url, ENV.defaultValues.driverAvatar, 'avatar_url falls back to defaultValues.driverAvatar');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('driver'),
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
            this.store.createRecord('driver'),
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
        assertPointAccessors(assert, this.store.createRecord('driver'), { attribute: 'location' });
    });

    module('display', function () {
        test('photoUrl uses the driver photo when the server supplied one', function (assert) {
            const driver = this.store.createRecord('driver', { photo_url: 'https://cdn.example/ada.png' });

            assert.strictEqual(driver.photoUrl, 'https://cdn.example/ada.png');
        });

        test('photoUrl falls back to the configured default image', function (assert) {
            const driver = this.store.createRecord('driver');
            driver.set('photo_url', null);

            assert.strictEqual(driver.photoUrl, ENV.defaultValues.driverImage);
        });

        test('displayName prefers the name and falls back to the public id', function (assert) {
            const driver = this.store.createRecord('driver', { name: 'Ada Lovelace', public_id: 'driver_1' });
            assert.strictEqual(driver.displayName, 'Ada Lovelace');

            driver.set('name', null);
            assert.strictEqual(driver.displayName, 'driver_1');
        });
    });

    module('activeJobs', function () {
        test('it excludes jobs that have finished', function (assert) {
            const driver = this.store.createRecord('driver');
            const statuses = ['created', 'dispatched', 'completed', 'canceled'];

            driver.jobs.pushObjects(statuses.map((status) => this.store.createRecord('order', { status })));

            assert.deepEqual(
                driver.activeJobs.map((order) => order.status),
                ['created', 'dispatched'],
                'completed and canceled work is not active'
            );
        });

        test('a driver with no jobs has none active', function (assert) {
            assert.deepEqual(this.store.createRecord('driver').activeJobs, []);
        });
    });

    module('relationship loading', function () {
        test('loadVehicle fetches the assigned vehicle on demand', async function (assert) {
            await assertRelationLoader(assert, {
                store: this.store,
                build: () => this.store.createRecord('driver'),
                method: 'loadVehicle',
                relationship: 'vehicle',
                idAttribute: 'vehicle_uuid',
                modelName: 'vehicle',
            });
        });

        test('loadVendor fetches the employing vendor on demand', async function (assert) {
            await assertRelationLoader(assert, {
                store: this.store,
                build: () => this.store.createRecord('driver'),
                method: 'loadVendor',
                relationship: 'vendor',
                idAttribute: 'vendor_uuid',
                modelName: 'vendor',
            });
        });
    });
});
