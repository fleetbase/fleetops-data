import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class MaintenanceSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {}
