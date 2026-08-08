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
});
