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
        assert.strictEqual(trailer.lastOnlineAgo, null);
    });

    test('attachedAt is null until the trailer has been attached', function (assert) {
        const trailer = this.owner.lookup('service:store').createRecord('trailer');

        assert.strictEqual(trailer.attachedAt, null);
    });

    test('searchString joins every identifying field that is set', function (assert) {
        const trailer = this.owner.lookup('service:store').createRecord('trailer', { name: 'Reefer 12', code: 'TR-12', vin: '1UYVS2538' });

        assert.strictEqual(trailer.searchString, 'Reefer 12 TR-12 1UYVS2538', 'unset fields are left out rather than rendered as undefined');
    });

    test('coordinates are exposed as a Leaflet-style pair and validated', function (assert) {
        const trailer = this.owner.lookup('service:store').createRecord('trailer', { location: { type: 'Point', coordinates: [103.8198, 1.3521] } });

        assert.deepEqual(trailer.latlng, { lat: 1.3521, lng: 103.8198 });
        assert.true(trailer.hasValidCoordinates);
        assert.false(trailer.hasInvalidCoordinates);

        trailer.set('location', { type: 'Point', coordinates: [0, 1.3521] });
        assert.false(trailer.hasValidCoordinates, 'null island is rejected before the range check');

        trailer.set('location', { type: 'Point', coordinates: [103.8198, 0] });
        assert.false(trailer.hasValidCoordinates, 'a zero latitude is rejected too');

        trailer.set('location', { type: 'Point', coordinates: [200, 100] });
        assert.false(trailer.hasValidCoordinates, 'out-of-range coordinates are rejected');
        assert.true(trailer.hasInvalidCoordinates);
    });
});
