import { module, test } from 'qunit';
import { set } from '@ember/object';
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
        test('sync counts default to zero when a connection has no complete summary', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection');

            assert.strictEqual(connection.lastImported, '0', 'a new connection has no imports');
            assert.strictEqual(connection.lastUnmatched, '0', 'a new connection has no unmatched purchases');

            for (const state of [null, {}, { summary: null }, { summary: {} }, { summary: { imported: null, unmatched: null } }]) {
                connection.set('last_sync_state', state);
                assert.strictEqual(connection.lastImported, '0', 'an absent import count has a readable fallback');
                assert.strictEqual(connection.lastUnmatched, '0', 'an absent unmatched count has a readable fallback');
            }
        });

        test('sync counts display the summary and update when a later sync changes it', function (assert) {
            const connection = this.store.createRecord('fuel-provider-connection', {
                last_sync_state: { summary: { imported: 12, unmatched: 3 } },
            });

            assert.strictEqual(connection.lastImported, '12');
            assert.strictEqual(connection.lastUnmatched, '3');

            connection.set('last_sync_state', { summary: { imported: 5, unmatched: 0 } });
            assert.strictEqual(connection.lastImported, '5', 'replacing the sync result invalidates the cached count');
            assert.strictEqual(connection.lastUnmatched, '0', 'a successful zero count is preserved');

            set(connection, 'last_sync_state.summary.imported', 8);
            set(connection, 'last_sync_state.summary.unmatched', 2);
            assert.strictEqual(connection.lastImported, '8', 'nested import updates invalidate the cached count');
            assert.strictEqual(connection.lastUnmatched, '2', 'nested unmatched updates invalidate the cached count');
        });

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
