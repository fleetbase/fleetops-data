import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | sensor', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'sensor', {
            telematic: { kind: 'belongsTo', type: 'telematic', async: false },
            device: { kind: 'belongsTo', type: 'device', async: false },
            warranty: { kind: 'belongsTo', type: 'warranty', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('sensor'), {
            status: 'inactive',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('sensor'),
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
            this.store.createRecord('sensor'),
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

    test('deleted_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('sensor'),
            'deleted_at',
            {
                deletedAt: FIXED_DATE_LONG,
                deletedAtShort: FIXED_DATE_SHORT,
            },
            {
                deletedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('last_reading_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('sensor'),
            'last_reading_at',
            {
                lastReadingAt: FIXED_DATE_LONG,
                lastReadingAtShort: FIXED_DATE_SHORT,
            },
            {
                lastReadingAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
