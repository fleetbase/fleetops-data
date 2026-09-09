import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_PPP, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | warranty', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'warranty', {
            vendor: { kind: 'belongsTo', type: 'vendor', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('warranty'),
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
            this.store.createRecord('warranty'),
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
            this.store.createRecord('warranty'),
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

    test('start_date renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('warranty'),
            'start_date',
            {
                startDate: FIXED_DATE_PPP,
                startDateShort: FIXED_DATE_SHORT,
            },
            {
                startDateAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('end_date renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('warranty'),
            'end_date',
            {
                endDate: FIXED_DATE_PPP,
                endDateShort: FIXED_DATE_SHORT,
            },
            {
                endDateAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
