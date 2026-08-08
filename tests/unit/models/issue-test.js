import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationLoader, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | issue', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'issue', {
            reporter: { kind: 'belongsTo', type: 'user', async: false },
            assignee: { kind: 'belongsTo', type: 'user', async: false },
            vehicle: { kind: 'belongsTo', type: 'vehicle', async: false },
            driver: { kind: 'belongsTo', type: 'driver', async: false },
            order: { kind: 'belongsTo', type: 'order', async: false },
            files: { kind: 'hasMany', type: 'file', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('issue'),
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
            this.store.createRecord('issue'),
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

    test('loadVehicle fetches the vehicle on demand and caches it', async function (assert) {
        await assertRelationLoader(assert, {
            store: this.store,
            build: () => this.store.createRecord('issue'),
            method: 'loadVehicle',
            relationship: 'vehicle',
            idAttribute: 'vehicle_uuid',
            modelName: 'vehicle',
        });
    });

    test('loadDriver fetches the driver on demand and caches it', async function (assert) {
        await assertRelationLoader(assert, {
            store: this.store,
            build: () => this.store.createRecord('issue'),
            method: 'loadDriver',
            relationship: 'driver',
            idAttribute: 'driver_uuid',
            modelName: 'driver',
        });
    });
});
