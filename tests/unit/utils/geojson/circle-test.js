import Circle from '@fleetbase/fleetops-data/utils/geojson/circle';
import { EarthRadius } from '@fleetbase/fleetops-data/utils/geojson/geo-json';
import { module, test } from 'qunit';

const ORIGIN = [0, 0];

/** One degree of longitude at the equator, in Mercator metres. */
const ONE_DEGREE_IN_METRES = (EarthRadius * Math.PI) / 180;

/**
 * @param {Array} ring
 * @return {Boolean} whether the ring's first and last positions coincide
 */
function isClosed(ring) {
    const first = ring[0];
    const last = ring[ring.length - 1];

    return first[0] === last[0] && first[1] === last[1];
}

module('Unit | Utility | geojson/circle', function () {
    module('construction', function () {
        test('a circle is a Feature whose properties record how it was built', function (assert) {
            const circle = new Circle([103.8198, 1.3521], 1000, 4);

            assert.strictEqual(circle.type, 'Feature', 'a circle is expressed as a GeoJSON Feature');
            assert.deepEqual(circle.properties.center, [103.8198, 1.3521]);
            assert.strictEqual(circle.properties.radius, 1000);
            assert.strictEqual(circle.properties.steps, 4);
        });

        test('the geometry is a closed polygon with one position per step plus the closing position', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);

            assert.strictEqual(circle.geometry.type, 'Polygon');
            assert.strictEqual(circle.geometry.coordinates[0].length, 9, '8 steps plus the repeated closing position');
            assert.true(isClosed(circle.geometry.coordinates[0]), 'the ring closes on itself');
        });

        test('radius defaults to 250 metres and interpolation to 64 steps', function (assert) {
            const circle = new Circle(ORIGIN);

            assert.strictEqual(circle.properties.radius, 250);
            assert.strictEqual(circle.properties.steps, 64);
            assert.strictEqual(circle.geometry.coordinates[0].length, 65);
        });

        test('the ring is returned in geographic degrees, not Mercator metres', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);

            for (const [lng, lat] of circle.geometry.coordinates[0]) {
                assert.ok(Math.abs(lng) <= 180, `longitude ${lng} is a legal degree value`);
                assert.ok(Math.abs(lat) <= 90, `latitude ${lat} is a legal degree value`);
            }
        });

        test('a larger radius produces a larger ring', function (assert) {
            const small = new Circle(ORIGIN, 1000, 8);
            const large = new Circle(ORIGIN, 10000, 8);

            const spread = (circle) => Math.max(...circle.geometry.coordinates[0].map(([lng]) => Math.abs(lng)));

            assert.ok(spread(large) > spread(small), 'ten times the radius reaches further from the centre');
        });

        test('a missing centre is rejected', function (assert) {
            assert.throws(() => new Circle(), /missing parameter for new Circle/);
        });

        test('a centre with fewer than two components is rejected', function (assert) {
            assert.throws(() => new Circle([103.8198]), /missing parameter for new Circle/);
        });
    });

    module('mutators', function () {
        test('center() reads the centre back without touching the geometry', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);
            const before = circle.geometry.coordinates[0];

            assert.deepEqual(circle.center(), ORIGIN);
            assert.strictEqual(circle.geometry.coordinates[0], before, 'reading does not recalculate');
        });

        test('center(position) moves the circle and recalculates the ring', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);
            const before = circle.geometry.coordinates[0][0];

            assert.deepEqual(circle.center([103.8198, 1.3521]), [103.8198, 1.3521], 'the new centre is returned');
            assert.deepEqual(circle.properties.center, [103.8198, 1.3521]);
            assert.notDeepEqual(circle.geometry.coordinates[0][0], before, 'the ring moved with the centre');
        });

        test('radius() reads the radius back', function (assert) {
            assert.strictEqual(new Circle(ORIGIN, 1000, 8).radius(), 1000);
        });

        test('radius(metres) resizes the circle and recalculates the ring', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);
            const before = Math.abs(circle.geometry.coordinates[0][0][0]);

            assert.strictEqual(circle.radius(5000), 5000);
            assert.strictEqual(circle.properties.radius, 5000);
            assert.ok(Math.abs(circle.geometry.coordinates[0][0][0]) > before, 'the ring grew');
        });

        test('steps() reads the interpolation back', function (assert) {
            assert.strictEqual(new Circle(ORIGIN, 1000, 8).steps(), 8);
        });

        test('steps(count) re-interpolates the ring', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);

            assert.strictEqual(circle.steps(16), 16);
            assert.strictEqual(circle.properties.steps, 16);
            assert.strictEqual(circle.geometry.coordinates[0].length, 17);
        });

        test('recalculate() rebuilds the geometry from the current properties and returns the circle', function (assert) {
            const circle = new Circle(ORIGIN, 1000, 8);
            circle.properties.steps = 4;

            assert.strictEqual(circle.recalculate(), circle, 'the circle is returned for chaining');
            assert.strictEqual(circle.geometry.coordinates[0].length, 5);
        });
    });

    module('createCircle', function () {
        test('builds a closed polygon directly, without wrapping it in a Feature', function (assert) {
            const polygon = Circle.createCircle(ORIGIN, 1000, 4);

            assert.strictEqual(polygon.type, 'Polygon');
            assert.strictEqual(polygon.coordinates[0].length, 5);
            assert.true(isClosed(polygon.coordinates[0]));
        });

        test('defaults to 64 steps when interpolation is omitted', function (assert) {
            assert.strictEqual(Circle.createCircle(ORIGIN, 1000).coordinates[0].length, 65);
        });
    });

    module('toGeographic', function () {
        test('a Point geometry is converted in place and returned', function (assert) {
            const point = { type: 'Point', coordinates: [ONE_DEGREE_IN_METRES, 0] };
            const result = Circle.toGeographic(point);

            assert.strictEqual(result, point, 'the same object is returned');
            assert.ok(Math.abs(result.coordinates[0] - 1) < 0.0001, 'one degree of Mercator easting becomes one degree of longitude');
            assert.ok(Math.abs(result.coordinates[1]) < 0.0001, 'the equator stays at zero latitude');
        });

        test('a nested geometry has each of its positions converted', function (assert) {
            const result = Circle.toGeographic({
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [ONE_DEGREE_IN_METRES, 0],
                ],
            });

            assert.ok(Math.abs(result.coordinates[1][0] - 1) < 0.0001, 'the second vertex was converted too');
        });

        test('a Feature has its geometry converted', function (assert) {
            const result = Circle.toGeographic({
                type: 'Feature',
                properties: {},
                geometry: { type: 'Point', coordinates: [ONE_DEGREE_IN_METRES, 0] },
            });

            assert.ok(Math.abs(result.geometry.coordinates[0] - 1) < 0.0001);
        });

        test('a FeatureCollection has every feature converted', function (assert) {
            const result = Circle.toGeographic({
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [ONE_DEGREE_IN_METRES, 0] } },
                    { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
                ],
            });

            assert.ok(Math.abs(result.features[0].geometry.coordinates[0] - 1) < 0.0001);
            assert.deepEqual(result.features[1].geometry.coordinates, [0, 0]);
        });

        test('a GeometryCollection has every geometry converted', function (assert) {
            const result = Circle.toGeographic({
                type: 'GeometryCollection',
                geometries: [{ type: 'Point', coordinates: [ONE_DEGREE_IN_METRES, 0] }],
            });

            assert.ok(Math.abs(result.geometries[0].coordinates[0] - 1) < 0.0001);
        });

        test('a stale CRS annotation is dropped, because the result is always geographic', function (assert) {
            const result = Circle.toGeographic({
                type: 'Point',
                coordinates: [0, 0],
                crs: { type: 'link', properties: { href: 'http://spatialreference.org/ref/sr-org/6928/ogcwkt/', type: 'ogcwkt' } },
            });

            assert.notOk('crs' in result, 'the Mercator CRS is removed once the coordinates are degrees');
        });

        test('latitude is clamped so the poles cannot produce an infinite Mercator northing', function (assert) {
            const polygon = Circle.createCircle([0, 90], 1000, 4);

            for (const [, lat] of polygon.coordinates[0]) {
                assert.ok(Number.isFinite(lat), `latitude ${lat} stays finite at the pole`);
            }
        });
    });
});
