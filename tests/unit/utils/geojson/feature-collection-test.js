import FeatureCollection from '@fleetbase/fleetops-data/utils/geojson/feature-collection';
import Feature from '@fleetbase/fleetops-data/utils/geojson/feature';
import { module, test } from 'qunit';

function features() {
    return [
        { type: 'Feature', id: 'pickup', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { name: 'Pickup' } },
        { type: 'Feature', id: 'dropoff', geometry: { type: 'Point', coordinates: [10, 10] }, properties: { name: 'Dropoff' } },
    ];
}

module('Unit | Utility | geojson/feature-collection', function () {
    test('an existing FeatureCollection is adopted wholesale', function (assert) {
        const collection = new FeatureCollection({ type: 'FeatureCollection', features: features(), id: 'stops' });

        assert.strictEqual(collection.type, 'FeatureCollection');
        assert.strictEqual(collection.id, 'stops');
        assert.strictEqual(collection.features.length, 2);
    });

    test('a bare array of features is accepted', function (assert) {
        const collection = new FeatureCollection(features());

        assert.strictEqual(collection.type, 'FeatureCollection');
        assert.strictEqual(collection.features.length, 2);
    });

    test('an empty array is a valid, empty collection', function (assert) {
        const collection = new FeatureCollection([]);

        assert.strictEqual(collection.type, 'FeatureCollection');
        assert.deepEqual(collection.features, []);
    });

    test('no input is rejected', function (assert) {
        assert.throws(() => new FeatureCollection(), /invalid input for new FeatureCollection/);
    });

    test('a FeatureCollection-typed object without features is rejected', function (assert) {
        assert.throws(() => new FeatureCollection({ type: 'FeatureCollection' }), /invalid input for new FeatureCollection/);
    });

    test('a single feature object is rejected — a collection needs a list', function (assert) {
        assert.throws(() => new FeatureCollection(features()[0]), /invalid input for new FeatureCollection/);
    });

    test('forEach visits every feature with its index and the backing array', function (assert) {
        const collection = new FeatureCollection(features());
        const seen = [];

        collection.forEach(function (feature, index, all) {
            seen.push(feature.id);
            assert.strictEqual(index, seen.length - 1);
            assert.strictEqual(all, collection.features);
            assert.strictEqual(this, collection, 'the callback is bound to the collection');
        });

        assert.deepEqual(seen, ['pickup', 'dropoff']);
    });

    test('get finds a feature by id and returns it as a Feature', function (assert) {
        const found = new FeatureCollection(features()).get('dropoff');

        assert.ok(found instanceof Feature);
        assert.strictEqual(found.id, 'dropoff');
        assert.deepEqual(found.properties, { name: 'Dropoff' });
    });

    test('get returns the last match when ids repeat', function (assert) {
        const collection = new FeatureCollection([
            { type: 'Feature', id: 'stop', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { seq: 1 } },
            { type: 'Feature', id: 'stop', geometry: { type: 'Point', coordinates: [1, 1] }, properties: { seq: 2 } },
        ]);

        assert.deepEqual(collection.get('stop').properties, { seq: 2 }, 'the scan keeps overwriting, so the last one wins');
    });

    test('get rejects an id that is not in the collection', function (assert) {
        assert.throws(() => new FeatureCollection(features()).get('missing'), /invalid input for new Feature/, 'a miss surfaces rather than returning an empty feature');
    });

    test('the bounding box spans every feature', function (assert) {
        assert.deepEqual(new FeatureCollection(features()).toJSON().bbox, [0, 0, 10, 10]);
    });
});
