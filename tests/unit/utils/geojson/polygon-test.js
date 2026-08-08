import Polygon from '@fleetbase/fleetops-data/utils/geojson/polygon';
import { module, test } from 'qunit';

function outerRing() {
    return [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
    ];
}

function hole() {
    return [
        [2, 2],
        [4, 2],
        [4, 4],
        [2, 2],
    ];
}

module('Unit | Utility | geojson/polygon', function () {
    test('an array of rings becomes the coordinates', function (assert) {
        const polygon = new Polygon([outerRing()]);

        assert.strictEqual(polygon.type, 'Polygon');
        assert.deepEqual(polygon.coordinates, [outerRing()]);
    });

    test('an existing Polygon geometry is adopted wholesale', function (assert) {
        const polygon = new Polygon({ type: 'Polygon', coordinates: [outerRing()], id: 'zone-a' });

        assert.strictEqual(polygon.type, 'Polygon');
        assert.strictEqual(polygon.id, 'zone-a');
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new Polygon(), /invalid input for new Polygon/);
    });

    test('a geometry of another type is rejected', function (assert) {
        assert.throws(() => new Polygon({ type: 'MultiPolygon', coordinates: [] }), /invalid input for new Polygon/);
    });

    test('addVertex inserts before the closing position so the ring stays closed', function (assert) {
        const polygon = new Polygon([outerRing()]);

        assert.strictEqual(polygon.addVertex([5, 15]), polygon);
        assert.deepEqual(polygon.coordinates[0][4], [5, 15], 'the new vertex lands before the closing position');
        assert.deepEqual(polygon.coordinates[0][5], [0, 0], 'the ring still closes on its first position');
    });

    test('insertVertex places a vertex at an explicit index of the outer ring', function (assert) {
        const polygon = new Polygon([outerRing()]);

        assert.strictEqual(polygon.insertVertex([1, 1], 1), polygon);
        assert.deepEqual(polygon.coordinates[0][1], [1, 1]);
    });

    test('removeVertex drops a vertex from the outer ring only', function (assert) {
        const polygon = new Polygon([outerRing(), hole()]);

        assert.strictEqual(polygon.removeVertex(0), polygon);
        assert.strictEqual(polygon.coordinates[0].length, 4, 'the outer ring shrank');
        assert.strictEqual(polygon.coordinates[1].length, 4, 'the hole is untouched');
    });

    test('close appends the missing closing position to every ring', function (assert) {
        const polygon = new Polygon([
            [
                [0, 0],
                [10, 0],
                [10, 10],
            ],
        ]);

        assert.strictEqual(polygon.close(), undefined, 'close does not return the geometry');
        assert.deepEqual(polygon.coordinates[0], [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 0],
        ]);
    });

    test('close leaves an already closed ring alone', function (assert) {
        const polygon = new Polygon([outerRing()]);

        polygon.close();

        assert.strictEqual(polygon.coordinates[0].length, 5, 'no duplicate closing position is added');
    });

    test('hasHoles is false for a single-ring polygon', function (assert) {
        const polygon = new Polygon([outerRing()]);

        assert.false(polygon.hasHoles());
        assert.deepEqual(polygon.holes(), [], 'and there are no holes to hand back');
    });

    test('hasHoles is true once an inner ring is present', function (assert) {
        const polygon = new Polygon([outerRing(), hole()]);

        assert.true(polygon.hasHoles());
    });

    test('holes returns each inner ring as its own Polygon', function (assert) {
        const polygon = new Polygon([outerRing(), hole()]);
        const holes = polygon.holes();

        assert.strictEqual(holes.length, 1);
        assert.ok(holes[0] instanceof Polygon);
        assert.deepEqual(holes[0].coordinates, [hole()], 'the hole is promoted to an outer ring of its own polygon');
    });

    test('the bounding box spans the outer ring and any holes', function (assert) {
        assert.deepEqual(new Polygon([outerRing(), hole()]).toJSON().bbox, [0, 0, 10, 10]);
    });
});
