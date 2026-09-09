import calculateBounds, {
    calculateBoundsFromArray,
    calculateBoundsFromNestedArrays,
    calculateBoundsFromNestedArrayOfArrays,
    calculateBoundsForFeatureCollection,
    calculateBoundsForGeometryCollection,
    calculateEnvelope,
} from '@fleetbase/fleetops-data/utils/geojson/calculate-bounds';
import { module, test } from 'qunit';

/**
 * Positions chosen so that each of the four extents is first seeded, then left
 * alone by a non-extending position, then extended — exercising both sides of
 * every comparison in the scanners.
 */
const SCATTERED = [
    [0, 0],
    [10, 10],
    [-5, -5],
    [3, 3],
];

const SCATTERED_BOUNDS = [-5, -5, 10, 10];

module('Unit | Utility | geojson/calculate-bounds', function () {
    module('by geometry type', function () {
        test('a Point bounds to itself', function (assert) {
            assert.deepEqual(calculateBounds({ type: 'Point', coordinates: [103.8198, 1.3521] }), [103.8198, 1.3521, 103.8198, 1.3521]);
        });

        test('a MultiPoint bounds to the extent of its positions', function (assert) {
            assert.deepEqual(calculateBounds({ type: 'MultiPoint', coordinates: SCATTERED }), SCATTERED_BOUNDS);
        });

        test('a LineString bounds to the extent of its vertices', function (assert) {
            assert.deepEqual(calculateBounds({ type: 'LineString', coordinates: SCATTERED }), SCATTERED_BOUNDS);
        });

        test('a MultiLineString bounds across all of its lines', function (assert) {
            const bounds = calculateBounds({
                type: 'MultiLineString',
                coordinates: [
                    [
                        [0, 0],
                        [10, 10],
                    ],
                    [
                        [-5, -5],
                        [3, 3],
                    ],
                ],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('a Polygon bounds across all of its rings, holes included', function (assert) {
            const bounds = calculateBounds({
                type: 'Polygon',
                coordinates: [
                    [
                        [0, 0],
                        [10, 10],
                        [0, 0],
                    ],
                    [
                        [-5, -5],
                        [3, 3],
                        [-5, -5],
                    ],
                ],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('a MultiPolygon bounds across all of its polygons', function (assert) {
            const bounds = calculateBounds({
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [0, 0],
                            [10, 10],
                            [0, 0],
                        ],
                    ],
                    [
                        [
                            [-5, -5],
                            [3, 3],
                            [-5, -5],
                        ],
                    ],
                ],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('a Feature bounds to its geometry', function (assert) {
            const bounds = calculateBounds({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: SCATTERED },
                properties: {},
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('a Feature with no geometry has no bounds', function (assert) {
            assert.strictEqual(calculateBounds({ type: 'Feature', geometry: null, properties: {} }), null);
        });

        test('a FeatureCollection bounds across every feature', function (assert) {
            const bounds = calculateBounds({
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 10] }, properties: {} },
                    { type: 'Feature', geometry: { type: 'Point', coordinates: [-5, -5] }, properties: {} },
                ],
            });

            assert.deepEqual(bounds, [-5, -5, 10, 10]);
        });

        test('a GeometryCollection bounds across every geometry', function (assert) {
            const bounds = calculateBounds({
                type: 'GeometryCollection',
                geometries: [
                    { type: 'Point', coordinates: [0, 0] },
                    { type: 'LineString', coordinates: SCATTERED },
                ],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('an unknown type is rejected by name', function (assert) {
            assert.throws(() => calculateBounds({ type: 'Rhombus', coordinates: [] }), /Unknown type: Rhombus/, 'the offending type is named so a bad payload can be traced');
        });

        test('an object with no type has no bounds', function (assert) {
            assert.strictEqual(calculateBounds({ coordinates: [[0, 0]] }), null);
        });
    });

    module('scanners', function () {
        test('calculateBoundsFromArray walks a flat position list', function (assert) {
            assert.deepEqual(calculateBoundsFromArray(SCATTERED), SCATTERED_BOUNDS);
        });

        test('calculateBoundsFromArray on an empty list yields null extents', function (assert) {
            assert.deepEqual(calculateBoundsFromArray([]), [null, null, null, null], 'nothing was seen, so nothing is claimed');
        });

        test('calculateBoundsFromNestedArrays walks one level of nesting', function (assert) {
            assert.deepEqual(calculateBoundsFromNestedArrays([SCATTERED]), SCATTERED_BOUNDS);
        });

        test('calculateBoundsFromNestedArrayOfArrays walks two levels of nesting', function (assert) {
            assert.deepEqual(calculateBoundsFromNestedArrayOfArrays([[SCATTERED]]), SCATTERED_BOUNDS);
        });

        test('calculateBoundsForFeatureCollection reads the features key directly', function (assert) {
            const bounds = calculateBoundsForFeatureCollection({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: SCATTERED }, properties: {} }],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('calculateBoundsForGeometryCollection reads the geometries key directly', function (assert) {
            const bounds = calculateBoundsForGeometryCollection({
                type: 'GeometryCollection',
                geometries: [{ type: 'LineString', coordinates: SCATTERED }],
            });

            assert.deepEqual(bounds, SCATTERED_BOUNDS);
        });

        test('a single position produces a degenerate zero-area extent', function (assert) {
            assert.deepEqual(calculateBoundsFromArray([[103.8198, 1.3521]]), [103.8198, 1.3521, 103.8198, 1.3521]);
        });
    });

    module('calculateEnvelope', function () {
        test('an envelope is the origin plus positive width and height', function (assert) {
            const envelope = calculateEnvelope({ type: 'LineString', coordinates: SCATTERED });

            assert.deepEqual(envelope, { x: -5, y: -5, w: 15, h: 15 });
        });

        test('a point envelope has no extent', function (assert) {
            assert.deepEqual(calculateEnvelope({ type: 'Point', coordinates: [103.8198, 1.3521] }), {
                x: 103.8198,
                y: 1.3521,
                w: 0,
                h: 0,
            });
        });
    });
});
