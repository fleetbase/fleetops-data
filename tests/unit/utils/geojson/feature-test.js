import Feature from '@fleetbase/fleetops-data/utils/geojson/feature';
import GeometryCollection from '@fleetbase/fleetops-data/utils/geojson/geometry-collection';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import { module, test } from 'qunit';

module('Unit | Utility | geojson/feature', function () {
    test('an existing Feature is adopted wholesale', function (assert) {
        const feature = new Feature({
            type: 'Feature',
            id: 'depot',
            geometry: { type: 'Point', coordinates: [103.8198, 1.3521] },
            properties: { name: 'Depot' },
        });

        assert.strictEqual(feature.type, 'Feature');
        assert.strictEqual(feature.id, 'depot');
        assert.deepEqual(feature.properties, { name: 'Depot' }, 'properties survive');
        assert.deepEqual(feature.geometry, { type: 'Point', coordinates: [103.8198, 1.3521] });
    });

    test('a bare geometry object is wrapped as the feature geometry', function (assert) {
        const geometry = { type: 'Point', coordinates: [103.8198, 1.3521] };
        const feature = new Feature(geometry);

        assert.strictEqual(feature.type, 'Feature');
        assert.strictEqual(feature.geometry, geometry, 'the geometry is referenced, not copied');
        assert.strictEqual(feature.properties, undefined, 'no properties are invented');
    });

    test('an object carrying a GeoJson geometry serializes that geometry', function (assert) {
        const feature = new Feature({ geometry: new Point([103.8198, 1.3521]) });

        assert.strictEqual(feature.type, 'Feature');
        assert.deepEqual(feature.geometry, {
            coordinates: [103.8198, 1.3521],
            type: 'Point',
            bbox: [103.8198, 1.3521, 103.8198, 1.3521],
        });
    });

    test('a Point instance is recognised by its type and coordinates, not by its class', function (assert) {
        const point = new Point([103.8198, 1.3521]);
        const feature = new Feature(point);

        assert.strictEqual(feature.type, 'Feature');
        assert.strictEqual(feature.geometry, point, 'a geometry that already carries type and coordinates is referenced directly');
    });

    test('a GeoJson instance with no coordinates of its own is serialized into the geometry', function (assert) {
        const collection = new GeometryCollection([{ type: 'Point', coordinates: [103.8198, 1.3521] }]);
        const feature = new Feature(collection);

        assert.strictEqual(feature.type, 'Feature');
        assert.strictEqual(feature.geometry.type, 'GeometryCollection', 'the collection is flattened through toJSON');
        assert.deepEqual(feature.geometry.geometries, [{ type: 'Point', coordinates: [103.8198, 1.3521] }]);
        assert.notOk(feature.geometry instanceof GeometryCollection, 'and what lands on the feature is plain JSON');
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new Feature(), /invalid input for new Feature/);
    });

    test('null is rejected', function (assert) {
        assert.throws(() => new Feature(null), /invalid input for new Feature/);
    });

    test('a plain object with neither geometry nor coordinates is rejected', function (assert) {
        assert.throws(() => new Feature({ properties: { name: 'Depot' } }), /invalid input for new Feature/);
    });

    test('a typed object without coordinates is rejected', function (assert) {
        assert.throws(() => new Feature({ type: 'Point' }), /invalid input for new Feature/);
    });

    test('the type is forced to Feature even if the input claimed otherwise', function (assert) {
        const feature = new Feature(new Point([0, 1]));

        assert.strictEqual(feature.type, 'Feature');
    });

    test('a feature bounds to its geometry', function (assert) {
        const feature = new Feature({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [10, 20],
                ],
            },
            properties: {},
        });

        assert.deepEqual(feature.toJSON().bbox, [0, 0, 10, 20]);
    });
});
