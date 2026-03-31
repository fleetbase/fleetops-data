import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

/**
 * Strips a package prefix from a raw API type discriminator and returns the
 * bare Ember Data model name.
 *
 * The backend stores STI discriminator values such as `fliit_contact`,
 * `fliit_vendor`, `fliit_client`, etc.  Ember Data's model registry only
 * knows the bare name (`contact`, `vendor`, …).  This helper converts the
 * raw value while preserving the original under `subtype` so application
 * code that depends on the discriminator (e.g. role/routing logic) is
 * unaffected.
 *
 * Examples:
 *   fliit_contact  → contact
 *   fliit_vendor   → vendor
 *   fliit_client   → client
 *   contact        → contact   (already bare — returned as-is)
 *
 * @param {string} rawType
 * @returns {string}
 */
function toEmberModelType(rawType) {
    if (typeof rawType !== 'string' || !rawType) {
        return rawType;
    }

    // Already a bare name with no known package prefix
    if (!rawType.includes('_')) {
        return rawType;
    }

    // Known package prefixes used by Fleetbase extensions
    const knownPrefixes = ['fliit_', 'fleet_ops_', 'fleetops_'];
    for (const prefix of knownPrefixes) {
        if (rawType.startsWith(prefix)) {
            return rawType.slice(prefix.length);
        }
    }

    return rawType;
}

export default class VendorSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes.
     *
     * `personnels` is embedded so that each contact hash is processed through
     * the ContactSerializer (and this serializer's normalize hook) rather than
     * being treated as a bare id array by Ember Data.
     *
     * @var {Object}
     */
    get attrs() {
        return {
            place: { embedded: 'always' },
            personnels: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    /**
     * Normalizes a single resource hash returned by the API.
     *
     * Walks the `personnels` array and rewrites each record's `type` field
     * from the raw backend discriminator (e.g. `fliit_contact`) to the bare
     * Ember Data model name (`contact`).  The original discriminator value is
     * preserved under `subtype` so downstream code that depends on it
     * (role checks, conditional rendering, etc.) continues to work.
     *
     * @param {DS.Model} modelClass
     * @param {Object}   resourceHash
     * @param {string}   prop
     * @returns {Object}
     */
    normalize(modelClass, resourceHash, prop) {
        if (Array.isArray(resourceHash.personnels)) {
            resourceHash.personnels = resourceHash.personnels.map((personnel) => {
                if (personnel && typeof personnel === 'object' && personnel.type) {
                    const emberType = toEmberModelType(personnel.type);
                    if (emberType !== personnel.type) {
                        // Preserve the original discriminator so app logic can still use it
                        personnel.subtype = personnel.type;
                        personnel.type = emberType;
                    }
                }
                return personnel;
            });
        }

        return super.normalize(modelClass, resourceHash, prop);
    }
}
