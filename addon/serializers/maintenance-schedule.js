import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

/**
 * Maps the full PHP class names returned by the backend to the Ember Data
 * model names used by the polymorphic @belongsTo relationships.
 *
 * The backend serialises subject_type / default_assignee_type as the full
 * Laravel model class name (e.g. "Fleetbase\\FleetOps\\Models\\Vehicle").
 * Ember Data needs the dasherised model name (e.g. "maintenance-subject-vehicle").
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
 * Maps the Ember Data model name back to the shorthand type string that the
 * backend accepts on create/update.  The server converts "fleet-ops:vehicle"
 * to the correct PHP namespace internally.
 */
const SUBJECT_EMBER_TO_SHORTHAND = {
    'maintenance-subject-vehicle': 'fleet-ops:vehicle',
    'maintenance-subject-equipment': 'fleet-ops:equipment',
};

const FACILITATOR_EMBER_TO_SHORTHAND = {
    'facilitator-vendor': 'fleet-ops:vendor',
    'facilitator-contact': 'fleet-ops:contact',
    'facilitator-integrated-vendor': 'fleet-ops:integrated-vendor',
};

export default class MaintenanceScheduleSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * The subject and default_assignee relationships are always embedded in the
     * server response via the MaintenanceSchedule resource transformer.
     */
    get attrs() {
        return {
            subject: { embedded: 'always' },
            default_assignee: { embedded: 'always' },
        };
    }

    /**
     * Normalise polymorphic type strings from the backend into Ember Data model
     * names.  Called during deserialisation for each polymorphic relationship.
     *
     * The backend injects a `type` field of 'maintenance-subject' or 'facilitator'
     * into the embedded object, and the parent record carries the shorthand type
     * (e.g. 'fleet-ops:vehicle') in subject_type / default_assignee_type.
     */
    normalizePolymorphicType(resourceHash, relationship) {
        const key = relationship.key;
        const typeKey = `${key}_type`;
        const backendType = resourceHash[typeKey];

        if (backendType) {
            if (key === 'subject') {
                resourceHash[typeKey] = MAINTENANCE_SUBJECT_TYPE_MAP[backendType] ?? backendType;
            } else if (key === 'default_assignee') {
                resourceHash[typeKey] = FACILITATOR_TYPE_MAP[backendType] ?? backendType;
            }
        }

        return super.normalizePolymorphicType ? super.normalizePolymorphicType(...arguments) : resourceHash[typeKey];
    }

    /**
     * Serialise the polymorphic type back to the shorthand string the backend
     * expects on create / update (e.g. "fleet-ops:vehicle").
     */
    serializePolymorphicType(snapshot, json, relationship) {
        const key = relationship.key;
        const belongsTo = snapshot.belongsTo(key);

        if (!belongsTo) {
            json[`${key}_type`] = null;
            return;
        }

        const modelName = belongsTo.modelName;

        if (key === 'subject') {
            json[`${key}_type`] = SUBJECT_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        } else if (key === 'default_assignee') {
            json[`${key}_type`] = FACILITATOR_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        }
    }
}
