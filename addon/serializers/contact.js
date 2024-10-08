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
            user: { embedded: 'always' },
            place: { embedded: 'always' },
            places: { embedded: 'always' },
            photo: { embedded: 'always' },
        };
    }
}
