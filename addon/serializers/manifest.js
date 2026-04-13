import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class ManifestSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    attrs = {
        driver: { embedded: 'always' },
        vehicle: { embedded: 'always' },
        stops: { embedded: 'always' },
    };
}
