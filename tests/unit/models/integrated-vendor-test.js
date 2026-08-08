import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_PPP, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | integrated vendor', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('integrated-vendor'), {
            isIntegratedVendor: true,
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('integrated-vendor'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_PPP,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            },
            // These getters have no isValidDate guard, so a missing date throws
            // rather than rendering as null.
            { guarded: false }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('integrated-vendor'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            },
            // These getters have no isValidDate guard, so a missing date throws
            // rather than rendering as null.
            { guarded: false }
        );
    });

    test('createdAt is null for an integrated vendor that was never saved', function (assert) {
        assert.strictEqual(this.store.createRecord('integrated-vendor').createdAt, null);
    });
});
