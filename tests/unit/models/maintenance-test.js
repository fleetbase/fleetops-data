import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | maintenance', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'maintenance', {
            maintainable: { kind: 'belongsTo', type: 'maintenance-subject', async: false, polymorphic: true },
            performed_by: { kind: 'belongsTo', type: 'facilitator', async: false, polymorphic: true },
            work_order: { kind: 'belongsTo', type: 'work-order', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance'),
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
            this.store.createRecord('maintenance'),
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
            this.store.createRecord('maintenance'),
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

    test('scheduled_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance'),
            'scheduled_at',
            {
                scheduledAt: FIXED_DATE_LONG,
                scheduledAtShort: FIXED_DATE_SHORT,
            },
            {
                scheduledAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('started_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance'),
            'started_at',
            {
                startedAt: FIXED_DATE_LONG,
                startedAtShort: FIXED_DATE_SHORT,
            },
            {
                startedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('completed_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance'),
            'completed_at',
            {
                completedAt: FIXED_DATE_LONG,
                completedAtShort: FIXED_DATE_SHORT,
            },
            {
                completedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
