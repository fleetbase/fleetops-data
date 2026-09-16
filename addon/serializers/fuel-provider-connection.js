import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class FuelProviderConnectionSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    serialize() {
        const json = super.serialize(...arguments);

        // Credentials are write-only. A fetched record has no credentials to send
        // until the operator supplies a replacement.
        if (json.credentials === null || json.credentials === undefined) {
            delete json.credentials;
        }

        return json;
    }
}
