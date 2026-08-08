import geojsonCreatePrimitive from '@fleetbase/fleetops-data/utils/geojson/create-primitive';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import MultiPoint from '@fleetbase/fleetops-data/utils/geojson/multi-point';
import LineString from '@fleetbase/fleetops-data/utils/geojson/line-string';
import MultiLineString from '@fleetbase/fleetops-data/utils/geojson/multi-line-string';
import Polygon from '@fleetbase/fleetops-data/utils/geojson/polygon';
import MultiPolygon from '@fleetbase/fleetops-data/utils/geojson/multi-polygon';
import Feature from '@fleetbase/fleetops-data/utils/geojson/feature';
import FeatureCollection from '@fleetbase/fleetops-data/utils/geojson/feature-collection';
import GeometryCollection from '@fleetbase/fleetops-data/utils/geojson/geometry-collection';
import Circle from '@fleetbase/fleetops-data/utils/geojson/circle';
import { module, test } from 'qunit';

const RING = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 0],
];

module('Unit | Utility | geojson/create-primitive', function () {
    test('a Point payload becomes a Point', function (assert) {
        const primitive = geojsonCreatePrimitive({ type: 'Point', coordinates: [103.8198, 1.3521] });

        assert.ok(primitive instanceof Point);
        assert.deepEqual(primitive.coordinates, [103.8198, 1.3521]);
    });

    test('a MultiPoint payload becomes a MultiPoint', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'MultiPoint',
            coordinates: [
                [0, 0],
                [10, 10],
            ],
        });

        assert.ok(primitive instanceof MultiPoint);
        assert.strictEqual(primitive.type, 'MultiPoint');
    });

    test('a LineString payload becomes a LineString', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'LineString',
            coordinates: [
                [0, 0],
                [10, 10],
            ],
        });

        assert.ok(primitive instanceof LineString);
    });

    test('a MultiLineString payload becomes a MultiLineString', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'MultiLineString',
            coordinates: [
                [
                    [0, 0],
                    [10, 10],
                ],
            ],
        });

        assert.ok(primitive instanceof MultiLineString);
    });

    test('a Polygon payload becomes a Polygon', function (assert) {
        const primitive = geojsonCreatePrimitive({ type: 'Polygon', coordinates: [RING] });

        assert.ok(primitive instanceof Polygon);
    });

    test('a MultiPolygon payload becomes a MultiPolygon', function (assert) {
        const primitive = geojsonCreatePrimitive({ type: 'MultiPolygon', coordinates: [[RING]] });

        assert.ok(primitive instanceof MultiPolygon);
    });

    test('a Feature payload becomes a Feature', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Depot' },
        });

        assert.ok(primitive instanceof Feature);
        assert.deepEqual(primitive.properties, { name: 'Depot' });
    });

    test('a FeatureCollection payload becomes a FeatureCollection', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
        });

        assert.ok(primitive instanceof FeatureCollection);
        assert.strictEqual(primitive.features.length, 1);
    });

    test('a GeometryCollection payload becomes a GeometryCollection', function (assert) {
        const primitive = geojsonCreatePrimitive({
            type: 'GeometryCollection',
            geometries: [{ type: 'Point', coordinates: [0, 0] }],
        });

        assert.ok(primitive instanceof GeometryCollection);
    });

    test('a Circle payload is routed to the Circle constructor', function (assert) {
        const primitive = geojsonCreatePrimitive({ type: 'Circle', coordinates: [103.8198, 1.3521] });

        assert.ok(primitive instanceof Circle);
        assert.strictEqual(primitive.type, 'Feature', 'a Circle is still expressed as a Feature');
    });

    test('an unknown type is rejected by name', function (assert) {
        assert.throws(() => geojsonCreatePrimitive({ type: 'Rhombus' }), /Unknown type: Rhombus/);
    });

    test('no payload produces nothing rather than throwing', function (assert) {
        assert.strictEqual(geojsonCreatePrimitive(), undefined);
    });

    test('a null payload produces nothing', function (assert) {
        assert.strictEqual(geojsonCreatePrimitive(null), undefined);
    });
});
