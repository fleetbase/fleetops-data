import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { isBlank } from '@ember/utils';

export default class EquipmentSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            warranty: { embedded: 'always' },
            photo: { embedded: 'always' },
            equipable: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    normalize(model, hash, prop) {
        let equipableDomainType;

        if (hash?.equipable) {
            equipableDomainType = hash.equipable.type;
            hash.equipable.type = this.equipableModelNameFromType(hash.equipable_type);
        }

        const normalized = super.normalize(model, hash, prop);

        if (this.shouldRestoreEquipableDomainType(equipableDomainType)) {
            this.restoreEquipableDomainType(normalized, equipableDomainType);
        }

        return normalized;
    }

    serializePolymorphicType(snapshot, json, relationship) {
        let key = relationship.key;

        if (key !== 'equipable') {
            return super.serializePolymorphicType(...arguments);
        }

        const belongsTo = snapshot.belongsTo(key);

        if (!isBlank(snapshot.attr(`${key}_type`))) {
            return;
        }

        key = this.keyForAttribute ? this.keyForAttribute(key, 'serialize') : key;

        if (!belongsTo) {
            json[`${key}_type`] = null;
            return;
        }

        let type = belongsTo.modelName;

        if (typeof type === 'string') {
            type = type.replace(/^attachable-/, '');
        }

        json[`${key}_type`] = `fleet-ops:${type}`;
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

    shouldRestoreEquipableDomainType(type) {
        if (!type || typeof type !== 'string') {
            return false;
        }

        return !this.equipableModelNameFromType(type);
    }

    restoreEquipableDomainType(normalized, type) {
        const equipable = normalized?.data?.relationships?.equipable?.data;

        if (!equipable) {
            return;
        }

        const included = normalized?.included?.find((resource) => resource.type === equipable.type && resource.id === equipable.id);

        if (included) {
            included.attributes = included.attributes ?? {};
            included.attributes.type = type;
        }
    }
}
