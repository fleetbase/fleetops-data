import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | fuel provider transaction', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'fuel-provider-transaction', {
            connection: { kind: 'belongsTo', type: 'fuel-provider-connection' },
            fuel_report: { kind: 'belongsTo', type: 'fuel-report' },
            vehicle: { kind: 'belongsTo', type: 'vehicle' },
            driver: { kind: 'belongsTo', type: 'driver' },
            order: { kind: 'belongsTo', type: 'order' },
        });
    });

    test('transaction_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('fuel-provider-transaction'),
            'transaction_at',
            {
                transactionAt: FIXED_DATE_LONG,
            },
            {}
        );
    });

    test('isMatched is true only once the transaction has been reconciled', function (assert) {
        const transaction = this.store.createRecord('fuel-provider-transaction');

        assert.false(transaction.isMatched);

        transaction.set('sync_status', 'pending');
        assert.false(transaction.isMatched);

        transaction.set('sync_status', 'matched');
        assert.true(transaction.isMatched);
    });
});
