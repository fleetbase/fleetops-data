import MultiLineString from '@fleetbase/fleetops-data/utils/geojson/multi-line-string';
import LineString from '@fleetbase/fleetops-data/utils/geojson/line-string';
import { module, test } from 'qunit';

function lines() {
    return [
        [
            [0, 0],
            [10, 10],
        ],
        [
            [20, 20],
            [30, 30],
        ],
    ];
}

module('Unit | Utility | geojson/multi-line-string', function () {
    test('an array of lines becomes the coordinates', function (assert) {
        const multiLine = new MultiLineString(lines());

        assert.strictEqual(multiLine.type, 'MultiLineString');
        assert.deepEqual(multiLine.coordinates, lines());
    });

    test('an existing MultiLineString geometry is adopted wholesale', function (assert) {
        const multiLine = new MultiLineString({ type: 'MultiLineString', coordinates: lines(), id: 'route' });

        assert.strictEqual(multiLine.type, 'MultiLineString');
        assert.strictEqual(multiLine.id, 'route');
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new MultiLineString(), /invalid input for new MultiLineString/);
    });

    test('a geometry of another type is rejected', function (assert) {
        assert.throws(() => new MultiLineString({ type: 'LineString', coordinates: [[0, 0]] }), /invalid input for new MultiLineString/);
    });

    test('forEach visits every line with its index and the backing array', function (assert) {
        const multiLine = new MultiLineString(lines());
        const seen = [];

        multiLine.forEach(function (line, index, all) {
            seen.push(index);
            assert.strictEqual(all, multiLine.coordinates);
            assert.strictEqual(this, multiLine, 'the callback is bound to the geometry');
            assert.strictEqual(line.length, 2);
        });

        assert.deepEqual(seen, [0, 1]);
    });

    test('get returns a line at an index as a LineString', function (assert) {
        const line = new MultiLineString(lines()).get(1);

        assert.ok(line instanceof LineString);
        assert.deepEqual(line.coordinates, [
            [20, 20],
            [30, 30],
        ]);
    });

    test('an empty MultiLineString iterates zero times', function (assert) {
        let calls = 0;

        new MultiLineString([]).forEach(() => calls++);

        assert.strictEqual(calls, 0);
    });

    test('the bounding box spans every line', function (assert) {
        assert.deepEqual(new MultiLineString(lines()).toJSON().bbox, [0, 0, 30, 30]);
    });
});
