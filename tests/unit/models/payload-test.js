import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE, FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertAttributeTypes, assertRelationships, threeDaysAgo } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | payload', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');

        /**
         * @param {String} id
         * @param {Object} attributes
         * @return {Model} a waypoint that already has an id, so it can be found
         *                 by `current_waypoint_uuid` and grouped against entities
         */
        this.waypoint = (id, attributes = {}) => this.store.push({ data: { type: 'waypoint', id, attributes } });

        this.place = (attributes) => this.store.createRecord('place', attributes);

        /**
         * @param {Number} longitude
         * @param {Number} latitude
         * @return {Object} a GeoJSON point suitable for a `point` transform
         */
        this.point = (longitude, latitude) => ({ type: 'Point', coordinates: [longitude, latitude] });
    });

    module('schema', function () {
        test('attributes carry the expected transforms', function (assert) {
            assertAttributeTypes(assert, this.store, 'payload', {
                public_id: 'string',
                current_waypoint_uuid: 'string',
                pickup_uuid: 'string',
                dropoff_uuid: 'string',
                return_uuid: 'string',
                meta: 'raw',
                cod_amount: 'string',
                cod_currency: 'string',
                cod_payment_method: 'string',
                payment_method: 'string',
                type: 'string',
                entities_count: 'number',
                waypoints_count: 'number',
                created_at: 'date',
                updated_at: 'date',
            });
        });

        test('the three named stops and the two collections are wired to the right models', function (assert) {
            assertRelationships(assert, this.store, 'payload', {
                pickup: { kind: 'belongsTo', type: 'place', async: false },
                dropoff: { kind: 'belongsTo', type: 'place', async: false },
                return: { kind: 'belongsTo', type: 'place', async: false },
                waypoints: { kind: 'hasMany', type: 'waypoint', async: false },
                entities: { kind: 'hasMany', type: 'entity', async: false },
            });
        });
    });

    module('presence flags', function () {
        test('collection flags follow their contents', function (assert) {
            const payload = this.store.createRecord('payload');

            assert.false(payload.hasEntities);
            assert.false(payload.hasWaypoints);

            payload.entities.pushObject(this.store.createRecord('entity'));
            payload.waypoints.pushObject(this.store.createRecord('waypoint'));

            assert.true(payload.hasEntities);
            assert.true(payload.hasWaypoints);
        });

        test('stop flags follow the identifier attributes, not the loaded records', function (assert) {
            const payload = this.store.createRecord('payload');

            assert.false(payload.hasPickup);
            assert.false(payload.hasDropoff);
            assert.false(payload.hasReturn);

            payload.setProperties({ pickup_uuid: 'place_1', dropoff_uuid: 'place_2', return_uuid: 'place_3' });

            assert.true(payload.hasPickup);
            assert.true(payload.hasDropoff);
            assert.true(payload.hasReturn);
        });

        test('hasIntermediateWaypoints is true as soon as any waypoint exists', function (assert) {
            const payload = this.store.createRecord('payload');

            assert.false(payload.hasIntermediateWaypoints);

            payload.waypoints.pushObject(this.store.createRecord('waypoint'));

            assert.true(payload.hasIntermediateWaypoints);
        });

        test('waypoint_count mirrors the server-supplied count, not the loaded length', function (assert) {
            const payload = this.store.createRecord('payload', { waypoints_count: 7 });

            assert.strictEqual(payload.waypoint_count, 7, 'the index count is exposed even with nothing loaded');
            assert.strictEqual(payload.waypoints.length, 0);
        });

        test('isMultiDrop requires waypoints and the absence of a fixed pickup and dropoff', function (assert) {
            const payload = this.store.createRecord('payload');

            assert.false(payload.isMultiDrop, 'no waypoints, no multi-drop');

            payload.waypoints.pushObject(this.store.createRecord('waypoint'));
            assert.true(payload.isMultiDrop);

            payload.set('pickup_uuid', 'place_1');
            assert.false(payload.isMultiDrop, 'a fixed pickup makes it a point-to-point order');

            payload.setProperties({ pickup_uuid: null, dropoff_uuid: 'place_2' });
            assert.false(payload.isMultiDrop, 'a fixed dropoff does the same');
        });
    });

    module('waypoint selection', function () {
        test('firstWaypoint is the head of the list', function (assert) {
            const payload = this.store.createRecord('payload');
            const first = this.waypoint('wp_1', { name: 'A' });
            payload.waypoints.pushObjects([first, this.waypoint('wp_2', { name: 'B' })]);

            assert.strictEqual(payload.firstWaypoint, first);
        });

        test('firstWaypoint is undefined with no waypoints', function (assert) {
            assert.strictEqual(this.store.createRecord('payload').firstWaypoint, undefined);
        });

        test('lastWaypoint is the tail once there is more than one stop', function (assert) {
            const payload = this.store.createRecord('payload');
            const last = this.waypoint('wp_2', { name: 'B' });
            payload.waypoints.pushObjects([this.waypoint('wp_1', { name: 'A' }), last]);

            assert.strictEqual(payload.lastWaypoint, last);
        });

        test('lastWaypoint is null for a single stop, which is already the first', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.waypoint('wp_1'));

            assert.strictEqual(payload.lastWaypoint, null);
        });

        test('lastWaypoint is null with no stops at all', function (assert) {
            assert.strictEqual(this.store.createRecord('payload').lastWaypoint, null);
        });

        test('currentWaypoint resolves the in-progress stop by id', function (assert) {
            const payload = this.store.createRecord('payload', { current_waypoint_uuid: 'wp_2' });
            const second = this.waypoint('wp_2', { name: 'B' });
            payload.waypoints.pushObjects([this.waypoint('wp_1', { name: 'A' }), second]);

            assert.strictEqual(payload.currentWaypoint, second);
        });

        test('currentWaypoint is undefined when the id matches nothing', function (assert) {
            const payload = this.store.createRecord('payload', { current_waypoint_uuid: 'wp_missing' });
            payload.waypoints.pushObject(this.waypoint('wp_1'));

            assert.strictEqual(payload.currentWaypoint, undefined);
        });

        test('middleWaypoints drops the first and last stops', function (assert) {
            const payload = this.store.createRecord('payload');
            const middle = this.waypoint('wp_2', { name: 'B' });
            payload.waypoints.pushObjects([this.waypoint('wp_1', { name: 'A' }), middle, this.waypoint('wp_3', { name: 'C' })]);

            assert.deepEqual(payload.middleWaypoints, [middle]);
        });

        test('middleWaypoints is empty when there is nothing in between', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObjects([this.waypoint('wp_1'), this.waypoint('wp_2')]);

            assert.deepEqual(payload.middleWaypoints, []);
        });

        test('nextStop is the dropoff for a point-to-point payload', function (assert) {
            const payload = this.store.createRecord('payload', { pickup_uuid: 'place_1', dropoff_uuid: 'place_2' });
            const dropoff = this.place({ name: 'Customer' });
            payload.set('dropoff', dropoff);

            assert.strictEqual(payload.nextStop, dropoff);
        });

        test('nextStop is the current waypoint for a multi-drop payload', function (assert) {
            const payload = this.store.createRecord('payload', { current_waypoint_uuid: 'wp_2' });
            const second = this.waypoint('wp_2', { name: 'B' });
            payload.waypoints.pushObjects([this.waypoint('wp_1', { name: 'A' }), second]);

            assert.strictEqual(payload.nextStop, second);
        });

        test('nextStop falls back to the first waypoint when none is in progress', function (assert) {
            const payload = this.store.createRecord('payload');
            const first = this.waypoint('wp_1', { name: 'A' });
            payload.waypoints.pushObjects([first, this.waypoint('wp_2', { name: 'B' })]);

            assert.strictEqual(payload.nextStop, first);
        });
    });

    module('place collections', function () {
        test('places runs pickup, waypoints and dropoff in travel order', function (assert) {
            const payload = this.store.createRecord('payload');
            const pickup = this.place({ name: 'Depot' });
            const dropoff = this.place({ name: 'Customer' });
            const waypoint = this.waypoint('wp_1', { name: 'Stop' });

            payload.set('pickup', pickup);
            payload.set('dropoff', dropoff);
            payload.waypoints.pushObject(waypoint);

            assert.deepEqual(payload.places, [pickup, waypoint, dropoff]);
        });

        test('places omits stops that were never set', function (assert) {
            const payload = this.store.createRecord('payload');
            const waypoint = this.waypoint('wp_1');
            payload.waypoints.pushObject(waypoint);

            assert.deepEqual(payload.places, [waypoint], 'no null placeholders leak through');
        });

        test('orderWaypoints materializes the relationship as a plain array', function (assert) {
            const payload = this.store.createRecord('payload');
            const waypoint = this.waypoint('wp_1');
            payload.waypoints.pushObject(waypoint);

            const result = payload.orderWaypoints;

            assert.true(Array.isArray(result), 'the caller gets a real array, not a live relationship');
            assert.deepEqual(result, [waypoint]);
        });

        test('waypointPlaces prefers the place behind each waypoint', function (assert) {
            const payload = this.store.createRecord('payload');
            const place = this.place({ name: 'Warehouse' });
            const withPlace = this.waypoint('wp_1');
            const withoutPlace = this.waypoint('wp_2', { name: 'Ad-hoc stop' });

            withPlace.set('place', place);
            payload.waypoints.pushObjects([withPlace, withoutPlace]);

            assert.deepEqual(payload.waypointPlaces, [place, withoutPlace], 'a waypoint with no place stands in for itself');
        });
    });

    module('coordinate collections', function () {
        test('payloadCoordinates lists longitude/latitude pairs across the whole route', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.place({ location: this.point(103.8, 1.35) }));
            payload.set('dropoff', this.place({ location: this.point(103.9, 1.36) }));
            payload.waypoints.pushObject(this.store.createRecord('waypoint', { location: this.point(103.85, 1.355) }));

            assert.deepEqual(payload.payloadCoordinates, [
                [103.8, 1.35],
                [103.85, 1.355],
                [103.9, 1.36],
            ]);
        });

        test('routeWaypoints lists the same route as latitude/longitude pairs', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.place({ location: this.point(103.8, 1.35) }));
            payload.set('dropoff', this.place({ location: this.point(103.9, 1.36) }));

            assert.deepEqual(payload.routeWaypoints, [
                [1.35, 103.8],
                [1.36, 103.9],
            ]);
        });

        test('places with out-of-range coordinates are skipped rather than plotted', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.place({ location: this.point(103.8, 1.35) }));
            payload.set('dropoff', this.place({ location: this.point(500, 500) }));

            assert.deepEqual(payload.payloadCoordinates, [[103.8, 1.35]], 'the impossible position is dropped');
            assert.deepEqual(payload.routeWaypoints, [[1.35, 103.8]]);
        });

        test('places at null island are skipped, because 0,0 means unset here', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.place({ location: this.point(0, 0) }));
            payload.set('dropoff', this.place({ location: this.point(103.9, 1.36) }));

            assert.deepEqual(payload.payloadCoordinates, [[103.9, 1.36]]);
        });

        test('an empty payload plots nothing', function (assert) {
            const payload = this.store.createRecord('payload');

            assert.deepEqual(payload.payloadCoordinates, []);
            assert.deepEqual(payload.routeWaypoints, []);
        });
    });

    module('entity grouping', function () {
        test('entitiesByDestination groups entities under the waypoint they are bound for', function (assert) {
            const payload = this.store.createRecord('payload');
            const first = this.waypoint('wp_1', { name: 'A' });
            const second = this.waypoint('wp_2', { name: 'B' });
            payload.waypoints.pushObjects([first, second]);

            const parcelA = this.store.createRecord('entity', { destination_uuid: 'wp_1', name: 'Parcel A' });
            const parcelB = this.store.createRecord('entity', { destination_uuid: 'wp_2', name: 'Parcel B' });
            const parcelC = this.store.createRecord('entity', { destination_uuid: 'wp_1', name: 'Parcel C' });
            payload.entities.pushObjects([parcelA, parcelB, parcelC]);

            const groups = payload.entitiesByDestination;

            assert.strictEqual(groups.length, 2);
            assert.deepEqual(
                groups.map((group) => group.destinationId),
                ['wp_1', 'wp_2']
            );
            assert.strictEqual(groups[0].waypoint, first);
            assert.deepEqual(groups[0].entities, [parcelA, parcelC]);
            assert.deepEqual(groups[1].entities, [parcelB]);
        });

        test('waypoints with no entities produce no group', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObjects([this.waypoint('wp_1'), this.waypoint('wp_2')]);
            payload.entities.pushObject(this.store.createRecord('entity', { destination_uuid: 'wp_2' }));

            const groups = payload.entitiesByDestination;

            assert.strictEqual(groups.length, 1, 'the empty stop is not listed');
            assert.strictEqual(groups[0].destinationId, 'wp_2');
        });

        test('unsaved waypoints without an id are skipped', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint'));
            payload.entities.pushObject(this.store.createRecord('entity', { destination_uuid: null }));

            assert.deepEqual(payload.entitiesByDestination, [], 'an unsaved stop cannot be a destination yet');
        });

        test('an empty payload groups nothing', function (assert) {
            assert.deepEqual(this.store.createRecord('payload').entitiesByDestination, []);
        });
    });

    module('setters', function () {
        test('setWaypoints replaces the collection and renumbers the stops', function (assert) {
            const payload = this.store.createRecord('payload');
            const first = this.store.createRecord('waypoint', { name: 'A' });
            const second = this.store.createRecord('waypoint', { name: 'B' });

            assert.strictEqual(payload.setWaypoints([first, second]), payload, 'the payload is returned for chaining');
            assert.deepEqual(payload.waypoints.toArray(), [first, second]);
            assert.strictEqual(first.order, 0, 'the first stop is ordered zero');
            assert.strictEqual(second.order, 1);
        });

        test('setWaypoints with no argument clears the collection', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint'));

            payload.setWaypoints();

            assert.strictEqual(payload.waypoints.length, 0);
        });

        test('setEntities replaces the entity collection', function (assert) {
            const payload = this.store.createRecord('payload');
            const parcel = this.store.createRecord('entity', { name: 'Parcel' });

            assert.strictEqual(payload.setEntities([parcel]), payload);
            assert.deepEqual(payload.entities.toArray(), [parcel]);
        });

        test('setEntities with no argument clears the collection', function (assert) {
            const payload = this.store.createRecord('payload');
            payload.entities.pushObject(this.store.createRecord('entity'));

            payload.setEntities();

            assert.strictEqual(payload.entities.length, 0);
        });
    });

    module('formatted dates', function () {
        test('created_at renders long, short and relative forms', function (assert) {
            const payload = this.store.createRecord('payload', { created_at: FIXED_DATE });

            assert.strictEqual(payload.createdAt, FIXED_DATE_LONG);
            assert.strictEqual(payload.createdAtShort, FIXED_DATE_SHORT);

            payload.set('created_at', threeDaysAgo());
            assert.strictEqual(payload.createdAgo, THREE_DAYS_DISTANCE);
        });

        test('createdAt is null when the payload has never been saved', function (assert) {
            assert.strictEqual(this.store.createRecord('payload').createdAt, null);
        });

        test('updated_at renders long, short and relative forms', function (assert) {
            const payload = this.store.createRecord('payload', { updated_at: FIXED_DATE });

            assert.strictEqual(payload.updatedAt, FIXED_DATE_LONG);
            assert.strictEqual(payload.updatedAtShort, FIXED_DATE_SHORT);

            payload.set('updated_at', threeDaysAgo());
            assert.strictEqual(payload.updatedAgo, THREE_DAYS_DISTANCE);
        });
    });

    test('orderWaypoints hands back a plain array unchanged when it is not a live relationship', function (assert) {
        const payload = this.store.createRecord('payload');
        const plain = [this.store.createRecord('waypoint')];

        payload.set('waypoints', plain);

        assert.deepEqual(payload.orderWaypoints, plain, 'a plain array has no toArray to call, so it is returned as-is');
    });

    test('the waypoints relationship can never be absent, so orderWaypoints always materializes it', function (assert) {
        const payload = this.store.createRecord('payload');

        assert.throws(() => payload.set('waypoints', null), /array of records/, 'Ember Data refuses to unset a hasMany');
        assert.true(Array.isArray(payload.orderWaypoints), 'so the fallback in orderWaypoints is unreachable — see DEFECTS.md');
    });
});
