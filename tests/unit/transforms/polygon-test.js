import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import Polygon from '@fleetbase/fleetops-data/utils/geojson/polygon';

const RING = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 0],
];

module('Unit | Transform | polygon', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.transform = this.owner.lookup('transform:polygon');
    });

    module('deserialize', function () {
        test('a GeoJSON polygon from the server becomes a Polygon geometry', function (assert) {
            const polygon = this.transform.deserialize({ type: 'Polygon', coordinates: [RING] });

            assert.ok(polygon instanceof Polygon);
            assert.strictEqual(polygon.type, 'Polygon');
            assert.deepEqual(polygon.coordinates, [RING]);
        });

        test('a bare ring array becomes a Polygon geometry', function (assert) {
            assert.deepEqual(this.transform.deserialize([RING]).coordinates, [RING]);
        });

        test('null stays null — an unset area is not an empty area', function (assert) {
            assert.strictEqual(this.transform.deserialize(null), null);
        });

        test('undefined stays undefined', function (assert) {
            assert.strictEqual(this.transform.deserialize(undefined), undefined);
        });

        test('a polygon with holes keeps every ring', function (assert) {
            const hole = [
                [2, 2],
                [4, 2],
                [4, 4],
                [2, 2],
            ];

            assert.deepEqual(this.transform.deserialize({ type: 'Polygon', coordinates: [RING, hole] }).coordinates, [RING, hole]);
        });

        test('an unclosed ring is preserved as given, not silently closed', function (assert) {
            const open = [
                [0, 0],
                [10, 0],
                [10, 10],
            ];

            assert.deepEqual(this.transform.deserialize([open]).coordinates, [open], 'closing is an explicit operation, not a side effect of loading');
        });

        test('an empty coordinate list is a valid, empty polygon', function (assert) {
            assert.deepEqual(this.transform.deserialize([]).coordinates, []);
        });

        test('an unusable value is rejected rather than silently coerced', function (assert) {
            assert.throws(() => this.transform.deserialize({ type: 'MultiPolygon', coordinates: [] }), /invalid input for new Polygon/);
            assert.throws(() => this.transform.deserialize('POLYGON((0 0))'), /invalid input for new Polygon/);
        });
    });

    module('serialize', function () {
        test('a Polygon geometry serializes to a Polygon', function (assert) {
            const polygon = this.transform.serialize(new Polygon([RING]));

            assert.ok(polygon instanceof Polygon);
            assert.deepEqual(polygon.coordinates, [RING]);
        });

        test('a bare ring array serializes to a Polygon', function (assert) {
            assert.deepEqual(this.transform.serialize([RING]).coordinates, [RING]);
        });

        test('null and undefined pass straight through', function (assert) {
            assert.strictEqual(this.transform.serialize(null), null);
            assert.strictEqual(this.transform.serialize(undefined), undefined);
        });

        test('a value survives a deserialize/serialize round trip', function (assert) {
            const serialized = { type: 'Polygon', coordinates: [RING] };

            assert.deepEqual(this.transform.serialize(this.transform.deserialize(serialized)).coordinates, serialized.coordinates);
        });
    });

    module('through a model attribute', function () {
        test('a zone border is deserialized into a Polygon the model can read', function (assert) {
            const store = this.owner.lookup('service:store');
            const zone = store.push(store.normalize('zone', { uuid: 'zone_1', border: { type: 'Polygon', coordinates: [RING] } }));

            assert.ok(zone.border instanceof Polygon);
            assert.deepEqual(zone.border.coordinates, [RING]);
            assert.deepEqual(zone.coordinates, RING, 'the model reads the outer ring');
        });

        test('a zone with no border on the wire keeps a null border', function (assert) {
            const store = this.owner.lookup('service:store');
            const zone = store.push(store.normalize('zone', { uuid: 'zone_2', border: null }));

            assert.strictEqual(zone.border, null);
            assert.deepEqual(zone.coordinates, [], 'and the model degrades to no coordinates');
        });
    });
});
