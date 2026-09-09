import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | telematic', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'telematic', {
            warranty: { kind: 'belongsTo', type: 'warranty', async: false },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('telematic'), {
            status: 'initialized',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('telematic'),
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
            this.store.createRecord('telematic'),
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
            this.store.createRecord('telematic'),
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

    test('last_seen_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('telematic'),
            'last_seen_at',
            {
                lastSeenAt: FIXED_DATE_LONG,
                lastSeenAtShort: FIXED_DATE_SHORT,
            },
            {
                lastSeenAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
