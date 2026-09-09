import GeoJson, { EarthRadius, DegreesPerRadian, RadiansPerDegree, MercatorCRS, GeographicCRS } from '@fleetbase/fleetops-data/utils/geojson/geo-json';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import LineString from '@fleetbase/fleetops-data/utils/geojson/line-string';
import { module, test } from 'qunit';

module('Unit | Utility | geojson/geo-json', function () {
    module('constants', function () {
        test('EarthRadius is the WGS-84 semi-major axis in metres', function (assert) {
            assert.strictEqual(EarthRadius, 6378137);
        });

        test('the radian conversion factors are reciprocal', function (assert) {
            assert.strictEqual(DegreesPerRadian, 57.29577951308232);
            assert.strictEqual(RadiansPerDegree, 0.017453292519943);
            assert.ok(Math.abs(DegreesPerRadian * RadiansPerDegree - 1) < 1e-12, 'one converts back into the other');
        });

        test('MercatorCRS points at the spherical Mercator definition', function (assert) {
            assert.deepEqual(MercatorCRS, {
                type: 'link',
                properties: {
                    href: 'http://spatialreference.org/ref/sr-org/6928/ogcwkt/',
                    type: 'ogcwkt',
                },
            });
        });

        test('GeographicCRS points at EPSG:4326', function (assert) {
            assert.deepEqual(GeographicCRS, {
                type: 'link',
                properties: {
                    href: 'http://spatialreference.org/ref/epsg/4326/ogcwkt/',
                    type: 'ogcwkt',
                },
            });
        });
    });

    module('toJSON', function () {
        test('own properties are copied and a bounding box is appended', function (assert) {
            const point = new Point([103.8198, 1.3521]);

            assert.deepEqual(point.toJSON(), {
                coordinates: [103.8198, 1.3521],
                type: 'Point',
                bbox: [103.8198, 1.3521, 103.8198, 1.3521],
            });
        });

        test('the bounding box reflects the whole geometry, not just its first vertex', function (assert) {
            const line = new LineString([
                [0, 0],
                [10, 20],
            ]);

            assert.deepEqual(line.toJSON().bbox, [0, 0, 10, 20]);
        });

        test('`length` is excluded so an array-like geometry does not leak its size', function (assert) {
            const point = new Point([103.8198, 1.3521]);
            point.length = 2;

            const json = point.toJSON();

            assert.notOk('length' in json, '`length` is filtered out of the serialized object');
            assert.deepEqual(json.coordinates, [103.8198, 1.3521], 'the rest of the geometry survives');
        });

        test('the serialized object is a plain copy, not the geometry itself', function (assert) {
            const point = new Point([103.8198, 1.3521]);
            const json = point.toJSON();

            json.type = 'Mutated';

            assert.strictEqual(point.type, 'Point', 'mutating the JSON does not reach back into the geometry');
        });

        test('every geometry class inherits toJSON from GeoJson', function (assert) {
            assert.ok(new Point([0, 1]) instanceof GeoJson, 'Point is a GeoJson');
            assert.ok(new LineString([[0, 1]]) instanceof GeoJson, 'LineString is a GeoJson');
        });
    });
});
