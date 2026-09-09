import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';

module('Unit | Transform | point', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.transform = this.owner.lookup('transform:point');
    });

    module('deserialize', function () {
        test('a GeoJSON point from the server becomes a Point geometry', function (assert) {
            const point = this.transform.deserialize({ type: 'Point', coordinates: [103.8198, 1.3521] });

            assert.ok(point instanceof Point);
            assert.strictEqual(point.type, 'Point');
            assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
        });

        test('a bare position array becomes a Point geometry', function (assert) {
            const point = this.transform.deserialize([103.8198, 1.3521]);

            assert.ok(point instanceof Point);
            assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
        });

        test('null deserializes to the null-island origin rather than nothing', function (assert) {
            const point = this.transform.deserialize(null);

            assert.ok(point instanceof Point, 'an attribute always holds a geometry');
            assert.deepEqual(point.coordinates, [0, 0]);
        });

        test('undefined deserializes to the null-island origin', function (assert) {
            assert.deepEqual(this.transform.deserialize(undefined).coordinates, [0, 0]);
        });

        test('an already-deserialized Point round-trips unchanged', function (assert) {
            const original = new Point([103.8198, 1.3521]);
            const point = this.transform.deserialize(original);

            assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
            assert.strictEqual(point.type, 'Point');
        });

        test('a zero-origin position is preserved rather than treated as missing', function (assert) {
            assert.deepEqual(this.transform.deserialize({ type: 'Point', coordinates: [0, 0] }).coordinates, [0, 0]);
        });

        test('a position with an altitude keeps all three components', function (assert) {
            assert.deepEqual(this.transform.deserialize([103.8198, 1.3521, 15]).coordinates, [103.8198, 1.3521, 15]);
        });

        test('an unusable value is rejected rather than silently coerced', function (assert) {
            assert.throws(() => this.transform.deserialize('103.8198,1.3521'), /invalid input for new Point/);
            assert.throws(() => this.transform.deserialize({ type: 'LineString', coordinates: [[0, 0]] }), /invalid input for new Point/);
        });
    });

    module('serialize', function () {
        test('a Point geometry serializes to a Point', function (assert) {
            const point = this.transform.serialize(new Point([103.8198, 1.3521]));

            assert.ok(point instanceof Point);
            assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
        });

        test('a bare position array serializes to a Point', function (assert) {
            assert.deepEqual(this.transform.serialize([103.8198, 1.3521]).coordinates, [103.8198, 1.3521]);
        });

        test('null serializes to the null-island origin', function (assert) {
            assert.deepEqual(this.transform.serialize(null).coordinates, [0, 0]);
        });

        test('undefined serializes to the null-island origin', function (assert) {
            assert.deepEqual(this.transform.serialize(undefined).coordinates, [0, 0]);
        });

        test('a value survives a deserialize/serialize round trip', function (assert) {
            const serialized = { type: 'Point', coordinates: [103.8198, 1.3521] };

            assert.deepEqual(this.transform.serialize(this.transform.deserialize(serialized)).coordinates, serialized.coordinates);
        });
    });

    module('through a model attribute', function () {
        test('a server payload is deserialized into a Point the model can read', function (assert) {
            const store = this.owner.lookup('service:store');
            const place = store.push(store.normalize('place', { uuid: 'place_1', location: { type: 'Point', coordinates: [103.8198, 1.3521] } }));

            assert.ok(place.location instanceof Point);
            assert.strictEqual(place.longitude, 103.8198);
            assert.strictEqual(place.latitude, 1.3521);
        });

        test('a record with no location on the wire still reads as the null-island origin', function (assert) {
            const store = this.owner.lookup('service:store');
            const place = store.push(store.normalize('place', { uuid: 'place_2', location: null }));

            assert.deepEqual(place.location.coordinates, [0, 0]);
        });

        test('a location survives the round trip back onto the wire', function (assert) {
            const store = this.owner.lookup('service:store');
            const place = store.push(store.normalize('place', { uuid: 'place_3', location: { type: 'Point', coordinates: [103.8198, 1.3521] } }));

            assert.deepEqual(place.serialize().location.coordinates, [103.8198, 1.3521]);
        });

        test('a place created without a location defaults to the null-island origin', function (assert) {
            const place = this.owner.lookup('service:store').createRecord('place');

            assert.deepEqual(place.location.coordinates, [0, 0]);
        });
    });
});
