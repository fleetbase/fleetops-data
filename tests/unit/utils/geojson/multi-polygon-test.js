import MultiPolygon from '@fleetbase/fleetops-data/utils/geojson/multi-polygon';
import Polygon from '@fleetbase/fleetops-data/utils/geojson/polygon';
import { module, test } from 'qunit';

function closedPolygons() {
    return [
        [
            [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 0],
            ],
        ],
        [
            [
                [20, 20],
                [30, 20],
                [30, 30],
                [20, 20],
            ],
        ],
    ];
}

function openPolygons() {
    return [
        [
            [
                [0, 0],
                [10, 0],
                [10, 10],
            ],
        ],
        [
            [
                [20, 20],
                [30, 20],
                [30, 30],
            ],
        ],
    ];
}

module('Unit | Utility | geojson/multi-polygon', function () {
    test('an array of polygons becomes the coordinates', function (assert) {
        const multiPolygon = new MultiPolygon(closedPolygons());

        assert.strictEqual(multiPolygon.type, 'MultiPolygon');
        assert.deepEqual(multiPolygon.coordinates, closedPolygons());
    });

    test('an existing MultiPolygon geometry is adopted wholesale', function (assert) {
        const multiPolygon = new MultiPolygon({ type: 'MultiPolygon', coordinates: closedPolygons(), id: 'service-area' });

        assert.strictEqual(multiPolygon.type, 'MultiPolygon');
        assert.strictEqual(multiPolygon.id, 'service-area');
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new MultiPolygon(), /invalid input for new MultiPolygon/);
    });

    test('a geometry of another type is rejected', function (assert) {
        assert.throws(() => new MultiPolygon({ type: 'Polygon', coordinates: [] }), /invalid input for new MultiPolygon/);
    });

    test('forEach visits every polygon with its index and the backing array', function (assert) {
        const multiPolygon = new MultiPolygon(closedPolygons());
        const seen = [];

        multiPolygon.forEach(function (polygon, index, all) {
            seen.push(index);
            assert.strictEqual(all, multiPolygon.coordinates);
            assert.strictEqual(this, multiPolygon, 'the callback is bound to the geometry');
        });

        assert.deepEqual(seen, [0, 1]);
    });

    test('get returns a polygon at an index as a Polygon', function (assert) {
        const polygon = new MultiPolygon(closedPolygons()).get(1);

        assert.ok(polygon instanceof Polygon);
        assert.deepEqual(polygon.coordinates, closedPolygons()[1]);
    });

    test('close closes every ring of every polygon and returns the geometry', function (assert) {
        const multiPolygon = new MultiPolygon(openPolygons());

        assert.strictEqual(multiPolygon.close(), multiPolygon, 'the geometry is returned for chaining');
        assert.deepEqual(multiPolygon.coordinates, closedPolygons());
    });

    test('close is idempotent', function (assert) {
        const multiPolygon = new MultiPolygon(openPolygons());

        multiPolygon.close();
        multiPolygon.close();

        assert.deepEqual(multiPolygon.coordinates, closedPolygons(), 'a second close adds no further positions');
    });

    test('an empty MultiPolygon closes to an empty coordinate list', function (assert) {
        const multiPolygon = new MultiPolygon([]);

        multiPolygon.close();

        assert.deepEqual(multiPolygon.coordinates, []);
    });

    test('the bounding box spans every polygon', function (assert) {
        assert.deepEqual(new MultiPolygon(closedPolygons()).toJSON().bbox, [0, 0, 30, 30]);
    });
});
