import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { buildSharedResourceDescriptors, SHARED_RESOURCE_KEYS, guardOrder } from '@fleetbase/fleetops-data/utils/resource-descriptors';

const UUID = '0b2d9a6e-5e6b-4d6c-9a1f-3c8e1f2a4b5d';

/** Every descriptor field that takes a record, called with the given record. */
function readAll(descriptor, record) {
    const values = {};

    for (const field of ['title', 'identifier', 'image', 'online', 'status', 'badges', 'selectDetails', 'facts']) {
        if (typeof descriptor[field] === 'function') {
            values[field] = descriptor[field](record);
        }
    }

    return values;
}

function byKey(owner) {
    return Object.fromEntries(buildSharedResourceDescriptors(owner).map((descriptor) => [descriptor.key, descriptor]));
}

function factValue(facts, label) {
    return facts.find((fact) => fact.labelKey === `resource-summary.facts.${label}`);
}

module('Unit | Utility | resource-descriptors/shared', function (hooks) {
    setupTest(hooks);

    test('there is one descriptor per shared resource, each naming its identity cell wrapper', function (assert) {
        const descriptors = buildSharedResourceDescriptors(this.owner);

        assert.deepEqual(
            descriptors.map((descriptor) => descriptor.key),
            SHARED_RESOURCE_KEYS,
            'driver, vehicle, customer, contact, place, order, vendor and fleet'
        );

        for (const descriptor of descriptors) {
            assert.strictEqual(descriptor.components.identity, `cell/${descriptor.key}-identity`, `${descriptor.key} identity cell`);
            assert.ok(descriptor.modelNames.includes(descriptor.key), `${descriptor.key} names its model`);
            assert.ok(
                descriptor.polymorphicTypes.some((type) => type.startsWith('fleet-ops:')),
                `${descriptor.key} names its fleet-ops type`
            );
            assert.strictEqual(typeof descriptor.open, 'function', `${descriptor.key} can be opened`);
            assert.strictEqual(typeof descriptor.canOpen, 'function', `${descriptor.key} guards opening on the engine`);
        }
    });

    test('every field tolerates an empty record and a sparse one', function (assert) {
        for (const descriptor of buildSharedResourceDescriptors(this.owner)) {
            for (const record of [{}, { public_id: `${descriptor.key}_1` }]) {
                let values;

                try {
                    values = readAll(descriptor, record);
                } catch (error) {
                    assert.ok(false, `${descriptor.key} threw on ${JSON.stringify(record)}: ${error.message}`);
                    continue;
                }

                assert.ok(Array.isArray(values.facts), `${descriptor.key} facts are a list`);
                assert.ok(Array.isArray(values.selectDetails), `${descriptor.key} select details are a list`);
                assert.ok(values.image && typeof values.image === 'object', `${descriptor.key} image is an object`);
            }
        }
    });

    test('identifiers never surface a UUID', function (assert) {
        for (const descriptor of buildSharedResourceDescriptors(this.owner)) {
            const record = { id: UUID, uuid: UUID, public_id: 'thing_1', name: 'Named', plate_number: null, driver_uuid: UUID, vehicle_uuid: UUID };
            const identifier = descriptor.identifier?.(record);

            assert.notStrictEqual(identifier, UUID, `${descriptor.key} identifier is not the uuid`);
        }
    });

    test('a driver renders its name, phone, photo placeholder and online dot, and its vehicle as a badge', function (assert) {
        const { driver } = byKey(this.owner);
        const record = {
            name: 'Ada Driver',
            phone: '+15551234567',
            online: true,
            status: 'available',
            vehicle_name: 'Truck 10',
            vehicle_uuid: 'vehicle_1',
            drivers_license_number: 'DL-1',
            license_expiry: '2027-03-04T00:00:00',
        };
        const values = readAll(driver, record);

        assert.strictEqual(values.title, 'Ada Driver');
        assert.strictEqual(values.identifier, '+15551234567');
        assert.true(values.online);
        assert.strictEqual(values.status, 'available');
        assert.ok(values.image.url.startsWith('data:image/svg+xml'), 'no photo means the styled placeholder');
        assert.strictEqual(values.image.shape, 'round');
        assert.deepEqual(
            values.badges.map((badge) => [badge.key, badge.label, badge.relatedId]),
            [['vehicle', 'Truck 10', 'vehicle_1']]
        );
        assert.strictEqual(factValue(values.facts, 'licence').value, 'DL-1 · expires 04 Mar 2027');
        assert.strictEqual(factValue(values.facts, 'vehicle').value, 'Truck 10');
        assert.strictEqual(driver.online({ online: 'yes' }), undefined, 'a non-boolean online flag is no dot');
    });

    test('a driver with a loaded vehicle names it from the relation', function (assert) {
        const { driver } = byKey(this.owner);
        const vehicle = { id: 'vehicle_2', displayName: 'Van 2' };
        const values = readAll(driver, { name: 'Ada', vehicle });

        assert.deepEqual(
            values.badges.map((badge) => [badge.key, badge.label, badge.relatedId]),
            [['vehicle', 'Van 2', 'vehicle_2']]
        );
        assert.strictEqual(factValue(values.facts, 'vehicle').related, vehicle);
        assert.strictEqual(factValue(values.facts, 'licence').value, null, 'no licence, no label');
    });

    test('a vehicle is square, titles itself from year make model when it has no name, and lists its driver and trailers', function (assert) {
        const { vehicle } = byKey(this.owner);

        assert.strictEqual(vehicle.image({ photo_url: 'https://cdn.test/truck.png' }).shape, 'square');
        assert.strictEqual(vehicle.image({ photo_url: 'https://cdn.test/truck.png' }).url, 'https://cdn.test/truck.png');
        assert.strictEqual(vehicle.title({ year: 2020, make: 'Ford', model: 'Transit' }), '2020 Ford Transit');
        assert.strictEqual(vehicle.title({ displayName: 'Truck 1', year: 2020 }), 'Truck 1');

        const driver = { id: 'driver_1', name: 'Ada' };
        const loaded = readAll(vehicle, { plate_number: 'ABC-1', driver, trailers: [{ displayName: 'Box 1' }, { displayName: 'Box 2' }], odometer: 1200, odometer_unit: 'km' });
        assert.deepEqual(
            loaded.badges.map((badge) => [badge.key, badge.label]),
            [
                ['plate', 'ABC-1'],
                ['driver', 'Ada'],
            ]
        );
        assert.strictEqual(factValue(loaded.facts, 'trailer').value, 'Box 1');
        assert.strictEqual(factValue(loaded.facts, 'trailer').suffix, ' (+1)');
        assert.strictEqual(factValue(loaded.facts, 'odometer').value, '1200 km');

        const emberArray = readAll(vehicle, { trailers: { length: 1, objectAt: (index) => (index === 0 ? { displayName: 'Box 1' } : null) } });
        assert.strictEqual(factValue(emberArray.facts, 'trailer').value, 'Box 1', 'a many-array is read through objectAt');
        assert.strictEqual(factValue(emberArray.facts, 'trailer').suffix, '');

        const arrayLike = readAll(vehicle, { trailers: { 0: { displayName: 'Box 1' }, length: 1 } });
        assert.strictEqual(factValue(arrayLike.facts, 'trailer').value, 'Box 1', 'a plain list is read by index');

        const bare = readAll(vehicle, { driver_name: 'Bob', driver_uuid: 'driver_9' });
        assert.deepEqual(
            bare.badges.map((badge) => [badge.key, badge.label, badge.relatedId]),
            [['driver', 'Bob', 'driver_9']]
        );
        assert.strictEqual(factValue(bare.facts, 'trailer').value, null);
        assert.strictEqual(factValue(bare.facts, 'odometer').value, null);
    });

    test('a place is an icon with its city and country, and a coordinate fact', function (assert) {
        const { place } = byKey(this.owner);

        assert.deepEqual(place.image({}), { icon: 'location-dot' });
        assert.strictEqual(place.identifier({ city: 'Singapore', country: 'SG' }), 'Singapore, SG');
        assert.strictEqual(place.identifier({ public_id: 'place_1' }), 'place_1');
        assert.strictEqual(factValue(place.facts({ positionString: '1.3, 103.8' }), 'coordinates').value, '1.3, 103.8');
        assert.strictEqual(factValue(place.facts({ latitude: 1.3, longitude: 103.8 }), 'coordinates').value, '1.3, 103.8');
        assert.strictEqual(factValue(place.facts({}), 'coordinates').value, null);
    });

    test('an order reads its tracking number and names its customer by its polymorphic type', function (assert) {
        const { order } = byKey(this.owner);

        assert.strictEqual(order.title({ tracking: 'TRK-1', public_id: 'order_1' }), 'TRK-1');
        assert.strictEqual(order.identifier({ public_id: 'order_1' }), 'order_1');
        const facts = order.facts({ customer_type: 'contact', customer_name: 'Ada', pickupName: 'A', dropoffName: 'B' });
        assert.strictEqual(factValue(facts, 'customer').relatedType, 'contact');
        assert.strictEqual(factValue(facts, 'customer').value, 'Ada');
        assert.strictEqual(factValue(facts, 'route').value, 'A → B');
    });

    test('customers, contacts, vendors and fleets read their identifiers', function (assert) {
        const { customer, contact, vendor, fleet } = byKey(this.owner);

        assert.strictEqual(customer.identifier({ customer_type: 'customer-fleet-ops:contact' }), 'Customer');
        assert.strictEqual(customer.identifier({}), 'Customer');
        assert.strictEqual(contact.identifier({ title: 'Manager', type: 'facilitator' }), 'Manager');
        assert.strictEqual(contact.identifier({ type: 'facilitator' }), 'Facilitator');
        assert.strictEqual(vendor.image({ logo_url: 'https://cdn.test/logo.png' }).url, 'https://cdn.test/logo.png');
        assert.deepEqual(fleet.selectDetails({ task: 'Deliveries', drivers_count: 3 }), ['Deliveries', '3 drivers']);
        assert.deepEqual(fleet.selectDetails({}), [null, null]);
        const facts = fleet.facts({ drivers_count: 3, vehicles_count: 2, vehicles_online_count: 1 });
        assert.strictEqual(factValue(facts, 'drivers').value, '0 online of 3');
        assert.strictEqual(factValue(facts, 'vehicles').value, '1 online of 2');
        assert.strictEqual(factValue(fleet.facts({ vehicles_count: 2 }), 'vehicles').value, '0 online of 2');
    });

    module('opening through the FleetOps engine', function () {
        function fakeManager(overrides = {}) {
            const service = {
                panel: {
                    view(record) {
                        service.viewed = record;
                    },
                },
            };
            const engine = { lookup: (name) => (name === 'service:driver-actions' ? service : null) };
            const manager = {
                installed: true,
                loads: 0,
                isInstalled() {
                    return this.installed;
                },
                async ensureEngineLoaded(name) {
                    this.loads++;
                    this.loadedName = name;
                    return engine;
                },
                ...overrides,
            };

            return { manager, service };
        }

        test('canOpen is true only when the FleetOps extension is installed', function (assert) {
            const { manager } = fakeManager();
            this.owner.register('service:universe/extension-manager', manager, { instantiate: false });
            const [driver] = buildSharedResourceDescriptors(this.owner);

            assert.true(driver.canOpen({}));

            manager.installed = false;
            assert.false(driver.canOpen({}));
        });

        test('canOpen is false on a host without the extension manager', function (assert) {
            const [driver] = buildSharedResourceDescriptors(this.owner);

            assert.false(driver.canOpen({}));
        });

        test('open loads the engine on demand, then hands the record to its action service panel', async function (assert) {
            const { manager, service } = fakeManager();
            this.owner.register('service:universe/extension-manager', manager, { instantiate: false });
            const [driver] = buildSharedResourceDescriptors(this.owner);
            const record = { id: 'driver_1', name: 'Ada' };

            assert.true(await driver.open(record));
            assert.strictEqual(manager.loads, 1, 'the engine was loaded');
            assert.strictEqual(manager.loadedName, '@fleetbase/fleetops-engine');
            assert.strictEqual(service.viewed, record, 'the panel shows the record');
        });

        test('an order stub or an unsaved order never opens', async function (assert) {
            let opened = 0;
            const open = guardOrder(() => {
                opened++;
                return true;
            });

            assert.false(open(null));
            assert.false(open({ isIdentityStub: true, name: 'ORD-1' }));
            assert.false(open({ public_id: 'order_1' }));
            assert.true(open({ id: 'order_1' }));
            assert.strictEqual(opened, 1);

            const { order } = byKey(this.owner);
            assert.false(await order.open({ isIdentityStub: true }), 'the shared order descriptor is guarded');
        });
    });
});
