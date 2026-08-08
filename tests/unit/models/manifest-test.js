import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_DAY_MONTH_YEAR, FIXED_DATE_LONG, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | manifest', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'manifest', {
            driver: { kind: 'belongsTo', type: 'driver', async: false },
            vehicle: { kind: 'belongsTo', type: 'vehicle', async: false },
            stops: { kind: 'hasMany', type: 'manifest-stop', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('scheduled_date renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'scheduled_date',
            {
                scheduledDateFormatted: FIXED_DATE_DAY_MONTH_YEAR,
            },
            {}
        );
    });
});
