import MultiPoint from '@fleetbase/fleetops-data/utils/geojson/multi-point';
import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import { module, test } from 'qunit';

function positions() {
    return [
        [0, 0],
        [10, 10],
        [20, 20],
    ];
}

module('Unit | Utility | geojson/multi-point', function () {
    test('an array of positions becomes the coordinates', function (assert) {
        const multiPoint = new MultiPoint(positions());

        assert.strictEqual(multiPoint.type, 'MultiPoint', 'the geometry reports its own type, not MultiPolygon');
        assert.deepEqual(multiPoint.coordinates, positions());
    });

    test('an existing MultiPoint geometry is adopted wholesale', function (assert) {
        const multiPoint = new MultiPoint({ type: 'MultiPoint', coordinates: positions(), id: 'stops' });

        assert.strictEqual(multiPoint.type, 'MultiPoint');
        assert.deepEqual(multiPoint.coordinates, positions());
        assert.strictEqual(multiPoint.id, 'stops');
    });

    test('no input is rejected by name', function (assert) {
        assert.throws(() => new MultiPoint(), /invalid input for new MultiPoint/);
    });

    test('a geometry of another type is rejected', function (assert) {
        assert.throws(() => new MultiPoint({ type: 'MultiPolygon', coordinates: [] }), /invalid input for new MultiPoint/);
    });

    test('forEach visits every position with its index and the backing array', function (assert) {
        const multiPoint = new MultiPoint(positions());
        const seen = [];

        multiPoint.forEach(function (position, index, all) {
            seen.push([position, index]);
            assert.strictEqual(all, multiPoint.coordinates, 'the third argument is the live coordinates array');
            assert.strictEqual(this, multiPoint, 'the callback is bound to the geometry');
        });

        assert.deepEqual(
            seen.map(([, index]) => index),
            [0, 1, 2]
        );
        assert.deepEqual(seen[1][0], [10, 10]);
    });

    test('addPoint appends and returns the geometry for chaining', function (assert) {
        const multiPoint = new MultiPoint(positions());

        assert.strictEqual(multiPoint.addPoint([30, 30]), multiPoint, 'the geometry is returned');
        assert.deepEqual(multiPoint.coordinates[3], [30, 30]);
        assert.strictEqual(multiPoint.coordinates.length, 4);
    });

    test('insertPoint places a position at the requested index', function (assert) {
        const multiPoint = new MultiPoint(positions());

        assert.strictEqual(multiPoint.insertPoint([5, 5], 1), multiPoint);
        assert.deepEqual(multiPoint.coordinates, [
            [0, 0],
            [5, 5],
            [10, 10],
            [20, 20],
        ]);
    });

    test('removePoint by index drops that position', function (assert) {
        const multiPoint = new MultiPoint(positions());

        assert.strictEqual(multiPoint.removePoint(1), multiPoint);
        assert.deepEqual(multiPoint.coordinates, [
            [0, 0],
            [20, 20],
        ]);
    });

    test('removePoint by reference drops the matching position', function (assert) {
        const coordinates = positions();
        const multiPoint = new MultiPoint(coordinates);

        multiPoint.removePoint(coordinates[2]);

        assert.deepEqual(multiPoint.coordinates, [
            [0, 0],
            [10, 10],
        ]);
    });

    test('removePoint with an unknown reference drops the last position', function (assert) {
        const multiPoint = new MultiPoint(positions());

        multiPoint.removePoint([99, 99]);

        assert.deepEqual(
            multiPoint.coordinates,
            [
                [0, 0],
                [10, 10],
            ],
            'indexOf returned -1, which splice reads as "one from the end"'
        );
    });

    test('get returns the position at an index as a Point', function (assert) {
        const point = new MultiPoint(positions()).get(1);

        assert.ok(point instanceof Point);
        assert.deepEqual(point.coordinates, [10, 10]);
    });

    test('an empty MultiPoint is allowed and iterates zero times', function (assert) {
        const multiPoint = new MultiPoint([]);
        let calls = 0;

        multiPoint.forEach(() => calls++);

        assert.strictEqual(calls, 0);
        assert.deepEqual(multiPoint.coordinates, []);
    });

    test('the bounding box spans every position', function (assert) {
        assert.deepEqual(new MultiPoint(positions()).toJSON().bbox, [0, 0, 20, 20]);
    });
});
