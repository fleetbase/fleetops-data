import LineString from '@fleetbase/fleetops-data/utils/geojson/line-string';
import { module, test } from 'qunit';

function vertices() {
    return [
        [0, 0],
        [10, 10],
        [20, 20],
    ];
}

module('Unit | Utility | geojson/line-string', function () {
    test('an array of vertices becomes the coordinates', function (assert) {
        const line = new LineString(vertices());

        assert.strictEqual(line.type, 'LineString');
        assert.deepEqual(line.coordinates, vertices());
    });

    test('an existing LineString geometry is adopted wholesale', function (assert) {
        const line = new LineString({ type: 'LineString', coordinates: vertices(), id: 'leg-1' });

        assert.strictEqual(line.type, 'LineString');
        assert.deepEqual(line.coordinates, vertices());
        assert.strictEqual(line.id, 'leg-1');
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new LineString(), /invalid input for new LineString/);
    });

    test('a geometry of another type is rejected', function (assert) {
        assert.throws(() => new LineString({ type: 'Point', coordinates: [0, 0] }), /invalid input for new LineString/);
    });

    test('a LineString-typed object with no coordinates is rejected', function (assert) {
        assert.throws(() => new LineString({ type: 'LineString' }), /invalid input for new LineString/);
    });

    test('addVertex appends and returns the geometry for chaining', function (assert) {
        const line = new LineString(vertices());

        assert.strictEqual(line.addVertex([30, 30]), line);
        assert.deepEqual(line.coordinates[3], [30, 30]);
    });

    test('insertVertex places a vertex at the requested index', function (assert) {
        const line = new LineString(vertices());

        assert.strictEqual(line.insertVertex([5, 5], 1), line);
        assert.deepEqual(line.coordinates, [
            [0, 0],
            [5, 5],
            [10, 10],
            [20, 20],
        ]);
    });

    test('removeVertex drops the vertex at an index', function (assert) {
        const line = new LineString(vertices());

        assert.strictEqual(line.removeVertex(0), line);
        assert.deepEqual(line.coordinates, [
            [10, 10],
            [20, 20],
        ]);
    });

    test('a zero-length line of one vertex is allowed', function (assert) {
        const line = new LineString([[0, 0]]);

        assert.deepEqual(line.toJSON().bbox, [0, 0, 0, 0], 'a degenerate line still bounds to a point');
    });

    test('an empty line is allowed and bounds to nothing', function (assert) {
        assert.deepEqual(new LineString([]).toJSON().bbox, [null, null, null, null]);
    });

    test('duplicate vertices are preserved rather than collapsed', function (assert) {
        const line = new LineString([
            [0, 0],
            [0, 0],
        ]);

        assert.strictEqual(line.coordinates.length, 2, 'geometry construction does not deduplicate');
    });
});
