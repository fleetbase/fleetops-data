import pointsEqual from '@fleetbase/fleetops-data/utils/geojson/points-equal';
import { module, test } from 'qunit';

module('Unit | Utility | geojson/points-equal', function () {
    test('identical positions are equal', function (assert) {
        assert.true(pointsEqual([103.8198, 1.3521], [103.8198, 1.3521]));
    });

    test('positions that differ in longitude are not equal', function (assert) {
        assert.false(pointsEqual([103.8198, 1.3521], [103.82, 1.3521]));
    });

    test('positions that differ in latitude are not equal', function (assert) {
        assert.false(pointsEqual([103.8198, 1.3521], [103.8198, 1.35]));
    });

    test('comparison is strict, so a numeric string never matches a number', function (assert) {
        assert.false(pointsEqual([103.8198, 1.3521], ['103.8198', 1.3521]), 'a stringified coordinate is a different value');
    });

    test('two empty positions are equal', function (assert) {
        assert.true(pointsEqual([], []), 'there is nothing to disagree about');
    });

    test('only the left position is walked, so extra components on the right are ignored', function (assert) {
        assert.true(pointsEqual([103.8198, 1.3521], [103.8198, 1.3521, 15]), 'an altitude on the right does not make the positions differ');
    });

    test('missing components on the right are not equal', function (assert) {
        assert.false(pointsEqual([103.8198, 1.3521, 15], [103.8198, 1.3521]), 'undefined never equals a number');
    });

    test('a longer left position with all-matching components is equal', function (assert) {
        assert.true(pointsEqual([103.8198, 1.3521, 15], [103.8198, 1.3521, 15]));
    });
});
