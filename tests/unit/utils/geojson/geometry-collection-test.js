import GeometryCollection from '@fleetbase/fleetops-data/utils/geojson/geometry-collection';
import GeoJson from '@fleetbase/fleetops-data/utils/geojson/geo-json';
import { module, test } from 'qunit';

function geometries() {
    return [
        { type: 'Point', coordinates: [0, 0] },
        {
            type: 'LineString',
            coordinates: [
                [10, 10],
                [20, 20],
            ],
        },
    ];
}

module('Unit | Utility | geojson/geometry-collection', function () {
    test('an existing GeometryCollection is adopted wholesale', function (assert) {
        const collection = new GeometryCollection({ type: 'GeometryCollection', geometries: geometries(), id: 'area' });

        assert.strictEqual(collection.type, 'GeometryCollection');
        assert.strictEqual(collection.id, 'area');
        assert.strictEqual(collection.geometries.length, 2);
    });

    test('a bare array of geometries is accepted', function (assert) {
        const collection = new GeometryCollection(geometries());

        assert.strictEqual(collection.type, 'GeometryCollection');
        assert.strictEqual(collection.geometries.length, 2);
    });

    test('a single geometry is promoted into a one-element collection', function (assert) {
        const collection = new GeometryCollection({ type: 'Point', coordinates: [103.8198, 1.3521] });

        assert.strictEqual(collection.type, 'GeometryCollection');
        assert.deepEqual(collection.geometries, [{ type: 'Point', coordinates: [103.8198, 1.3521] }]);
    });

    test('an empty array is a valid, empty collection', function (assert) {
        assert.deepEqual(new GeometryCollection([]).geometries, []);
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new GeometryCollection(), /invalid input for new GeometryCollection/);
    });

    test('null is rejected with the same message rather than a type error', function (assert) {
        assert.throws(() => new GeometryCollection(null), /invalid input for new GeometryCollection/);
    });

    test('a typed object without coordinates is rejected', function (assert) {
        assert.throws(() => new GeometryCollection({ type: 'Point' }), /invalid input for new GeometryCollection/);
    });

    test('coordinates without a type are rejected', function (assert) {
        assert.throws(() => new GeometryCollection({ coordinates: [0, 0] }), /invalid input for new GeometryCollection/);
    });

    test('a GeometryCollection-typed object with no geometries falls through to the single-geometry path and is rejected', function (assert) {
        assert.throws(() => new GeometryCollection({ type: 'GeometryCollection' }), /invalid input for new GeometryCollection/);
    });

    test('forEach visits every geometry with its index and the backing array', function (assert) {
        const collection = new GeometryCollection(geometries());
        const seen = [];

        collection.forEach(function (geometry, index, all) {
            seen.push(geometry.type);
            assert.strictEqual(index, seen.length - 1);
            assert.strictEqual(all, collection.geometries);
            assert.strictEqual(this, collection, 'the callback is bound to the collection');
        });

        assert.deepEqual(seen, ['Point', 'LineString']);
    });

    test('get returns a GeoJson wrapper for the geometry at an index', function (assert) {
        const collection = new GeometryCollection(geometries());

        assert.ok(collection.get(0) instanceof GeoJson);
    });

    test('the bounding box spans every geometry', function (assert) {
        assert.deepEqual(new GeometryCollection(geometries()).toJSON().bbox, [0, 0, 20, 20]);
    });
});
