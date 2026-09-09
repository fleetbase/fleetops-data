import Point from '@fleetbase/fleetops-data/utils/geojson/point';
import { module, test } from 'qunit';

module('Unit | Utility | geojson/point', function () {
    test('a position array becomes the coordinates', function (assert) {
        const point = new Point([103.8198, 1.3521]);

        assert.strictEqual(point.type, 'Point');
        assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
    });

    test('two loose arguments are read as longitude and latitude', function (assert) {
        const point = new Point(103.8198, 1.3521);

        assert.strictEqual(point.type, 'Point');
        assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
    });

    test('a third argument is kept, so an altitude survives', function (assert) {
        assert.deepEqual(new Point(103.8198, 1.3521, 15).coordinates, [103.8198, 1.3521, 15]);
    });

    test('an existing Point geometry is adopted wholesale', function (assert) {
        const point = new Point({ type: 'Point', coordinates: [103.8198, 1.3521], id: 'origin' });

        assert.strictEqual(point.type, 'Point');
        assert.deepEqual(point.coordinates, [103.8198, 1.3521]);
        assert.strictEqual(point.id, 'origin', 'sibling members of the input are preserved');
    });

    test('a geometry of the wrong type is not adopted as-is', function (assert) {
        assert.throws(() => new Point({ type: 'LineString', coordinates: [[0, 0]] }), /invalid input for new Point/);
    });

    test('a zero-origin point is valid — 0,0 is a real position', function (assert) {
        assert.deepEqual(new Point(0, 0).coordinates, [0, 0]);
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new Point(), /invalid input for new Point/);
    });

    test('a single non-array argument is rejected', function (assert) {
        assert.throws(() => new Point('103.8198,1.3521'), /invalid input for new Point/);
    });

    test('null is rejected', function (assert) {
        assert.throws(() => new Point(null), /invalid input for new Point/);
    });

    test('the coordinates array is held by reference, not copied', function (assert) {
        const coordinates = [103.8198, 1.3521];
        const point = new Point(coordinates);

        coordinates[0] = 0;

        assert.strictEqual(point.coordinates[0], 0, 'the caller retains a live handle on the position');
    });
});
