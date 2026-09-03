import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { isBlank } from '@ember/utils';

export default class EquipmentSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    get attrs() {
        return {
            warranty: { embedded: 'always' },
            photo: { embedded: 'always' },
            equipable: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    normalize(model, hash, prop) {
        const equipableDomainType = hash?.equipable?.type;

        if (hash?.equipable) {
            hash.equipable.type = this.equipableModelNameFromType(hash.equipable_type);
        }

        const normalized = super.normalize(model, hash, prop);

        if (equipableDomainType && !this.equipableModelNameFromType(equipableDomainType)) {
            const equipable = normalized?.data?.relationships?.equipable?.data;
            const included = normalized?.included?.find((resource) => resource.type === equipable?.type && resource.id === equipable?.id);

            if (included) {
                included.attributes = included.attributes ?? {};
                included.attributes.type = equipableDomainType;
            }
        }

        return normalized;
    }

    serializePolymorphicType(snapshot, json, relationship) {
        let key = relationship.key;

        if (key !== 'equipable') {
            return typeof super.serializePolymorphicType === 'function' ? super.serializePolymorphicType(...arguments) : undefined;
        }

        const belongsTo = snapshot.belongsTo(key);

        if (!isBlank(snapshot.attr(`${key}_type`))) {
            return;
        }

        key = this.keyForAttribute ? this.keyForAttribute(key, 'serialize') : key;
        json[`${key}_type`] = belongsTo ? `fleet-ops:${belongsTo.modelName.replace(/^attachable-/, '')}` : null;
    }

    equipableModelNameFromType(type) {
        if (!type || typeof type !== 'string') {
            return undefined;
        }

        const normalized = type
            .split('\\')
            .pop()
            .replace(/^fleet-ops:/, '')
            .replace(/^attachable-/, '')
            .toLowerCase();
        return ['vehicle', 'trailer', 'driver', 'asset'].includes(normalized) ? `attachable-${normalized}` : undefined;
    }
}
