import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

/**
 * Type map for normalizing backend PolymorphicType strings to Ember Data model names.
 * The backend uses Laravel's PolymorphicType cast which produces strings like 'fleet-ops:vehicle'.
 */
const MAINTENANCE_SUBJECT_TYPE_MAP = {
    'fleet-ops:vehicle': 'maintenance-subject-vehicle',
    'fleet-ops:equipment': 'maintenance-subject-equipment',
};

const FACILITATOR_TYPE_MAP = {
    'fleet-ops:driver': 'facilitator-contact',
    'fleet-ops:contact': 'facilitator-contact',
    'fleet-ops:vendor': 'facilitator-vendor',
    'fleet-ops:integrated-vendor': 'facilitator-integrated-vendor',
};

export default class MaintenanceScheduleSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    get attrs() {
        return {
            subject: { embedded: 'always' },
            default_assignee: { embedded: 'always' },
        };
    }

    /**
     * Normalize polymorphic type strings from the backend into Ember Data model names.
     * Called during deserialization for each polymorphic relationship.
     */
    normalizePolymorphicType(resourceHash, relationship) {
        const key = relationship.key;
        const typeKey = `${key}_type`;
        const backendType = resourceHash[typeKey];

        if (backendType) {
            if (key === 'subject') {
                resourceHash[typeKey] = MAINTENANCE_SUBJECT_TYPE_MAP[backendType] || backendType;
            } else if (key === 'default_assignee') {
                resourceHash[typeKey] = FACILITATOR_TYPE_MAP[backendType] || backendType;
            }
        }

        return super.normalizePolymorphicType ? super.normalizePolymorphicType(...arguments) : resourceHash[typeKey];
    }

    /**
     * Serialize polymorphic type back to the backend format.
     * Converts Ember Data model names back to 'fleet-ops:*' strings.
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
            const reverseMap = Object.fromEntries(Object.entries(MAINTENANCE_SUBJECT_TYPE_MAP).map(([k, v]) => [v, k]));
            json[`${key}_type`] = reverseMap[modelName] || `fleet-ops:${modelName}`;
        } else if (key === 'default_assignee') {
            const reverseMap = Object.fromEntries(Object.entries(FACILITATOR_TYPE_MAP).map(([k, v]) => [v, k]));
            json[`${key}_type`] = reverseMap[modelName] || `fleet-ops:${modelName}`;
        }
    }
}
