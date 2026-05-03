import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { isBlank } from '@ember/utils';

export default class MaintenanceScheduleSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes.
     *
     * @var {Object}
     */
    get attrs() {
        return {
            subject: { embedded: 'always' },
            default_assignee: { embedded: 'always' },
        };
    }

    /**
     * Serialize the record and strip read-only server-computed attributes.
     *
     * @param {Snapshot} snapshot
     * @param {Object} options
     * @returns {Object}
     */
    serialize(snapshot, options) {
        const json = super.serialize(snapshot, options);
        const readOnly = ['subject_name', 'default_assignee_name'];
        readOnly.forEach((attr) => delete json[attr]);
        return json;
    }

    /**
     * Serialize the polymorphic type for subject and default_assignee relationships.
     *
     * The embedded record's modelName will be the concrete subtype (e.g. 'facilitator-vendor',
     * 'maintenance-subject-vehicle'). We strip the abstract prefix before sending to the server
     * so that getMutationType resolves the correct PHP class (e.g. Vendor, Vehicle).
     *
     * @param {Snapshot} snapshot
     * @param {Object} json
     * @param {Object} relationship
     */
    serializePolymorphicType(snapshot, json, relationship) {
        let key = relationship.key;
        let belongsTo = snapshot.belongsTo(key);

        const isPolymorphicTypeBlank = isBlank(snapshot.attr(key + '_type'));
        if (isPolymorphicTypeBlank) {
            key = this.keyForAttribute ? this.keyForAttribute(key, 'serialize') : key;
            if (!belongsTo) {
                json[key + '_type'] = null;
            } else {
                let type = belongsTo.modelName;
                // Strip abstract subtype prefixes so the server receives the bare model type
                // e.g. 'facilitator-vendor' -> 'vendor', 'maintenance-subject-vehicle' -> 'vehicle'
                if (typeof type === 'string') {
                    type = type
                        .replace(/^facilitator-/, '')
                        .replace(/^maintenance-subject-/, '')
                        .replace(/^customer-/, '');
                }
                json[key + '_type'] = `fleet-ops:${type}`;
            }
        }
    }
}
