import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class ManifestStopSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    attrs = {
        order: { embedded: 'always' },
        place: { embedded: 'always' },
    };
}
