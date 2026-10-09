import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { initialize } from '@fleetbase/fleetops-data/instance-initializers/register-shared-resource-descriptors';
import { SHARED_RESOURCE_KEYS } from '@fleetbase/fleetops-data/utils/resource-descriptors';

/** A stand-in for ember-ui's resource-registry service that remembers what it holds. */
function fakeRegistry(existingKeys = []) {
    const held = new Map(existingKeys.map((key) => [key, { key, open: 'kept' }]));

    return {
        held,
        registerDescriptors(list) {
            list.forEach((descriptor) => held.set(descriptor.key, descriptor));
        },
        getDescriptor(key) {
            return held.get(key) ?? null;
        },
    };
}

function ownerWith(registry) {
    return { lookup: (name) => (name === 'service:resource-registry' ? registry : null) };
}

module('Unit | Instance Initializer | register-shared-resource-descriptors', function (hooks) {
    setupTest(hooks);

    test('it registers every shared descriptor on an empty registry', function (assert) {
        const registry = fakeRegistry();

        initialize(ownerWith(registry));

        assert.deepEqual([...registry.held.keys()], SHARED_RESOURCE_KEYS);
        assert.strictEqual(typeof registry.held.get('driver').open, 'function');
    });

    test('it leaves descriptors another package already registered alone', function (assert) {
        const registry = fakeRegistry(['driver', 'order']);

        initialize(ownerWith(registry));

        assert.strictEqual(registry.held.get('driver').open, 'kept', 'the FleetOps driver descriptor survives');
        assert.strictEqual(registry.held.get('order').open, 'kept', 'the FleetOps order descriptor survives');
        assert.strictEqual(registry.held.size, SHARED_RESOURCE_KEYS.length, 'the missing ones were filled in');
    });

    test('running twice registers nothing the second time', function (assert) {
        const registry = fakeRegistry();
        initialize(ownerWith(registry));
        const first = registry.held.get('vehicle');

        initialize(ownerWith(registry));

        assert.strictEqual(registry.held.get('vehicle'), first, 'the same descriptor object remains');
    });

    test('a registry that only lists its descriptors is read through that list', function (assert) {
        const held = [{ key: 'place' }];
        const registry = {
            descriptors: held,
            registerDescriptors(list) {
                held.push(...list);
            },
        };

        initialize(ownerWith(registry));

        assert.strictEqual(held.filter((descriptor) => descriptor.key === 'place').length, 1, 'place was kept');
        assert.strictEqual(held.length, SHARED_RESOURCE_KEYS.length);
    });

    test('a registry whose lookup throws is treated as empty', function (assert) {
        const registered = [];
        const registry = {
            registerDescriptors(list) {
                registered.push(...list);
            },
            getDescriptor() {
                throw new Error('index not built');
            },
        };

        initialize(ownerWith(registry));

        assert.strictEqual(registered.length, SHARED_RESOURCE_KEYS.length);
    });

    test('it does nothing on a host without the registry service', function (assert) {
        initialize({ lookup: () => null });
        initialize({
            lookup() {
                throw new Error('no such service');
            },
        });

        assert.ok(true, 'nothing thrown');
    });
});
