import PlaceModel from './place';
import { attr } from '@ember-data/model';
import { belongsTo } from '@ember-data/model';

export default class WaypointModel extends PlaceModel {
    /** @relationships */
    @belongsTo('place', { async: false }) place;
    @belongsTo('tracking-number', { async: false }) tracking_number;
    @belongsTo('customer', { polymorphic: true, async: false, inverse: 'waypoints' }) customer;

    /** @attributes */
    @attr('string') public_id;
    @attr('string') _import_id;
    @attr('string') waypoint_uuid;
    @attr('string') waypoint_public_id;
    @attr('string') tracking_number_uuid;
    @attr('string') customer_uuid;
    @attr('string') customer_type;
    @attr('string') tracking;
    @attr('string') status;
    @attr('string') status_code;
    @attr('string') type;
    @attr('number') order;
    @attr('boolean') complete;
    // Orchestrator time windows
    @attr('date') time_window_start;
    @attr('date') time_window_end;
    @attr('number') service_time;
    // Per-stop POD and notes (mirrors order-level fields;
    // used as fallback until per-waypoint POD is implemented in driver app)
    @attr('string') notes;
    @attr('string') pod_method;
    @attr('boolean') pod_required;
}
