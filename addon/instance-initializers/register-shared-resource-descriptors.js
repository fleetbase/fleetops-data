import { buildSharedResourceDescriptors } from '../utils/resource-descriptors/shared';

/**
 * Registers the shared FleetOps resource descriptors with the resource
 * registry the UI package provides, so a driver, customer or place renders
 * as an identity cell, pill or summary in any extension without that
 * extension loading the FleetOps engine first.
 *
 * It runs for the host application and again for every engine that depends
 * on this package, so it only fills in descriptors nobody has registered:
 * FleetOps registers richer versions of the same keys when it boots, and
 * a later engine must not replace them. A host without the registry service
 * simply keeps plain text.
 */
export function initialize(owner) {
    let registry;

    try {
        registry = owner.lookup('service:resource-registry');
    } catch {
        registry = null;
    }

    if (!registry || typeof registry.registerDescriptors !== 'function') {
        return;
    }

    const missing = buildSharedResourceDescriptors(owner).filter((descriptor) => !isRegistered(registry, descriptor.key));

    if (missing.length) {
        registry.registerDescriptors(missing);
    }
}

function isRegistered(registry, key) {
    try {
        return Boolean(typeof registry.getDescriptor === 'function' ? registry.getDescriptor(key) : registry.descriptors?.some?.((descriptor) => descriptor.key === key));
    } catch {
        return false;
    }
}

export default {
    name: 'register-shared-resource-descriptors',
    initialize,
};
