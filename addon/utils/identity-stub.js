import { get } from '@ember/object';

const inflight = new WeakMap();

/**
 * A stand-in for a related record a row only knows by name: enough for an
 * identity cell, pill or summary to render (`name`, `resourceType`) and a
 * `loadResource()` they call when the real record is needed. The stub never
 * carries a UUID in an identifier field, so nothing renders one as a plate
 * or an id, and concurrent loads of the same row share one request.
 *
 * `load` receives the row and returns the record (or a promise of it); with
 * no `load`, `loadResource()` resolves to null and the stub stays static.
 */
export function buildIdentityStub(row, { type, nameKey = `${type}_name`, name, load, extra = {} } = {}) {
    const label = name ?? (row ? get(row, nameKey) : null);

    if (!label) {
        return null;
    }

    return {
        ...extra,
        name: label,
        display_name: label,
        displayName: label,
        resourceType: type,
        isIdentityStub: true,
        loadResource: async () => {
            if (typeof load !== 'function') {
                return null;
            }

            let loads = inflight.get(row);

            if (!loads) {
                loads = new Map();
                inflight.set(row, loads);
            }

            if (!loads.has(type)) {
                loads.set(
                    type,
                    Promise.resolve()
                        .then(() => load(row))
                        .catch(() => null)
                        .finally(() => loads.delete(type))
                );
            }

            return loads.get(type);
        },
    };
}

export default buildIdentityStub;
