import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_DAY_MONTH_YEAR_TIME, FIXED_DATE_LONG, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | tracking status', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('tracking-status'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
                updatedAtShort: FIXED_DATE_DAY_MONTH_YEAR_TIME,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('tracking-status'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
                createdAtShort: FIXED_DATE_DAY_MONTH_YEAR_TIME,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
