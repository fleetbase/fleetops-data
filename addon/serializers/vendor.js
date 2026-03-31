import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class VendorSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes.
     *
     * `personnels` must be declared as embedded so that the EmbeddedRecordsMixin
     * resolves each record using the declared `@hasMany('contact')` model type
     * rather than attempting to look up the model by the raw `type` field on
     * each payload object (which carries a backend STI discriminator such as
     * `fliit_contact` that does not exist in the Ember Data model registry).
     *
     * @var {Object}
     */
    get attrs() {
        return {
            place: { embedded: 'always' },
            personnels: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }
}
