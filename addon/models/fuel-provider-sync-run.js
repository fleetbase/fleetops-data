import Model, { attr } from '@ember-data/model';

export default class FuelProviderSyncRunModel extends Model {
    @attr('string') public_id;
    @attr('string') fuel_provider_connection_uuid;
    @attr('string') provider;
    @attr('string') status;
    @attr('string') error;
    @attr('number') imported;
    @attr('number') matched;
    @attr('number') unmatched;
    @attr('number') fuel_reports_created;
    @attr('number') liters;
    @attr('number') amount;
    @attr('date') from;
    @attr('date') to;
    @attr('date') started_at;
    @attr('date') finished_at;
    @attr('date') created_at;
    @attr('date') updated_at;
    @attr('raw') summary;
    @attr('raw') meta;
}
