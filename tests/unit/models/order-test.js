import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import {
    FIXED_DATE,
    FIXED_DATE_PP,
    FIXED_DATE_SHORT,
    FIXED_DATE_TIME,
    THREE_DAYS_DISTANCE,
    assertAttributeTypes,
    assertDateGetters,
    assertRelationships,
    threeDaysAgo,
} from 'dummy/tests/helpers/model-contract';

/**
 * Replace the store methods an `order.load*()` helper reaches for, recording the
 * arguments it passed. Stubbing at the store boundary keeps these tests off the
 * network while still asserting the query the model actually issues, which is
 * the part of the contract the backend depends on.
 *
 * @param {Store} store
 * @param {Object} responses map of method name to a function returning the result
 * @return {Object[]} the recorded calls
 */
function recordStoreCalls(store, responses) {
    const calls = [];

    for (const [method, respond] of Object.entries(responses)) {
        store[method] = function (...args) {
            calls.push({ method, args });
            return Promise.resolve(respond(...args));
        };
    }

    return calls;
}

module('Unit | Model | order', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.order = () => this.store.createRecord('order');
    });

    module('schema', function () {
        test('identifier and scalar attributes carry the expected transforms', function (assert) {
            assertAttributeTypes(assert, this.store, 'order', {
                public_id: 'string',
                internal_id: 'string',
                payload_uuid: 'string',
                order_config_uuid: 'string',
                driver_assigned_uuid: 'string',
                status: 'string',
                type: 'string',
                distance: 'number',
                time: 'number',
                total_entities: 'number',
                transaction_amount: 'number',
                dispatched: 'boolean',
                started: 'boolean',
                adhoc: 'boolean',
                is_route_optimized: 'boolean',
                meta: 'raw',
                options: 'raw',
                tracker_data: 'raw',
                eta: 'raw',
                scheduled_at: 'date',
                dispatched_at: 'date',
                started_at: 'date',
                created_at: 'date',
                updated_at: 'date',
            });
        });

        test('orchestrator constraint attributes are declared', function (assert) {
            assertAttributeTypes(assert, this.store, 'order', {
                time_window_start: 'date',
                time_window_end: 'date',
                required_skills: 'raw',
                orchestrator_priority: 'number',
            });
        });

        test('relationships target the right models with the right loading strategy', function (assert) {
            assertRelationships(assert, this.store, 'order', {
                company: { kind: 'belongsTo', type: 'company' },
                order_config: { kind: 'belongsTo', type: 'order-config', async: false },
                customer: { kind: 'belongsTo', type: 'customer', async: false, polymorphic: true },
                facilitator: { kind: 'belongsTo', type: 'facilitator', async: false, polymorphic: true },
                transaction: { kind: 'belongsTo', type: 'transaction', async: false },
                payload: { kind: 'belongsTo', type: 'payload', async: false },
                driver_assigned: { kind: 'belongsTo', type: 'driver', async: false, inverse: 'jobs' },
                vehicle_assigned: { kind: 'belongsTo', type: 'vehicle', async: false },
                manifest: { kind: 'belongsTo', type: 'manifest', async: false },
                route: { kind: 'belongsTo', type: 'route', async: false },
                purchase_rate: { kind: 'belongsTo', type: 'purchase-rate', async: false },
                tracking_number: { kind: 'belongsTo', type: 'tracking-number', async: false },
                tracking_statuses: { kind: 'hasMany', type: 'tracking-status', async: false },
                comments: { kind: 'hasMany', type: 'comment', async: false },
                files: { kind: 'hasMany', type: 'file', async: false },
                custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
            });
        });

        test('a new order starts with its tracked UI flags cleared', function (assert) {
            const order = this.order();

            assert.false(order.selected);
            assert.false(order.imported);
            assert.false(order.servicable);
            assert.false(order.optimized);
            assert.strictEqual(order.cfManager, null);
        });
    });

    module('aliases', function () {
        test('driver and vehicle alias the assigned relationships in both directions', function (assert) {
            const order = this.order();
            const driver = this.store.createRecord('driver');
            const vehicle = this.store.createRecord('vehicle');

            order.set('driver_assigned', driver);
            order.set('vehicle_assigned', vehicle);

            assert.strictEqual(order.driver, driver, 'driver reads driver_assigned');
            assert.strictEqual(order.vehicle, vehicle, 'vehicle reads vehicle_assigned');

            const replacement = this.store.createRecord('driver');
            order.set('driver', replacement);

            assert.strictEqual(order.driver_assigned, replacement, 'writing the alias writes the relationship');
        });

        test('payload-derived aliases read straight through the payload', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            const pickup = this.store.createRecord('place', { name: 'Depot', location: { type: 'Point', coordinates: [103.8, 1.35] } });
            const dropoff = this.store.createRecord('place', { name: 'Customer', location: { type: 'Point', coordinates: [103.9, 1.36] } });

            payload.set('pickup', pickup);
            payload.set('dropoff', dropoff);
            order.set('payload', payload);

            assert.deepEqual(order.places, [pickup, dropoff], 'places alias');
            assert.deepEqual(order.payloadCoordinates, payload.payloadCoordinates, 'payloadCoordinates alias');
            assert.deepEqual(order.routeWaypoints, payload.routeWaypoints, 'routeWaypoints alias');
            assert.deepEqual(order.orderWaypoints, [], 'orderWaypoints alias');
            assert.deepEqual(order.waypointPlaces, [], 'waypointPlaces alias');
            assert.deepEqual(order.entitiesByDestination, [], 'entitiesByDestination alias');
            assert.false(order.isMultiDrop, 'isMultiDrop alias');
            assert.false(order.isMultiDropOrder, 'isMultiDropOrder alias');
            assert.false(order.hasIntermediateWaypoints, 'hasIntermediateWaypoints alias');
        });
    });

    module('pickupName', function () {
        test('a payload pickup name wins', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.store.createRecord('place', { name: 'Depot', street1: '1 Main St' }));
            order.set('payload', payload);

            assert.strictEqual(order.pickupName, 'Depot');
        });

        test('a payload pickup without a name falls back to its street', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.set('pickup', this.store.createRecord('place', { street1: '1 Main St' }));
            order.set('payload', payload);

            assert.strictEqual(order.pickupName, '1 Main St');
        });

        test('with no pickup, the current waypoint is used', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            const waypoint = this.store.push({ data: { type: 'waypoint', id: 'wp_2', attributes: { name: 'Stop B' } } });

            payload.waypoints.pushObjects([this.store.push({ data: { type: 'waypoint', id: 'wp_1', attributes: { name: 'Stop A' } } }), waypoint]);
            payload.set('current_waypoint_uuid', 'wp_2');
            order.set('payload', payload);

            assert.strictEqual(order.pickupName, 'Stop B', 'the waypoint in progress is the pickup');
        });

        test('with no pickup and no current waypoint, the first waypoint is used', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint', { name: 'Stop A' }));
            order.set('payload', payload);

            assert.strictEqual(order.pickupName, 'Stop A');
        });

        test('a first waypoint without a name falls back to its street', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint', { street1: '2 Side St' }));
            order.set('payload', payload);

            assert.strictEqual(order.pickupName, '2 Side St');
        });

        test('an adhoc order whose pickup is the driver location reports Dynamic', function (assert) {
            const order = this.order();
            order.set('meta', { pickup_is_driver_location: true });

            assert.strictEqual(order.pickupName, 'Dynamic');
        });

        test('with nothing to go on the name is None', function (assert) {
            const order = this.order();
            order.set('meta', {});

            assert.strictEqual(order.pickupName, 'None');
        });

        test('a missing meta is tolerated rather than throwing', function (assert) {
            const order = this.order();

            assert.strictEqual(order.meta, undefined, 'a fresh order really has no meta');
            assert.strictEqual(order.pickupName, 'None', 'the getter does not blow up on an order that was never hydrated');
        });

        test('a null meta is tolerated', function (assert) {
            const order = this.order();
            order.set('meta', null);

            assert.strictEqual(order.pickupName, 'None');
        });
    });

    module('dropoffName', function () {
        test('a payload dropoff name wins', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.set('dropoff', this.store.createRecord('place', { name: 'Customer', street1: '9 End Rd' }));
            order.set('payload', payload);

            assert.strictEqual(order.dropoffName, 'Customer');
        });

        test('a payload dropoff without a name falls back to its street', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.set('dropoff', this.store.createRecord('place', { street1: '9 End Rd' }));
            order.set('payload', payload);

            assert.strictEqual(order.dropoffName, '9 End Rd');
        });

        test('with no dropoff, the last waypoint is used', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObjects([this.store.createRecord('waypoint', { name: 'Stop A' }), this.store.createRecord('waypoint', { name: 'Stop B' })]);
            order.set('payload', payload);

            assert.strictEqual(order.dropoffName, 'Stop B');
        });

        test('a last waypoint without a name falls back to its street', function (assert) {
            const order = this.order();
            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint', { street1: '9 End Rd' }));
            order.set('payload', payload);

            assert.strictEqual(order.dropoffName, '9 End Rd');
        });

        test('an adhoc order whose pickup is the driver location reports Dynamic', function (assert) {
            const order = this.order();
            order.set('meta', { pickup_is_driver_location: true });

            assert.strictEqual(order.dropoffName, 'Dynamic');
        });

        test('with nothing to go on the name is None, even without meta', function (assert) {
            const order = this.order();

            assert.strictEqual(order.dropoffName, 'None');
        });
    });

    module('formatted dates', function () {
        test('created_at renders long, short and relative forms', function (assert) {
            assertDateGetters(
                assert,
                this.order(),
                'created_at',
                {
                    createdAt: FIXED_DATE_PP,
                    createdAtShort: FIXED_DATE_SHORT,
                    createdAtWithTime: FIXED_DATE_PP,
                    createdAtDetailed: FIXED_DATE_PP,
                },
                { createdAgo: THREE_DAYS_DISTANCE }
            );
        });

        test('updated_at renders long, short and relative forms', function (assert) {
            assertDateGetters(assert, this.order(), 'updated_at', { updatedAt: FIXED_DATE_PP, updatedAtShort: FIXED_DATE_SHORT }, { updatedAgo: THREE_DAYS_DISTANCE });
        });

        test('dispatched_at renders long, short and relative forms', function (assert) {
            assertDateGetters(assert, this.order(), 'dispatched_at', { dispatchedAt: FIXED_DATE_PP, dispatchedAtShort: FIXED_DATE_SHORT }, { dispatchedAgo: THREE_DAYS_DISTANCE });
        });

        test('started_at renders long, short and relative forms', function (assert) {
            assertDateGetters(assert, this.order(), 'started_at', { startedAt: FIXED_DATE_PP, startedAtShort: FIXED_DATE_SHORT }, { startedAgo: THREE_DAYS_DISTANCE });
        });

        test('scheduled_at renders a full timestamp and a bare time', function (assert) {
            assertDateGetters(assert, this.order(), 'scheduled_at', { scheduledAt: FIXED_DATE_PP, scheduledAtTime: FIXED_DATE_TIME });
        });

        test('eventTitle combines the scheduled time with the public id', function (assert) {
            const order = this.order();
            order.setProperties({ scheduled_at: FIXED_DATE, public_id: 'order_abc123' });

            assert.strictEqual(order.eventTitle, `${FIXED_DATE_TIME} - order_abc123`);
        });

        test('eventTitle degrades to a null time rather than throwing on an unscheduled order', function (assert) {
            const order = this.order();
            order.setProperties({ scheduled_at: null, public_id: 'order_abc123' });

            assert.strictEqual(order.eventTitle, 'null - order_abc123');
        });
    });

    module('state flags', function () {
        test('presence macros follow the identifier attributes', function (assert) {
            const order = this.order();

            assert.false(order.has_facilitator);
            assert.false(order.has_customer);
            assert.false(order.has_tracking_number);
            assert.false(order.has_purchase_rate);
            assert.false(order.has_payload);
            assert.false(order.has_tracking_statuses);
            assert.false(order.isIntegratedVendorOrder);

            order.setProperties({
                facilitator_uuid: 'fac_1',
                customer_uuid: 'cus_1',
                tracking_number_uuid: 'trk_1',
                purchase_rate_uuid: 'pr_1',
                payload_uuid: 'pay_1',
                meta: { integrated_vendor: 'lalamove' },
            });
            order.tracking_statuses.pushObject(this.store.createRecord('tracking-status'));

            assert.true(order.has_facilitator);
            assert.true(order.has_customer);
            assert.true(order.has_tracking_number);
            assert.true(order.has_purchase_rate);
            assert.true(order.has_payload);
            assert.true(order.has_tracking_statuses);
            assert.true(order.isIntegratedVendorOrder);
        });

        test('dispatch flags mirror the dispatched attribute', function (assert) {
            const order = this.order();

            assert.false(order.isDispatched);
            assert.true(order.isNotDispatched);

            order.set('dispatched', true);

            assert.true(order.isDispatched);
            assert.false(order.isNotDispatched);
        });

        test('status equality flags identify exactly one status at a time', function (assert) {
            const order = this.order();
            const flags = { created: 'isFresh', preparing: 'isPreparing', completed: 'isCompleted', canceled: 'isCanceled', ready: 'isReady' };

            for (const status of Object.keys(flags)) {
                order.set('status', status);

                for (const [otherStatus, otherFlag] of Object.entries(flags)) {
                    assert.strictEqual(order[otherFlag], status === otherStatus, `${otherFlag} is ${status === otherStatus} when status is ${status}`);
                }
            }
        });

        test('hasActiveStatus is false only once the order is finished', function (assert) {
            const order = this.order();

            order.set('status', 'dispatched');
            assert.true(order.hasActiveStatus);

            order.set('status', 'canceled');
            assert.false(order.hasActiveStatus);

            order.set('status', 'completed');
            assert.false(order.hasActiveStatus);
        });

        test('activityHasEnded tracks the terminal statuses', function (assert) {
            const order = this.order();

            order.set('status', 'created');
            assert.false(order.activityHasEnded);

            order.set('status', 'canceled');
            assert.true(order.activityHasEnded);

            order.set('status', 'completed');
            assert.true(order.activityHasEnded);
        });

        test('canLoadDriver is true only when a driver is claimed but absent', function (assert) {
            const order = this.order();

            assert.notOk(order.canLoadDriver, 'an order that never declared a driver has nothing to load');

            order.set('has_driver_assigned', false);
            assert.false(order.canLoadDriver, 'an explicit no is still a no');

            order.set('has_driver_assigned', true);
            assert.true(order.canLoadDriver, 'a driver is claimed but not loaded');

            order.set('driver_assigned', this.store.createRecord('driver'));
            assert.false(order.canLoadDriver, 'the driver is already in hand');
        });

        test('shouldDisplayDispatchLabel is suppressed once the order moves past dispatch', function (assert) {
            const order = this.order();
            order.setProperties({ dispatched: true, status: 'created' });

            assert.true(order.shouldDisplayDispatchLabel);

            for (const status of ['canceled', 'completed', 'dispatched']) {
                order.set('status', status);
                assert.false(order.shouldDisplayDispatchLabel, `hidden while ${status}`);
            }

            order.setProperties({ dispatched: false, status: 'created' });
            assert.false(order.shouldDisplayDispatchLabel, 'hidden when the order was never dispatched');
        });

        test('canBeDispatched requires an undispatched, unfinished, non-integrated order', function (assert) {
            const order = this.order();
            order.set('status', 'created');

            assert.true(order.canBeDispatched);

            order.set('meta', { integrated_vendor: 'lalamove' });
            assert.false(order.canBeDispatched, 'integrated vendor orders dispatch on their side');

            order.set('meta', {});
            order.set('dispatched', true);
            assert.false(order.canBeDispatched, 'already dispatched');

            order.set('dispatched', false);
            for (const status of ['canceled', 'completed', 'dispatched']) {
                order.set('status', status);
                assert.false(order.canBeDispatched, `not dispatchable while ${status}`);
            }
        });

        test('isPickupReady requires both the ready status and the pickup meta flag', function (assert) {
            const order = this.order();

            order.setProperties({ status: 'ready', meta: { is_pickup: true } });
            assert.true(order.isPickupReady);

            order.set('meta', { is_pickup: false });
            assert.false(order.isPickupReady);

            order.setProperties({ status: 'created', meta: { is_pickup: true } });
            assert.false(order.isPickupReady);

            order.set('meta', null);
            assert.false(order.isPickupReady, 'a missing meta is not a ready pickup');
        });

        test('multi-drop getters delegate to the payload and tolerate its absence', function (assert) {
            const order = this.order();

            assert.strictEqual(order.isMultipleDropoffOrder, undefined, 'no payload means no answer');
            assert.strictEqual(order.hasWaypoints, undefined);

            const payload = this.store.createRecord('payload');
            payload.waypoints.pushObject(this.store.createRecord('waypoint'));
            order.set('payload', payload);

            assert.true(order.isMultipleDropoffOrder);
            assert.true(order.hasWaypoints);
        });
    });

    module('setters', function () {
        test('setPayload assigns the payload and inherits the order type', function (assert) {
            const order = this.order();
            order.set('type', 'transport');
            const payload = this.store.createRecord('payload');

            assert.strictEqual(order.setPayload(payload), order, 'the order is returned for chaining');
            assert.strictEqual(order.payload, payload);
            assert.strictEqual(payload.type, 'transport', 'an untyped payload takes the order type');
        });

        test('setPayload leaves an already-typed payload alone', function (assert) {
            const order = this.order();
            order.set('type', 'transport');
            const payload = this.store.createRecord('payload', { type: 'haulage' });

            order.setPayload(payload);

            assert.strictEqual(payload.type, 'haulage');
        });

        test('setPayload ignores anything that is not a model', function (assert) {
            const order = this.order();

            assert.strictEqual(order.setPayload(), order);
            assert.strictEqual(order.setPayload({ type: 'transport' }), order);
            assert.strictEqual(order.payload, null, 'no plain object was smuggled into the relationship');
        });

        test('setRoute assigns the route', function (assert) {
            const order = this.order();
            const route = this.store.createRecord('route');

            assert.strictEqual(order.setRoute(route), order);
            assert.strictEqual(order.route, route);
        });

        test('setRoute ignores anything that is not a model', function (assert) {
            const order = this.order();

            assert.strictEqual(order.setRoute(), order);
            assert.strictEqual(order.setRoute({}), order);
            assert.strictEqual(order.route, null);
        });
    });

    module('meta serialization', function () {
        test('serializeMetaFromFields turns a key/value list into a meta object', function (assert) {
            const order = this.order();

            assert.strictEqual(
                order.serializeMetaFromFields([
                    { key: 'vehicle_type', value: 'van' },
                    { key: 'crew_size', value: 2 },
                ]),
                order
            );
            assert.deepEqual(order.meta, { vehicle_type: 'van', crew_size: 2 });
        });

        test('serializeMetaFromFields skips entries with no key', function (assert) {
            const order = this.order();

            order.serializeMetaFromFields([null, { value: 'orphan' }, { key: 'vehicle_type', value: 'van' }]);

            assert.deepEqual(order.meta, { vehicle_type: 'van' });
        });

        test('serializeMetaFromFields defaults to clearing meta', function (assert) {
            const order = this.order();
            order.set('meta', { stale: true });

            order.serializeMetaFromFields();

            assert.deepEqual(order.meta, {});
        });

        test('serializeMetaFromFields refuses a non-array', function (assert) {
            const order = this.order();
            order.set('meta', { untouched: true });

            assert.strictEqual(order.serializeMetaFromFields('nope'), order);
            assert.deepEqual(order.meta, { untouched: true }, 'meta is left alone');
        });

        test('serializeMetaFromGroupedFields flattens grouped fields and merges into existing meta', function (assert) {
            const order = this.order();
            order.set('meta', { existing: 'kept' });

            const groups = A([
                EmberObject.create({ items: A([EmberObject.create({ key: 'vehicle_type', value: 'van' })]) }),
                EmberObject.create({ items: A([EmberObject.create({ key: 'crew_size', value: 2 })]) }),
            ]);

            assert.strictEqual(order.serializeMetaFromGroupedFields(groups), order);
            assert.deepEqual(order.meta, { existing: 'kept', vehicle_type: 'van', crew_size: 2 });
        });

        test('serializeMetaFromGroupedFields normalizes a falsy value to null', function (assert) {
            const order = this.order();
            const groups = A([EmberObject.create({ items: A([EmberObject.create({ key: 'notes', value: '' })]) })]);

            order.serializeMetaFromGroupedFields(groups);

            assert.deepEqual(order.meta, { notes: null }, 'an empty value is stored as an explicit null');
        });

        test('serializeMetaFromGroupedFields skips malformed groups and keyless fields', function (assert) {
            const order = this.order();
            const groups = A([null, EmberObject.create({ items: 'not-a-list' }), EmberObject.create({ items: A([null, EmberObject.create({ value: 'orphan' })]) })]);

            order.serializeMetaFromGroupedFields(groups);

            assert.deepEqual(order.meta, {});
        });

        test('serializeMetaFromGroupedFields refuses a non-array', function (assert) {
            const order = this.order();
            order.set('meta', { untouched: true });

            assert.strictEqual(order.serializeMetaFromGroupedFields('nope'), order);
            assert.deepEqual(order.meta, { untouched: true });
        });

        test('serializeMeta converts a meta array into an object in place', function (assert) {
            const order = this.order();
            order.set(
                'meta',
                A([
                    { key: 'vehicle_type', value: 'van' },
                    { key: 'crew_size', value: 2 },
                ])
            );

            assert.strictEqual(order.serializeMeta(), order);
            assert.deepEqual(order.meta, { vehicle_type: 'van', crew_size: 2 });
        });

        test('serializeMeta writes a dotted key into an object an earlier field created', function (assert) {
            const order = this.order();
            order.set(
                'meta',
                A([
                    { key: 'contact', value: {} },
                    { key: 'contact.name', value: 'Ada' },
                ])
            );

            order.serializeMeta();

            assert.deepEqual(order.meta, { contact: { name: 'Ada' } }, 'the path is resolved against what has been built so far');
        });

        test('serializeMeta rejects a dotted key whose parent does not exist', function (assert) {
            const order = this.order();
            order.set('meta', A([{ key: 'contact.name', value: 'Ada' }]));

            assert.throws(() => order.serializeMeta(), /object in path "contact" could not be found/, 'nested meta has to be built parent-first');
        });

        test('serializeMeta skips entries with no key', function (assert) {
            const order = this.order();
            order.set('meta', A([{ value: 'orphan' }, { key: 'vehicle_type', value: 'van' }]));

            order.serializeMeta();

            assert.deepEqual(order.meta, { vehicle_type: 'van' });
        });

        test('serializeMeta leaves an already-serialized meta object alone', function (assert) {
            const order = this.order();
            order.set('meta', { vehicle_type: 'van' });

            assert.strictEqual(order.serializeMeta(), order);
            assert.deepEqual(order.meta, { vehicle_type: 'van' });
        });
    });

    module('persistence', function (hooks) {
        hooks.beforeEach(function () {
            this.requests = [];
            this.owner.register(
                'service:fetch',
                class {
                    static create() {
                        return new this();
                    }
                },
                { instantiate: false }
            );
        });

        /**
         * @param {Object} context
         * @param {Object} responses map of verb to the value the fake returns
         */
        function registerFetch(context, responses = {}) {
            const requests = [];

            context.owner.register(
                'service:fetch',
                {
                    put(path, body, options) {
                        requests.push({ verb: 'put', path, body, options });
                        return Promise.resolve(responses.put);
                    },
                    get(path, params, options) {
                        requests.push({ verb: 'get', path, params, options });
                        return Promise.resolve(responses.get);
                    },
                },
                { instantiate: false }
            );

            return requests;
        }

        test('persistProperties PUTs the changed properties and normalizes the response', async function (assert) {
            const updated = { id: 'order_1' };
            const requests = registerFetch(this, { put: updated });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            const before = [];
            const after = [];

            await order.persistProperties({ status: 'dispatched', dispatched: true }, { onBefore: (o) => before.push(o), onAfter: (o) => after.push(o) });

            assert.deepEqual(requests, [
                {
                    verb: 'put',
                    path: 'orders/order_1',
                    body: { status: 'dispatched', dispatched: true },
                    options: { normalizeToEmberData: true, normalizeModelType: 'order' },
                },
            ]);
            assert.strictEqual(order.status, 'dispatched', 'the properties are applied locally too');
            assert.deepEqual(before, [order], 'onBefore receives the order');
            assert.deepEqual(after, [updated], 'onAfter receives the normalized response');
        });

        test('persistProperties works without callbacks', async function (assert) {
            const requests = registerFetch(this, { put: {} });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            await order.persistProperties({ notes: 'hello' });

            assert.strictEqual(requests.length, 1);
            assert.strictEqual(order.notes, 'hello');
        });

        test('persistProperties defaults to sending nothing', async function (assert) {
            const requests = registerFetch(this, { put: {} });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            await order.persistProperties();

            assert.deepEqual(requests[0].body, {});
        });

        test('persistProperty PUTs a single property', async function (assert) {
            const requests = registerFetch(this, { put: {} });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            await order.persistProperty('status', 'completed');

            assert.deepEqual(requests[0].body, { status: 'completed' });
            assert.strictEqual(order.status, 'completed');
        });

        test('loadTrackerData GETs the tracker endpoint and caches the result', async function (assert) {
            const trackerData = { progress: 0.5 };
            const requests = registerFetch(this, { get: trackerData });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            const result = await order.loadTrackerData({ verbose: true });

            assert.deepEqual(requests[0], { verb: 'get', path: 'orders/order_1/tracker', params: { verbose: true }, options: {} });
            assert.strictEqual(result, trackerData);
            assert.strictEqual(order.tracker_data, trackerData, 'the response is stored on the record');
        });

        test('loadETA GETs the eta endpoint and caches the result', async function (assert) {
            const eta = { seconds: 900 };
            const requests = registerFetch(this, { get: eta });
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });

            const result = await order.loadETA();

            assert.deepEqual(requests[0], { verb: 'get', path: 'orders/order_1/eta', params: {}, options: {} });
            assert.strictEqual(result, eta);
            assert.strictEqual(order.eta, eta);
        });
    });

    module('relationship loading', function () {
        test('loadPayload does nothing without a payload id', async function (assert) {
            const order = this.order();
            const calls = recordStoreCalls(this.store, { queryRecord: () => null });

            assert.strictEqual(await order.loadPayload(), undefined);
            assert.deepEqual(calls, [], 'no request is made');
        });

        test('loadPayload queries with the relations the detail view needs', async function (assert) {
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { payload_uuid: 'pay_1' } } });
            const payload = this.store.createRecord('payload');
            const calls = recordStoreCalls(this.store, { queryRecord: () => payload });

            const result = await order.loadPayload({ reload: true });

            assert.strictEqual(result, payload);
            assert.strictEqual(order.payload, payload, 'the payload is attached to the order');
            assert.deepEqual(calls[0].args, ['payload', { uuid: 'pay_1', single: true, with: ['pickup', 'dropoff', 'return', 'waypoints', 'entities'] }, { reload: true }]);
        });

        test('loadPayload reuses a payload that already has its waypoint collection', async function (assert) {
            const payload = this.store.createRecord('payload');
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { payload_uuid: 'pay_1' } } });
            order.set('payload', payload);
            const calls = recordStoreCalls(this.store, { queryRecord: () => null });

            assert.strictEqual(await order.loadPayload(), payload);
            assert.deepEqual(calls, [], 'the cached payload is good enough');
        });

        test('loadPayload upgrades a lightweight index payload whose waypoints were only counted', async function (assert) {
            const indexed = this.store.createRecord('payload', { waypoints_count: 3 });
            const full = this.store.createRecord('payload');
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { payload_uuid: 'pay_1' } } });
            order.set('payload', indexed);
            const calls = recordStoreCalls(this.store, { queryRecord: () => full });

            assert.strictEqual(await order.loadPayload(), full, 'the counted-but-unloaded waypoints force a refetch');
            assert.strictEqual(calls.length, 1);
        });

        test('loadCustomer fetches the concrete polymorphic customer type', async function (assert) {
            const order = this.store.push({
                data: { type: 'order', id: 'order_1', attributes: { customer_uuid: 'cus_1', customer_type: 'contact' } },
            });
            const customer = this.store.createRecord('customer-contact');
            const calls = recordStoreCalls(this.store, { findRecord: () => customer });

            const result = await order.loadCustomer({ reload: true });

            assert.strictEqual(result, customer);
            assert.strictEqual(order.customer, customer);
            assert.deepEqual(calls[0].args, ['customer-contact', 'cus_1', { reload: true }]);
        });

        test('loadCustomer does nothing when the customer is already loaded', async function (assert) {
            const order = this.store.push({
                data: { type: 'order', id: 'order_1', attributes: { customer_uuid: 'cus_1', customer_type: 'contact' } },
            });
            order.set('customer', this.store.createRecord('customer-contact'));
            const calls = recordStoreCalls(this.store, { findRecord: () => null });

            assert.strictEqual(await order.loadCustomer(), undefined);
            assert.deepEqual(calls, []);
        });

        test('loadCustomer does nothing without a customer id', async function (assert) {
            const order = this.order();
            const calls = recordStoreCalls(this.store, { findRecord: () => null });

            assert.strictEqual(await order.loadCustomer(), undefined);
            assert.deepEqual(calls, []);
        });

        const SIMPLE_LOADERS = [
            { method: 'loadPurchaseRate', idAttribute: 'purchase_rate_uuid', relationship: 'purchase_rate', modelName: 'purchase-rate' },
            { method: 'loadOrderConfig', idAttribute: 'order_config_uuid', relationship: 'order_config', modelName: 'order-config' },
            { method: 'loadDriver', idAttribute: 'driver_assigned_uuid', relationship: 'driver_assigned', modelName: 'driver' },
            { method: 'loadTrackingNumber', idAttribute: 'tracking_number_uuid', relationship: 'tracking_number', modelName: 'tracking-number' },
        ];

        for (const { method, idAttribute, relationship, modelName } of SIMPLE_LOADERS) {
            test(`${method} fetches ${modelName} by its id and attaches it`, async function (assert) {
                const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { [idAttribute]: 'rel_1' } } });
                const related = this.store.createRecord(modelName);
                const calls = recordStoreCalls(this.store, { findRecord: () => related });

                const result = await order[method]({ reload: true });

                assert.strictEqual(result, related);
                assert.strictEqual(order[relationship], related);
                assert.deepEqual(calls[0].args, [modelName, 'rel_1', { reload: true }]);
            });

            test(`${method} does nothing when there is no id to fetch`, async function (assert) {
                const order = this.order();
                const calls = recordStoreCalls(this.store, { findRecord: () => null });

                assert.strictEqual(await order[method](), undefined);
                assert.deepEqual(calls, []);
            });

            test(`${method} does nothing when the relationship is already loaded`, async function (assert) {
                const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { [idAttribute]: 'rel_1' } } });
                order.set(relationship, this.store.createRecord(modelName));
                const calls = recordStoreCalls(this.store, { findRecord: () => null });

                assert.strictEqual(await order[method](), undefined);
                assert.deepEqual(calls, []);
            });
        }

        test('loadTrackingActivity queries statuses for the tracking number', async function (assert) {
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: { tracking_number_uuid: 'trk_1' } } });
            const statuses = A([this.store.createRecord('tracking-status')]);
            statuses.toArray = () => [...statuses];
            const calls = recordStoreCalls(this.store, { query: () => statuses });

            const result = await order.loadTrackingActivity({ reload: true });

            assert.strictEqual(result, statuses);
            assert.deepEqual(calls[0].args, ['tracking-status', { tracking_number_uuid: 'trk_1' }, { reload: true }]);
            assert.strictEqual(order.tracking_statuses.length, 1, 'the statuses land on the order');
        });

        test('loadTrackingActivity does nothing without a tracking number', async function (assert) {
            const order = this.order();
            const calls = recordStoreCalls(this.store, { query: () => [] });

            assert.strictEqual(await order.loadTrackingActivity(), undefined);
            assert.deepEqual(calls, []);
        });

        test('loadComments queries top-level comments newest first', async function (assert) {
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });
            const comments = A([this.store.createRecord('comment')]);
            const calls = recordStoreCalls(this.store, { query: () => comments });

            const result = await order.loadComments({ reload: true });

            assert.strictEqual(result, comments);
            assert.deepEqual(calls[0].args, ['comment', { subject_uuid: 'order_1', withoutParent: 1, sort: '-created_at' }, { reload: true }]);
            assert.strictEqual(order.comments.length, 1);
        });

        test('loadFiles queries the order attachments newest first', async function (assert) {
            const order = this.store.push({ data: { type: 'order', id: 'order_1', attributes: {} } });
            const files = A([this.store.createRecord('file')]);
            const calls = recordStoreCalls(this.store, { query: () => files });

            const result = await order.loadFiles();

            assert.strictEqual(result, files);
            assert.deepEqual(calls[0].args, ['file', { subject_uuid: 'order_1', sort: '-created_at' }, {}]);
            assert.strictEqual(order.files.length, 1);
        });
    });

    module('date edge cases', function () {
        test('a date three days old renders both an absolute and a relative form', function (assert) {
            const order = this.order();
            order.set('created_at', threeDaysAgo());

            assert.strictEqual(order.createdAgo, THREE_DAYS_DISTANCE);
            assert.ok(order.createdAt, 'and the absolute form is still produced');
        });

        test('an epoch-zero date is a real date, not a missing one', function (assert) {
            const order = this.order();
            order.set('created_at', new Date(0));

            assert.notStrictEqual(order.createdAt, null, 'the unix epoch formats rather than reading as absent');
        });
    });
});
