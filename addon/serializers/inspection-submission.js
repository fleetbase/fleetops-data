import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class InspectionSubmissionSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            form: { embedded: 'always' },
            vehicle: { embedded: 'always' },
            driver: { embedded: 'always' },
            submitted_by: { embedded: 'always' },
            issue: { embedded: 'always' },
            work_order: { embedded: 'always' },
            item_results: { embedded: 'always' },
            custom_field_values: { embedded: 'always' },
        };
    }
}
