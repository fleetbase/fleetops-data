import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

/**
 * Maps the full PHP class names returned by the backend to the Ember Data
 * model names used by the polymorphic @belongsTo relationships.
 */
const MAINTENANCE_SUBJECT_TYPE_MAP = {
    'Fleetbase\\FleetOps\\Models\\Vehicle': 'maintenance-subject-vehicle',
    'Fleetbase\\FleetOps\\Models\\Equipment': 'maintenance-subject-equipment',
};

const FACILITATOR_TYPE_MAP = {
    'Fleetbase\\FleetOps\\Models\\Vendor': 'facilitator-vendor',
    'Fleetbase\\FleetOps\\Models\\Contact': 'facilitator-contact',
    'Fleetbase\\FleetOps\\Models\\IntegratedVendor': 'facilitator-integrated-vendor',
    'Fleetbase\\FleetOps\\Models\\Driver': 'facilitator-contact',
};

/**
 * Maps the Ember Data model name back to the shorthand type string the
 * backend expects on create / update.
 */
const MAINTAINABLE_EMBER_TO_SHORTHAND = {
    'maintenance-subject-vehicle': 'fleet-ops:vehicle',
    'maintenance-subject-equipment': 'fleet-ops:equipment',
};

const PERFORMED_BY_EMBER_TO_SHORTHAND = {
    'facilitator-vendor': 'fleet-ops:vendor',
    'facilitator-contact': 'fleet-ops:contact',
    'facilitator-integrated-vendor': 'fleet-ops:integrated-vendor',
};

export default class MaintenanceSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * maintainable, performed_by, work_order and custom_field_values are all
     * embedded in the server response via the Maintenance resource transformer.
     */
    get attrs() {
        return {
            maintainable: { embedded: 'always' },
            performed_by: { embedded: 'always' },
            work_order: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    /**
     * Normalise polymorphic type strings from the backend into Ember Data model names.
     */
    normalizePolymorphicType(resourceHash, relationship) {
        const key = relationship.key;
        const typeKey = `${key}_type`;
        const backendType = resourceHash[typeKey];

        if (backendType) {
            if (key === 'maintainable') {
                resourceHash[typeKey] = MAINTENANCE_SUBJECT_TYPE_MAP[backendType] ?? backendType;
            } else if (key === 'performed_by') {
                resourceHash[typeKey] = FACILITATOR_TYPE_MAP[backendType] ?? backendType;
            }
        }

        return super.normalizePolymorphicType ? super.normalizePolymorphicType(...arguments) : resourceHash[typeKey];
    }

    /**
     * Serialise the polymorphic type back to the shorthand string the backend
     * expects on create / update.
     */
    serializePolymorphicType(snapshot, json, relationship) {
        const key = relationship.key;
        const belongsTo = snapshot.belongsTo(key);

        if (!belongsTo) {
            json[`${key}_type`] = null;
            return;
        }

        const modelName = belongsTo.modelName;

        if (key === 'maintainable') {
            json[`${key}_type`] = MAINTAINABLE_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        } else if (key === 'performed_by') {
            json[`${key}_type`] = PERFORMED_BY_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        }
    }
}
