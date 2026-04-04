import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { isBlank } from '@ember/utils';

export default class MaintenanceScheduleSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    get attrs() {
        return {
            subject: { embedded: 'always' },
            default_assignee: { embedded: 'always' },
        };
    }

    normalizePolymorphicType(resourceHash, relationship) {
        const key = relationship.key;
        const typeKey = `${key}_type`;

        if (key === 'subject' && resourceHash['subject_type']) {
            resourceHash[typeKey] = resourceHash['subject_type'];
        } else if (key === 'default_assignee' && resourceHash['facilitator_type']) {
            resourceHash[typeKey] = resourceHash['facilitator_type'];
        }

        return super.normalizePolymorphicType ? super.normalizePolymorphicType(...arguments) : resourceHash[typeKey];
    }

    serializePolymorphicType(snapshot, json, relationship) {
        const key = relationship.key;
        const belongsTo = snapshot.belongsTo(key);

        if (!belongsTo) {
            json[`${key}_type`] = null;
            return;
        }

        const type = belongsTo.modelName;
        const isPolymorphicTypeBlank = isBlank(snapshot.attr(`${key}_type`));

        if (isPolymorphicTypeBlank) {
            const serializedKey = this.keyForAttribute ? this.keyForAttribute(key, 'serialize') : key;
            if (!isBlank(belongsTo.attr(`${serializedKey}_type`))) {
                json[`${key}_type`] = belongsTo.attr(`${serializedKey}_type`);
            } else {
                json[`${key}_type`] = `fleet-ops:${type}`;
            }
        }
    }
}
