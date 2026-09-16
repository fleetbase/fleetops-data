import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import RESTAdapter from '@ember-data/adapter/rest';

module('Unit | Serializer | fuel provider sync run', function (hooks) {
    setupTest(hooks);

    test('querying sync history resolves the registered model and server payload', async function (assert) {
        this.owner.register(
            'adapter:fuel-provider-sync-run',
            class extends RESTAdapter {
                ajax(url, method, options) {
                    assert.strictEqual(method, 'GET');
                    assert.deepEqual(options.data, { connection: 'connection-123', sort: '-created_at' });
                    return Promise.resolve({
                        fuelProviderSyncRuns: [
                            {
                                uuid: 'run-123',
                                fuel_provider_connection_uuid: 'connection-123',
                                provider: 'petroapp',
                                status: 'completed',
                                from: '2026-09-01T00:00:00Z',
                                to: '2026-09-15T00:00:00Z',
                                finished_at: '2026-09-15T01:00:00Z',
                                imported: 12,
                                matched: 10,
                                unmatched: 2,
                                summary: { imported: 12 },
                                meta: {},
                            },
                        ],
                    });
                }
            }
        );
        const store = this.owner.lookup('service:store');
        const runs = await store.query('fuel-provider-sync-run', { connection: 'connection-123', sort: '-created_at' });
        const run = runs.objectAt(0);
        assert.strictEqual(runs.length, 1);
        assert.strictEqual(run.id, 'run-123', 'the internal UUID is the record identity');
        assert.strictEqual(run.status, 'completed');
        assert.strictEqual(run.imported, 12);
        assert.strictEqual(run.matched, 10);
        assert.strictEqual(run.from.toISOString(), '2026-09-01T00:00:00.000Z');
        assert.strictEqual(run.finished_at.toISOString(), '2026-09-15T01:00:00.000Z');
        assert.deepEqual(run.summary, { imported: 12 });
    });
});
