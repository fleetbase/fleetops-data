import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class DriverSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            user: { embedded: 'always' },
            fleets: { embedded: 'always' },
            vendor: { embedded: 'always' },
            vehicle: { embedded: 'always' },
            devices: { embedded: 'always' },
            current_job: { embedded: 'always' },
            jobs: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
            // The login account is managed by the server from name/email/phone
            user_uuid: { serialize: false },
            is_staff_linked: { serialize: false },
            login_status: { serialize: false },
        };
    }

    serializeBelongsTo(snapshot, json, relationship) {
        let key = relationship.key;

        if (key === 'fleets' || key === 'current_job' || key === 'user' || key === 'vendor') {
            return;
        }

        super.serializeBelongsTo(...arguments);
    }

    serializeHasMany(snapshot, json, relationship) {
        let key = relationship.key;

        if (key === 'jobs' || key === 'orders' || key == 'fleets') {
            return;
        }

        super.serializeHasMany(...arguments);
    }
}
