import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class AssetConnectionSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    get attrs() {
        return {
            vehicle: { embedded: 'always' },
            trailer: { embedded: 'always' },
        };
    }
}
