import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate } from 'date-fns';

export default class FuelProviderTransactionModel extends Model {
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') fuel_provider_connection_uuid;
    @attr('string') fuel_report_uuid;
    @attr('string') fuel_report_id;
    @attr('string') vehicle_uuid;
    @attr('string') driver_uuid;
    @attr('string') order_uuid;
    @attr('string') provider;
    @attr('string') provider_transaction_id;
    @attr('string') provider_vehicle_id;
    @attr('string') vehicle_card_id;
    @attr('string') internal_number;
    @attr('string') structure_number;
    @attr('string') plate_number;
    @attr('string') trip_number;
    @attr('string') station_name;
    @attr('string') station_latitude;
    @attr('string') station_longitude;
    @attr('point') station_location;
    @attr('date') transaction_at;
    @attr('string') volume;
    @attr('string') metric_unit;
    @attr('string') amount;
    @attr('string') currency;
    @attr('string') odometer;
    @attr('string') sync_status;
    @attr('date') matched_at;
    @attr('string') vehicle_name;
    @attr('string') driver_name;
    @attr('raw') normalized_payload;
    @attr('raw') raw_payload;
    @attr('raw') meta;

    @belongsTo('fuel-provider-connection') connection;
    @belongsTo('fuel-report') fuel_report;
    @belongsTo('vehicle') vehicle;
    @belongsTo('driver') driver;
    @belongsTo('order') order;

    @attr('date') created_at;
    @attr('date') updated_at;

    @computed('transaction_at') get transactionAt() {
        if (!isValidDate(this.transaction_at)) {
            return null;
        }

        return formatDate(this.transaction_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('sync_status') get isMatched() {
        return this.sync_status === 'matched';
    }
}
