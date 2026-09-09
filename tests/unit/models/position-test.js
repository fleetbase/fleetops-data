import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE, FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | position', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'position', {
            order: { kind: 'belongsTo', type: 'order', async: false },
            destination: { kind: 'belongsTo', type: 'place', async: false },
        });
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('position'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
                createdAtShort: FIXED_DATE_SHORT,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    module('derived position', function () {
        test('location reads the raw coordinates attribute', function (assert) {
            const position = this.store.createRecord('position', { coordinates: [103.8198, 1.3521] });

            assert.deepEqual(position.location, [103.8198, 1.3521]);
        });

        test('latLng pairs latitude before longitude', function (assert) {
            const position = this.store.createRecord('position', { latitude: 1.3521, longitude: 103.8198 });

            assert.deepEqual(position.latLng, [1.3521, 103.8198]);
        });

        test('latLng is null unless both components are present', function (assert) {
            assert.strictEqual(this.store.createRecord('position').latLng, null);
            assert.strictEqual(this.store.createRecord('position', { latitude: 1.3521 }).latLng, null, 'a latitude alone is not a position');
            assert.strictEqual(this.store.createRecord('position', { longitude: 103.8198 }).latLng, null, 'nor is a longitude alone');
        });

        test('latLng treats null island as no position, because zero reads as absent here', function (assert) {
            assert.strictEqual(this.store.createRecord('position', { latitude: 0, longitude: 0 }).latLng, null);
        });
    });

    module('timestamp', function () {
        test('timestamp renders the creation instant to the second', function (assert) {
            const position = this.store.createRecord('position', { created_at: FIXED_DATE });

            assert.strictEqual(position.timestamp, '2024-03-14 09:05:00');
        });

        test('timestamp parses a date the server sent as a string', function (assert) {
            const position = this.store.createRecord('position');
            position.set('created_at', '2024-03-14T09:05:00');

            assert.strictEqual(position.timestamp, '2024-03-14 09:05:00', 'an ISO string is accepted as readily as a Date');
        });

        test('timestamp is null for a position that was never saved', function (assert) {
            assert.strictEqual(this.store.createRecord('position').timestamp, null);
        });

        test('timestamp is null for an unparseable date', function (assert) {
            const position = this.store.createRecord('position');
            position.set('created_at', 'not-a-date');

            assert.strictEqual(position.timestamp, null);
        });
    });

    module('speed conversion', function () {
        test('speedKmh converts metres per second to kilometres per hour', function (assert) {
            assert.strictEqual(this.store.createRecord('position', { speed: 10 }).speedKmh, '36.00');
        });

        test('speedMph converts metres per second to miles per hour', function (assert) {
            assert.strictEqual(this.store.createRecord('position', { speed: 10 }).speedMph, '22.37');
        });

        test('a stationary vehicle converts to zero rather than being treated as unknown', function (assert) {
            const position = this.store.createRecord('position', { speed: 0 });

            assert.strictEqual(position.speedKmh, '0.00');
            assert.strictEqual(position.speedMph, '0.00');
        });

        test('an unreported speed converts to the number zero', function (assert) {
            const position = this.store.createRecord('position');

            assert.strictEqual(position.speedKmh, 0, 'an unset speed yields a number, not a formatted string');
            assert.strictEqual(position.speedMph, 0);
        });

        test('an explicitly null speed converts to the number zero', function (assert) {
            const position = this.store.createRecord('position');
            position.set('speed', null);

            assert.strictEqual(position.speedKmh, 0);
            assert.strictEqual(position.speedMph, 0);
        });
    });
});
