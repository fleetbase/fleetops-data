import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class TrailerSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    get attrs() {
        return {
            vendor: { embedded: 'always' },
            warranty: { embedded: 'always' },
            photo: { embedded: 'always' },
            current_vehicle: { embedded: 'always', serialize: false },
            current_connection: { embedded: 'always', serialize: false },
            connections: { embedded: 'always', serialize: false },
            devices: { embedded: 'always', serialize: false },
            equipments: { embedded: 'always', serialize: false },
            custom_field_values: { embedded: 'always' },
        };
    }
}
