import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { isBlank } from '@ember/utils';

export default class DeviceSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            telematic: { embedded: 'always' },
            warranty: { embedded: 'always' },
            attachable: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }

    normalize(model, hash, prop) {
        let attachableDomainType;

        if (hash?.attachable) {
            attachableDomainType = hash.attachable.type;
            hash.attachable.type = this.attachableModelNameFromType(hash.attachable_type);
        }

        const normalized = super.normalize(model, hash, prop);

        if (this.shouldRestoreAttachableDomainType(attachableDomainType)) {
            this.restoreAttachableDomainType(normalized, attachableDomainType);
        }

        return normalized;
    }

    serializePolymorphicType(snapshot, json, relationship) {
        let key = relationship.key;

        if (key !== 'attachable') {
            if (typeof super.serializePolymorphicType === 'function') {
                return super.serializePolymorphicType(...arguments);
            }
            return;
        }

        const belongsTo = snapshot.belongsTo(key);
        const isPolymorphicTypeBlank = isBlank(snapshot.attr(`${key}_type`));

        if (!isPolymorphicTypeBlank) {
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

    attachableModelNameFromType(type) {
        if (!type || typeof type !== 'string') {
            return undefined;
        }

        if (type.includes('\\')) {
            type = type.split('\\').pop();
        }

        type = type
            .replace(/^fleet-ops:/, '')
            .replace(/^attachable-/, '')
            .toLowerCase();

        if (!['vehicle', 'asset'].includes(type)) {
            return undefined;
        }

        return `attachable-${type}`;
    }

    shouldRestoreAttachableDomainType(type) {
        if (!type || typeof type !== 'string') {
            return false;
        }

        return !this.attachableModelNameFromType(type);
    }

    restoreAttachableDomainType(normalized, type) {
        const attachable = normalized?.data?.relationships?.attachable?.data;

        if (!attachable) {
            return;
        }

        const included = normalized?.included?.find((resource) => resource.type === attachable.type && resource.id === attachable.id);

        if (included) {
            included.attributes = included.attributes ?? {};
            included.attributes.type = type;
        }
    }
}
