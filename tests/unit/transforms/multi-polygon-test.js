import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import MultiPolygon from '@fleetbase/fleetops-data/utils/geojson/multi-polygon';

const RING = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 0],
];

const SECOND_RING = [
    [20, 20],
    [30, 20],
    [30, 30],
    [20, 20],
];

module('Unit | Transform | multi-polygon', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.transform = this.owner.lookup('transform:multi-polygon');
    });

    module('deserialize', function () {
        test('a GeoJSON multi-polygon from the server becomes a MultiPolygon geometry', function (assert) {
            const multiPolygon = this.transform.deserialize({ type: 'MultiPolygon', coordinates: [[RING]] });

            assert.ok(multiPolygon instanceof MultiPolygon);
            assert.strictEqual(multiPolygon.type, 'MultiPolygon');
            assert.deepEqual(multiPolygon.coordinates, [[RING]]);
        });

        test('a bare nested coordinate array becomes a MultiPolygon geometry', function (assert) {
            assert.deepEqual(this.transform.deserialize([[RING]]).coordinates, [[RING]]);
        });

        test('several disjoint polygons all survive', function (assert) {
            const coordinates = [[RING], [SECOND_RING]];

            assert.deepEqual(this.transform.deserialize({ type: 'MultiPolygon', coordinates }).coordinates, coordinates);
        });

        test('null stays null — an unset area is not an empty area', function (assert) {
            assert.strictEqual(this.transform.deserialize(null), null);
        });

        test('undefined stays undefined', function (assert) {
            assert.strictEqual(this.transform.deserialize(undefined), undefined);
        });

        test('an empty coordinate list is a valid, empty multi-polygon', function (assert) {
            assert.deepEqual(this.transform.deserialize([]).coordinates, []);
        });

        test('an unclosed ring is preserved as given', function (assert) {
            const open = [
                [0, 0],
                [10, 0],
                [10, 10],
            ];

            assert.deepEqual(this.transform.deserialize([[open]]).coordinates, [[open]]);
        });

        test('an unusable value is rejected rather than silently coerced', function (assert) {
            assert.throws(() => this.transform.deserialize({ type: 'Polygon', coordinates: [RING] }), /invalid input for new MultiPolygon/);
            assert.throws(() => this.transform.deserialize('MULTIPOLYGON EMPTY'), /invalid input for new MultiPolygon/);
        });
    });

    module('serialize', function () {
        test('a MultiPolygon geometry serializes to a MultiPolygon', function (assert) {
            const multiPolygon = this.transform.serialize(new MultiPolygon([[RING]]));

            assert.ok(multiPolygon instanceof MultiPolygon);
            assert.deepEqual(multiPolygon.coordinates, [[RING]]);
        });

        test('a bare nested coordinate array serializes to a MultiPolygon', function (assert) {
            assert.deepEqual(this.transform.serialize([[RING]]).coordinates, [[RING]]);
        });

        test('null and undefined pass straight through', function (assert) {
            assert.strictEqual(this.transform.serialize(null), null);
            assert.strictEqual(this.transform.serialize(undefined), undefined);
        });

        test('a value survives a deserialize/serialize round trip', function (assert) {
            const serialized = { type: 'MultiPolygon', coordinates: [[RING], [SECOND_RING]] };

            assert.deepEqual(this.transform.serialize(this.transform.deserialize(serialized)).coordinates, serialized.coordinates);
        });
    });

    module('through a model attribute', function () {
        test('a service area border is deserialized into a MultiPolygon the model can read', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceArea = store.push(store.normalize('service-area', { uuid: 'sa_1', border: { type: 'MultiPolygon', coordinates: [[RING]] } }));

            assert.ok(serviceArea.border instanceof MultiPolygon);
            assert.deepEqual(serviceArea.coordinates, RING, 'the model reads the first ring of the first polygon');
        });

        test('a service area with no border on the wire keeps a null border', function (assert) {
            const store = this.owner.lookup('service:store');
            const serviceArea = store.push(store.normalize('service-area', { uuid: 'sa_2', border: null }));

            assert.strictEqual(serviceArea.border, null);
            assert.deepEqual(serviceArea.coordinates, []);
        });
    });
});
