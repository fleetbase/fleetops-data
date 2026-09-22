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

    /**
     * The login account is resolved by the server from the contact's name,
     * email and phone, so the account reference is never sent back.
     *
     * @param {Snapshot} snapshot
     * @param {Object} options
     * @return {Object} json
     */
    serialize() {
        const json = super.serialize(...arguments);

        delete json.user;
        delete json.user_uuid;

        return json;
    }
}
