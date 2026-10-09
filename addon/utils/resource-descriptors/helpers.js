import { get } from '@ember/object';
import { format } from 'date-fns';
import { getPlaceholderImage, resolveResourceImage } from '../placeholder-images';

/**
 * Small building blocks the shared resource descriptors use. They are
 * written against attribute names, so an identity stub or an API payload
 * renders the same as an Ember Data record, and they never import from the
 * UI package: whatever they need from it is looked up as a service.
 */

export const FLEETOPS_ENGINE = '@fleetbase/fleetops-engine';

export function present(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

/** The first present value at any of the paths. */
export function first(record, ...paths) {
    if (!record) {
        return null;
    }

    for (const path of paths) {
        const value = get(record, path);

        if (present(value)) {
            return value;
        }
    }

    return null;
}

/** A service from the owner, or null when the owner cannot provide it. */
export function lookupService(owner, name) {
    try {
        return owner?.lookup?.(`service:${name}`) ?? null;
    } catch {
        return null;
    }
}

/** A related record read through its reference, never a promise proxy. */
export function relation(owner, record, name) {
    const registry = lookupService(owner, 'resource-registry');

    if (registry && typeof registry.relationValue === 'function') {
        return registry.relationValue(record, name);
    }

    const value = record ? get(record, name) : null;

    if (value && typeof value === 'object' && typeof value.then === 'function') {
        return value.content ?? null;
    }

    return value ?? null;
}

/** A photo with the styled placeholder as fallback. */
export function photo(record, type, path = 'photo_url') {
    return { url: resolveResourceImage(get(record, path), type), fallback: getPlaceholderImage(type), shape: type === 'vehicle' || type === 'trailer' ? 'square' : 'round' };
}

export function icon(name, iconClass) {
    return iconClass ? { icon: name, iconClass } : { icon: name };
}

export function badge(key, iconName, label, extra = {}) {
    return present(label) ? { key, icon: iconName, label, ...extra } : null;
}

export function badges(...list) {
    return list.filter(Boolean);
}

export function fact(label, value, extra = {}) {
    return { labelKey: `resource-summary.facts.${label}`, value, ...extra };
}

/** A fact that renders as the related record's pill when the record is loaded. */
export function relatedFact(label, related, relatedType, fallbackValue) {
    return { labelKey: `resource-summary.facts.${label}`, related: related ?? null, relatedType, value: fallbackValue ?? null };
}

/**
 * A date the way the console writes one everywhere else (date-fns, not the
 * browser locale), or null for anything that is not a date.
 */
export function dateLabel(value, pattern = 'dd MMM yyyy, HH:mm') {
    if (!present(value)) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : format(date, pattern);
}

/**
 * A contact's type the way a person reads it: "customer-fleet-ops:contact"
 * and "customer" both become "Customer"; anything unreadable becomes null.
 */
export function typeLabel(value) {
    if (!present(value)) {
        return null;
    }

    const head = String(value)
        .split(':')[0]
        .replace(/-fleet-ops$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();

    return head ? head.charAt(0).toUpperCase() + head.slice(1) : null;
}

export function money(amount, currency) {
    if (!present(amount)) {
        return null;
    }

    return present(currency) ? `${amount} ${currency}` : String(amount);
}

export function join(parts, separator = ' ') {
    return parts.filter(present).join(separator) || null;
}

/** The resolved `*_type` for a polymorphic relation, from the record or a `_type` attribute. */
export function polymorphicType(record, relationName, typeAttr) {
    const related = record ? get(record, relationName) : null;
    const modelName = related?.constructor?.modelName ?? related?.content?.constructor?.modelName;

    return modelName ?? (typeAttr && record ? get(record, typeAttr) : null) ?? null;
}

/** The universe extension manager, through either of its service names. */
export function extensionManager(owner) {
    return lookupService(owner, 'universe/extension-manager') ?? lookupService(owner, 'universe')?.extensionManager ?? null;
}

/** Whether an engine is installed, so a resource it owns has somewhere to open. */
export function engineInstalled(owner, engineName = FLEETOPS_ENGINE) {
    const manager = extensionManager(owner);

    try {
        return Boolean(manager?.isInstalled?.(engineName));
    } catch {
        return false;
    }
}

/**
 * An opener that loads an engine on demand, then hands the record to one of
 * its action services: the context panel when it has one, else its route
 * transition. The engine bundle is only fetched when someone actually clicks,
 * never when a page that merely shows the resource renders.
 */
export function engineOpener(owner, serviceName, { engineName = FLEETOPS_ENGINE, mode = 'panel' } = {}) {
    return async (record) => {
        const manager = extensionManager(owner);

        if (!record || !manager || typeof manager.ensureEngineLoaded !== 'function') {
            return false;
        }

        let engine;

        try {
            engine = await manager.ensureEngineLoaded(engineName);
        } catch {
            return false;
        }

        const service = engine?.lookup?.(`service:${serviceName}`);

        if (!service) {
            return false;
        }

        const view = (mode === 'panel' ? (service.panel?.view ?? service.transition?.view) : null) ?? (mode === 'transition' ? service.transition?.view : null);

        if (typeof view !== 'function') {
            return false;
        }

        view.call(service, record);

        return true;
    };
}
