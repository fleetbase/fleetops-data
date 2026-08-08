import closedPolygon from '@fleetbase/fleetops-data/utils/geojson/closed-polygon';
import { module, test } from 'qunit';

const OPEN_RING = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
];

module('Unit | Utility | geojson/closed-polygon', function () {
    test('an open ring is closed by repeating its first position', function (assert) {
        assert.deepEqual(closedPolygon([OPEN_RING]), [
            [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
            ],
        ]);
    });

    test('an already closed ring is returned unchanged', function (assert) {
        const closed = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 0],
        ];

        assert.deepEqual(closedPolygon([closed]), [closed], 'no duplicate closing position is appended');
    });

    test('a ring closed by an equal-but-not-identical position is left alone', function (assert) {
        const ring = [
            [0, 0],
            [10, 0],
            [0, 0],
        ];

        assert.strictEqual(closedPolygon([ring])[0].length, 3, 'closure is decided by value, not object identity');
    });

    test('every ring of a polygon with holes is closed independently', function (assert) {
        const hole = [
            [2, 2],
            [4, 2],
            [4, 4],
        ];

        const result = closedPolygon([OPEN_RING, hole]);

        assert.strictEqual(result.length, 2, 'both rings are returned');
        assert.deepEqual(result[0][result[0].length - 1], [0, 0], 'the outer ring closes on its own first position');
        assert.deepEqual(result[1][result[1].length - 1], [2, 2], 'the hole closes on its own first position');
    });

    test('the input rings are not mutated', function (assert) {
        const ring = [
            [0, 0],
            [10, 0],
            [10, 10],
        ];

        closedPolygon([ring]);

        assert.strictEqual(ring.length, 3, 'the caller keeps its open ring');
    });

    test('the returned rings are fresh arrays', function (assert) {
        const ring = [
            [0, 0],
            [10, 0],
            [0, 0],
        ];

        assert.notStrictEqual(closedPolygon([ring])[0], ring, 'each ring is copied even when it needs no change');
    });

    test('a single-position ring is already considered closed', function (assert) {
        assert.deepEqual(closedPolygon([[[5, 5]]]), [[[5, 5]]], 'the only position is both first and last');
    });

    test('an empty list of rings yields an empty list', function (assert) {
        assert.deepEqual(closedPolygon([]), []);
    });
});
