import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class ContactSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            // The login account is managed by the server from name/email/phone
            user: { embedded: 'always', serialize: false },
            user_uuid: { serialize: false },
            is_staff_linked: { serialize: false },
            login_status: { serialize: false },
            place: { embedded: 'always' },
            places: { embedded: 'always' },
            photo: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }
}
