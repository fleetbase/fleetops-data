import * as geojson from '@fleetbase/fleetops-data/utils/geojson';
import calculateBounds from '@fleetbase/fleetops-data/utils/geojson/calculate-bounds';
import Circle from '@fleetbase/fleetops-data/utils/geojson/circle';
import closedPolygon from '@fleetbase/fleetops-data/utils/geojson/closed-polygon';
import createPrimitive from '@fleetbase/fleetops-data/utils/geojson/create-primitive';
import FeatureCollection from '@fleetbase/fleetops-data/utils/geojson/feature-collection';
import Feature from '@fleetbase/fleetops-data/utils/geojson/feature';
import GeoJson from '@fleetbase/fleetops-data/utils/geojson/geo-json';
import GeometryCollection from '@fleetbase/fleetops-data/utils/geojson/geometry-collection';
import LineString from '@fleetbase/fleetops-data/utils/geojson/line-string';
import MultiLineString from '@fleetbase/fleetops-data/utils/geojson/multi-line-string';
import MultiPoint from '@fleetbase/fleetops-data/utils/geojson/multi-point';
import MultiPolygon from '@fleetbase/fleetops-data/utils/geojson/multi-polygon';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import pointsEqual from '@fleetbase/fleetops-data/utils/geojson/points-equal';
import Polygon from '@fleetbase/fleetops-data/utils/geojson/polygon';
import { module, test } from 'qunit';

/**
 * The barrel is the addon's public GeoJSON surface: anything missing here is a
 * breaking change for consumers importing from `@fleetbase/fleetops-data/utils/geojson`.
 */
const PUBLIC_SURFACE = {
    calculateBounds,
    Circle,
    closedPolygon,
    createPrimitive,
    FeatureCollection,
    Feature,
    GeoJson,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    pointsEqual,
    Polygon,
};

module('Unit | Utility | geojson', function () {
    test('every documented export is re-exported from the module it belongs to', function (assert) {
        for (const [name, implementation] of Object.entries(PUBLIC_SURFACE)) {
            assert.strictEqual(geojson[name], implementation, `geojson.${name} is the ${name} implementation itself, not a copy`);
        }
    });

    test('the barrel exports exactly the documented surface and nothing else', function (assert) {
        // `default` is synthesized by the module-system interop layer, not
        // declared by the barrel, so it is not part of the authored surface.
        const declared = Object.keys(geojson)
            .filter((name) => name !== 'default')
            .sort();

        assert.deepEqual(declared, Object.keys(PUBLIC_SURFACE).sort(), 'no export was added or dropped without updating this contract');
    });

    test('the re-exported geometry classes are usable straight off the barrel', function (assert) {
        const point = new geojson.Point([103.8198, 1.3521]);

        assert.strictEqual(point.type, 'Point');
        assert.deepEqual(geojson.calculateBounds(point.toJSON()), [103.8198, 1.3521, 103.8198, 1.3521]);
    });
});
