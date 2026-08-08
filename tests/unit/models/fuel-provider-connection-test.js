import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | fuel provider connection', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'fuel-provider-connection', {
            transactions: { kind: 'hasMany', type: 'fuel-provider-transaction' },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('fuel-provider-connection'), {
            environment: 'production',
            status: 'configured',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('fuel-provider-connection'),
            'updated_at',
            {},
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
