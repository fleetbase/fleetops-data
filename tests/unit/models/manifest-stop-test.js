import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_TIME, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | manifest stop', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'manifest-stop', {
            manifest: { kind: 'belongsTo', type: 'manifest', async: false, inverse: 'stops' },
            order: { kind: 'belongsTo', type: 'order', async: false },
            place: { kind: 'belongsTo', type: 'place', async: false },
        });
    });

    test('estimated_arrival renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest-stop'),
            'estimated_arrival',
            {
                estimatedArrivalFormatted: FIXED_DATE_TIME,
            },
            {}
        );
    });

    test('actual_arrival renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest-stop'),
            'actual_arrival',
            {
                actualArrivalFormatted: FIXED_DATE_TIME,
            },
            {}
        );
    });
});
