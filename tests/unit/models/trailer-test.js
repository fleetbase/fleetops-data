import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | trailer', function (hooks) {
    setupTest(hooks);

    test('it exposes first-class identity, capacity, connection, and telemetry state', function (assert) {
        const store = this.owner.lookup('service:store');
        const trailer = store.createRecord('trailer', {
            name: 'Reefer 12',
            year: '2026',
            make: 'Utility',
            model: '3000R',
            location: { type: 'Point', coordinates: [106.9, 47.9] },
            payload_capacity: 20000,
        });

        assert.strictEqual(trailer.asset_class, 'trailer');
        assert.strictEqual(trailer.yearMakeModel, '2026 Utility 3000R');
        assert.strictEqual(trailer.payload_capacity, 20000);
        assert.deepEqual(trailer.coordinates, [47.9, 106.9]);
    });

    test('it derives display, attachment, and connectivity projections', function (assert) {
        const store = this.owner.lookup('service:store');
        const trailer = store.createRecord('trailer', {
            public_id: 'trailer_one',
            attachment_state: 'attached',
            connectivity_status: 'recently_offline',
            last_online_at: new Date('2026-09-01T10:30:00Z'),
            attached_at: new Date('2026-08-30T08:00:00Z'),
        });

        assert.strictEqual(trailer.displayName, 'trailer_one', 'falls back to the public id when no name is set');
        assert.true(trailer.isAttached);
        assert.false(trailer.isOnline);
        assert.ok(trailer.lastOnlineAt.startsWith('2026-09-01'));
        assert.ok(trailer.attachedAt.startsWith('2026-08-30'));
        assert.ok(trailer.lastOnlineAgo);

        trailer.setProperties({ name: 'Reefer 12', connectivity_status: 'online', last_online_at: null });
        assert.strictEqual(trailer.displayName, 'Reefer 12');
        assert.true(trailer.isOnline);
        assert.strictEqual(trailer.lastOnlineAt, null);
    });
});
