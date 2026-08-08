import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | work order', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'work-order', {
            target: { kind: 'belongsTo', type: 'maintenance-subject', async: false, polymorphic: true },
            assignee: { kind: 'belongsTo', type: 'facilitator', async: false, polymorphic: true },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('work-order'),
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
            this.store.createRecord('work-order'),
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
            this.store.createRecord('work-order'),
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

    test('opened_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('work-order'),
            'opened_at',
            {
                openedAt: FIXED_DATE_LONG,
                openedAtShort: FIXED_DATE_SHORT,
            },
            {
                openedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('due_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('work-order'),
            'due_at',
            {
                dueAt: FIXED_DATE_LONG,
                dueAtShort: FIXED_DATE_SHORT,
            },
            {
                dueAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('closed_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('work-order'),
            'closed_at',
            {
                closedAt: FIXED_DATE_LONG,
                closedAtShort: FIXED_DATE_SHORT,
            },
            {
                closedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
