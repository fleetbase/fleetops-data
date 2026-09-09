import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import {
    FIXED_DATE_LONG,
    FIXED_DATE_SHORT,
    FIXED_DATE_SHORT_YEAR,
    THREE_DAYS_DISTANCE,
    THREE_DAYS_DISTANCE_SUFFIXED,
    assertDateGetters,
    assertRelationships,
} from 'dummy/tests/helpers/model-contract';

module('Unit | Model | maintenance schedule', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'maintenance-schedule', {
            subject: { kind: 'belongsTo', type: 'maintenance-subject', async: false, polymorphic: true },
            default_assignee: { kind: 'belongsTo', type: 'facilitator', async: false, polymorphic: true },
        });
    });

    test('next_due_date renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance-schedule'),
            'next_due_date',
            {
                nextDueAt: FIXED_DATE_LONG,
                nextDueAtShort: FIXED_DATE_SHORT_YEAR,
            },
            {
                nextDueAgo: THREE_DAYS_DISTANCE_SUFFIXED,
            }
        );
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance-schedule'),
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
            this.store.createRecord('maintenance-schedule'),
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

    test('isActive and isPaused follow the schedule status', function (assert) {
        const schedule = this.store.createRecord('maintenance-schedule');

        assert.false(schedule.isActive);
        assert.false(schedule.isPaused);

        schedule.set('status', 'active');
        assert.true(schedule.isActive);
        assert.false(schedule.isPaused);

        schedule.set('status', 'paused');
        assert.false(schedule.isActive);
        assert.true(schedule.isPaused);
    });
});
