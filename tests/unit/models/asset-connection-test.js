import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | asset-connection', function (hooks) {
    setupTest(hooks);

    test('it represents an effective-dated towing relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const connection = store.createRecord('asset-connection', { relationship_type: 'towing', active: true, position: 1 });

        assert.strictEqual(connection.relationship_type, 'towing');
        assert.true(connection.active);
        assert.strictEqual(connection.position, 1);
    });

    test('it formats connection timing for the console', function (assert) {
        const store = this.owner.lookup('service:store');
        const active = store.createRecord('asset-connection', { connected_at: new Date('2026-09-01T08:00:00Z') });
        const ended = store.createRecord('asset-connection', {
            active: false,
            connected_at: new Date('2026-09-01T08:00:00Z'),
            disconnected_at: new Date('2026-09-01T10:00:00Z'),
        });

        assert.true(active.isActive);
        assert.ok(active.connectedAt.startsWith('2026-09-01'));
        assert.strictEqual(active.disconnectedAt, null);
        assert.ok(active.duration);
        assert.false(ended.isActive);
        assert.strictEqual(ended.duration, '2 hours');
        assert.strictEqual(store.createRecord('asset-connection').duration, null);
        assert.ok(ended.disconnectedAt.startsWith('2026-09-01'), 'the disconnect time is formatted once it exists');
        assert.strictEqual(store.createRecord('asset-connection').connectedAt, null, 'a connection that never started has no formatted start');
    });

    test('a connection with no explicit flag is active until it is disconnected', function (assert) {
        const store = this.owner.lookup('service:store');
        const open = store.createRecord('asset-connection');
        const closed = store.createRecord('asset-connection', { disconnected_at: new Date('2026-09-01T10:00:00Z') });

        assert.true(open.isActive);
        assert.false(closed.isActive);
    });
});
