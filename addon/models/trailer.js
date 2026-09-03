import AssetModel from './asset';
import { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed, get } from '@ember/object';
import { not } from '@ember/object/computed';
import isValidCoordinates from '@fleetbase/ember-core/utils/is-valid-coordinates';

/**
 * A first-class towed fleet asset.
 *
 * Trailer records share the common Asset contract while exposing the
 * operational, connection, capacity, and telemetry fields used by Fleet-Ops.
 */
export default class TrailerModel extends AssetModel {
    /** @relationships */
    @belongsTo('vehicle', { async: false, inverse: null }) current_vehicle;
    @belongsTo('asset-connection', { async: false, inverse: null }) current_connection;
    @hasMany('asset-connection', { async: false, inverse: null }) connections;
    @hasMany('maintenance-schedule', { async: false, inverse: null }) maintenance_schedules;
    @hasMany('work-order', { async: false, inverse: null }) work_orders;
    @hasMany('position', { async: false, inverse: null }) positions;

    /** @classification */
    @attr('string', { defaultValue: 'trailer' }) asset_class;
    @attr('string') body_type;
    @attr('string') coupling_type;
    @attr('string') brake_type;

    /** @capacity and dimensions */
    @attr('number') length;
    @attr('number') width;
    @attr('number') height;
    @attr('number') tare_weight;
    @attr('number') gvwr;
    @attr('number') payload_capacity;
    @attr('number') cargo_volume;
    @attr('number') axle_count;
    @attr('number') tire_count;
    @attr('number') door_count;

    /** @specialized trailer capabilities */
    @attr('boolean') abs_equipped;
    @attr('boolean') ebs_equipped;
    @attr('boolean') refrigerated;
    @attr('number') temperature_min;
    @attr('number') temperature_max;
    @attr('number') reefer_engine_hours;

    /** @current operational projections */
    @attr('boolean') online;
    @attr('string') connectivity_status;
    @attr('string') movement_status;
    @attr('raw') telematics;
    @attr('raw') resolved_location;
    @attr('string') current_vehicle_name;
    @attr('string') current_vehicle_id;
    @attr('date') attached_at;
    @attr('number') devices_count;
    @attr('number') equipment_count;
    @attr('date') last_online_at;

    @computed('name', 'display_name', 'code', 'plate_number', 'vin', 'serial_number', 'yearMakeModel') get searchString() {
        return [this.name, this.display_name, this.code, this.plate_number, this.vin, this.serial_number, this.yearMakeModel].filter(Boolean).join(' ');
    }

    @computed('location') get longitude() {
        return get(this.location, 'coordinates.0');
    }

    @computed('location') get latitude() {
        return get(this.location, 'coordinates.1');
    }

    @computed('latitude', 'longitude') get coordinates() {
        return [get(this, 'latitude'), get(this, 'longitude')];
    }

    @computed('latitude', 'longitude') get latlng() {
        return { lat: get(this, 'latitude'), lng: get(this, 'longitude') };
    }

    @computed('coordinates', 'latitude', 'longitude') get hasValidCoordinates() {
        if (this.longitude === 0 || this.latitude === 0) {
            return false;
        }

        return isValidCoordinates(this.coordinates);
    }

    @not('hasValidCoordinates') hasInvalidCoordinates;
}
