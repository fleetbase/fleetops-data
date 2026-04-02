import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

/**
 * Maps every type string the backend may send for the target relationship to
 * the Ember Data model name for the concrete maintenance-subject subtype.
 *
 * The fixed resource now injects `subject_type` using the bare class basename slug
 * (e.g. 'maintenance-subject-vehicle').  We also keep short-form and full-class-name
 * keys for backwards compatibility.
 */
const MAINTENANCE_SUBJECT_TYPE_MAP = {
    // Canonical form injected by the fixed resource (bare slug)
    'maintenance-subject-vehicle':   'maintenance-subject-vehicle',
    'maintenance-subject-equipment': 'maintenance-subject-equipment',
    // Short-form keys emitted by toEmberResourceType() on target_type field
    'fleet-ops:vehicle':   'maintenance-subject-vehicle',
    'fleet-ops:equipment': 'maintenance-subject-equipment',
    // Bare model names (e.g. when target is a raw vehicle record)
    vehicle:   'maintenance-subject-vehicle',
    equipment: 'maintenance-subject-equipment',
    // Full PHP class names (legacy / backwards-compat)
    'Fleetbase\\FleetOps\\Models\\Vehicle':   'maintenance-subject-vehicle',
    'Fleetbase\\FleetOps\\Models\\Equipment': 'maintenance-subject-equipment',
};

/**
 * Maps every type string the backend may send for the assignee relationship to
 * the Ember Data model name for the concrete facilitator subtype.
 *
 * The fixed resource now injects `facilitator_type` using the bare class basename slug
 * (e.g. 'facilitator-vendor').  We also keep short-form and full-class-name keys.
 */
const FACILITATOR_TYPE_MAP = {
    // Canonical form injected by the fixed resource (bare slug)
    'facilitator-vendor':            'facilitator-vendor',
    'facilitator-contact':           'facilitator-contact',
    'facilitator-integrated-vendor': 'facilitator-integrated-vendor',
    // Short-form keys emitted by toEmberResourceType() on assignee_type field
    'fleet-ops:vendor':            'facilitator-vendor',
    'fleet-ops:contact':           'facilitator-contact',
    'fleet-ops:integrated-vendor': 'facilitator-integrated-vendor',
    'fleet-ops:driver':            'facilitator-contact',
    // Bare model names
    vendor:   'facilitator-vendor',
    contact:  'facilitator-contact',
    driver:   'facilitator-contact',
    // Full PHP class names (legacy / backwards-compat)
    'Fleetbase\\FleetOps\\Models\\Vendor':           'facilitator-vendor',
    'Fleetbase\\FleetOps\\Models\\Contact':          'facilitator-contact',
    'Fleetbase\\FleetOps\\Models\\IntegratedVendor': 'facilitator-integrated-vendor',
    'Fleetbase\\FleetOps\\Models\\Driver':           'facilitator-contact',
};

/**
 * Maps the Ember Data model name back to the shorthand type string the
 * backend expects on create / update (written into target_type / assignee_type
 * via the PolymorphicType cast which calls getMutationType()).
 */
const TARGET_EMBER_TO_SHORTHAND = {
    'maintenance-subject-vehicle':   'fleet-ops:vehicle',
    'maintenance-subject-equipment': 'fleet-ops:equipment',
    // Raw model names (e.g. when target is set directly from vehicle-actions)
    vehicle:   'fleet-ops:vehicle',
    equipment: 'fleet-ops:equipment',
};

const ASSIGNEE_EMBER_TO_SHORTHAND = {
    'facilitator-vendor':            'fleet-ops:vendor',
    'facilitator-contact':           'fleet-ops:contact',
    'facilitator-integrated-vendor': 'fleet-ops:integrated-vendor',
    // Raw model names (e.g. when assignee is set directly from a ModelSelect)
    vendor:   'fleet-ops:vendor',
    contact:  'fleet-ops:contact',
    driver:   'fleet-ops:contact',
    user:     'Auth:User',
};

export default class WorkOrderSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * The target and assignee relationships are always embedded in the server
     * response via the WorkOrder resource transformer.
     */
    get attrs() {
        return {
            target: { embedded: 'always' },
            assignee: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    /**
     * Normalise polymorphic type strings from the backend into Ember Data model names.
     *
     * For `target`: the resource injects `subject_type` (e.g. 'maintenance-subject-vehicle')
     * into the embedded object.  We read that first; if missing we fall back to `target_type`.
     *
     * For `assignee`: the resource injects `facilitator_type` (e.g. 'facilitator-vendor')
     * into the embedded object.  We read that first; if missing we fall back to `assignee_type`.
     */
    normalizePolymorphicType(resourceHash, relationship) {
        const key = relationship.key;
        const typeKey = `${key}_type`;

        if (key === 'target') {
            // Prefer the injected subject_type over the raw target_type field
            const subjectType = resourceHash['subject_type'] ?? resourceHash[typeKey];
            if (subjectType) {
                resourceHash[typeKey] = MAINTENANCE_SUBJECT_TYPE_MAP[subjectType] ?? subjectType;
            }
        } else if (key === 'assignee') {
            // Prefer the injected facilitator_type over the raw assignee_type field
            const facilitatorType = resourceHash['facilitator_type'] ?? resourceHash[typeKey];
            if (facilitatorType) {
                resourceHash[typeKey] = FACILITATOR_TYPE_MAP[facilitatorType] ?? facilitatorType;
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

        if (key === 'target') {
            json[`${key}_type`] = TARGET_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        } else if (key === 'assignee') {
            json[`${key}_type`] = ASSIGNEE_EMBER_TO_SHORTHAND[modelName] ?? `fleet-ops:${modelName}`;
        }
    }
}
