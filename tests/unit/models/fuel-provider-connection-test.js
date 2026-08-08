import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE, FIXED_DATE_LONG, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

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

    module('display and formatting', function () {
        test('displayName prefers the connection name over the provider', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection', { name: 'Shell APAC', provider: 'shell' });
            assert.strictEqual(connection.displayName, 'Shell APAC');

            connection.set('name', null);
            assert.strictEqual(connection.displayName, 'shell', 'the provider stands in when no name was given');
        });

        test('lastSyncedAt and lastTestedAt render through the shared formatter', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection', { last_synced_at: FIXED_DATE, last_tested_at: FIXED_DATE });

            assert.strictEqual(connection.lastSyncedAt, FIXED_DATE_LONG);
            assert.strictEqual(connection.lastTestedAt, FIXED_DATE_LONG);
        });

        test('a connection that has never synced or been tested renders null', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection');

            assert.strictEqual(connection.lastSyncedAt, null);
            assert.strictEqual(connection.lastTestedAt, null);
        });

        test('the shared formatter rejects an unparseable value', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection');

            assert.strictEqual(connection.formatDate('not-a-date'), null);
            assert.strictEqual(connection.formatDate(FIXED_DATE), FIXED_DATE_LONG);
        });
    });
});
