import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { get, computed } from '@ember/object';
import { not } from '@ember/object/computed';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';
import { getOwner } from '@ember/application';
import isValidCoordinates from '@fleetbase/ember-core/utils/is-valid-coordinates';
import config from 'ember-get-config';

export default class VehicleModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') internal_id;
    @attr('string') company_uuid;
    @attr('string') photo_uuid;
    @attr('string') vendor_uuid;
    @attr('string') category_uuid;
    @attr('string') warranty_uuid;
    @attr('string') telematic_uuid;

    /** @relationships */
    @belongsTo('driver', { async: false }) driver;
    @belongsTo('vendor', { async: false }) vendor;
    @hasMany('device', { async: false }) devices;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleImage'),
    })
    photo_url;
    @attr('string') name;
    @attr('string') description;
    @attr('string') driver_name;
    @attr('string') vendor_name;
    @attr('string') display_name;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    avatar_url;
    @attr('string') avatar_value;

    /** Position */
    @attr('point') location;
    @attr('string') speed;
    @attr('string') heading;
    @attr('string') altitude;

    /** Basic vehicle info */
    @attr('string') make;
    @attr('string') model;
    @attr('string') model_type;
    @attr('string') year;
    @attr('string') trim;
    @attr('string') color;
    @attr('string') transmission;
    @attr('string') type;
    @attr('string') class;

    /** Measurement & fuel */
    @attr('string', { defaultValue: 'km' }) measurement_system;
    @attr('string') fuel_type;
    @attr('string') fuel_volume_unit;

    /** Body / usage */
    @attr('string') body_type;
    @attr('string') body_sub_type;
    @attr('string') usage_type;
    @attr('string') ownership_type;

    /** Odometer */
    @attr('string') odometer;
    @attr('string', { defaultValue: 'km' }) odometer_unit;
    @attr('number') odometer_at_purchase;

    /** Registration / identifiers */
    @attr('string') plate_number;
    @attr('string') call_sign;
    @attr('string') serial_number;
    @attr('string') vin;

    /** Financing & lifecycle */
    @attr('string') financing_status;
    @attr('number') loan_number_of_payments;
    @attr('date') loan_first_payment;
    @attr('string') loan_amount;
    @attr('string') estimated_service_life_distance_unit;
    @attr('number') estimated_service_life_distance;
    @attr('number') estimated_service_life_months;

    /** Capacity & dimensions */
    @attr('number') cargo_volume;
    @attr('number') passenger_volume;
    @attr('number') interior_volume;
    @attr('number') weight;
    @attr('number') width;
    @attr('number') length;
    @attr('number') height;
    @attr('number') towing_capacity;
    @attr('number') payload_capacity;
    @attr('number') seating_capacity;
    @attr('number') ground_clearance;
    @attr('number') bed_length;
    @attr('number') fuel_capacity;

    /** Regulatory / compliance */
    @attr('string') emission_standard;
    @attr('boolean') dpf_equipped;
    @attr('boolean') scr_equipped;
    @attr('number') gvwr;
    @attr('number') gcwr;

    /** Engine specs */
    @attr('string') engine_number;
    @attr('string') engine_model;
    @attr('string') engine_make;
    @attr('string') engine_family;
    @attr('string') engine_configuration;
    @attr('number') engine_displacement;
    @attr('number') engine_size;
    @attr('number') horsepower;
    @attr('number') horsepower_rpm;
    @attr('number') torque;
    @attr('number') torque_rpm;
    @attr('number') number_of_cylinders;
    @attr('string') cylinder_arrangement;

    /** Financial values */
    @attr('string') currency;
    @attr('string') insurance_value;
    @attr('string') depreciation_rate;
    @attr('string') current_value;
    @attr('string') acquisition_cost;

    /** Misc text / meta */
    @attr('string') notes;
    @attr('string') status;
    @attr('string') slug;
    @attr('boolean') online;
    @attr('raw') vin_data;
    @attr('raw') specs;
    @attr('raw') telematics;
    @attr('raw') meta;

    /** @dates */
    @attr('date') purchased_at;
    @attr('date') lease_expires_at;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('name', 'display_name') get displayName() {
        return this.name ?? this.display_name;
    }

    @computed('year', 'make', 'model') get yearMakeModel() {
        return [this.year, this.make, this.model].filter(Boolean).join(' ');
    }

    @computed('name', 'display_name', 'vin', 'serial_number', 'call_sign', 'plate_number', 'yearMakeModel') get searchString() {
        return [this.name, this.display_name, this.vin, this.serial_number, this.call_sign, this.plate_number, this.yearMakeModel].filter(Boolean).join(' ');
    }

    @computed('updated_at') get updatedAgo() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDistanceToNow(this.updated_at);
    }

    @computed('updated_at') get updatedAt() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDate(this.updated_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('updated_at') get updatedAtShort() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDate(this.updated_at, 'dd, MMM');
    }

    @computed('created_at') get createdAgo() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDistanceToNow(this.created_at);
    }

    @computed('created_at') get createdAt() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDate(this.created_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('created_at') get createdAtShort() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDate(this.created_at, 'dd, MMM');
    }

    @computed('location') get longitude() {
        return get(this.location, 'coordinates.0');
    }

    @computed('location') get latitude() {
        return get(this.location, 'coordinates.1');
    }

    @computed('latitude', 'longitude') get coordinates() {
        // eslint-disable-next-line ember/no-get
        return [get(this, 'latitude'), get(this, 'longitude')];
    }

    @computed('latitude', 'longitude') get positionString() {
        // eslint-disable-next-line ember/no-get
        return `${get(this, 'latitude')} ${get(this, 'longitude')}`;
    }

    @computed('latitude', 'longitude') get latlng() {
        return {
            // eslint-disable-next-line ember/no-get
            lat: get(this, 'latitude'),
            // eslint-disable-next-line ember/no-get
            lng: get(this, 'longitude'),
        };
    }

    @computed('latitude', 'longitude') get latitudelongitude() {
        return {
            // eslint-disable-next-line ember/no-get
            latitude: get(this, 'latitude'),
            // eslint-disable-next-line ember/no-get
            longitude: get(this, 'longitude'),
        };
    }

    @computed('coordinates', 'latitude', 'longitude') get hasValidCoordinates() {
        if (this.longitude === 0 || this.latitude === 0) {
            return false;
        }

        return isValidCoordinates(this.coordinates);
    }

    @not('hasValidCoordinates') hasInvalidCoordinates;

    /** @methods */
    async loadDriver() {
        if (!this.driver_uuid) return;

        const owner = getOwner(this);
        const store = owner.lookup('service:store');

        const driver = await store.findRecord('driver', this.driver_uuid);
        this.driver = driver;

        return driver;
    }

    async loadDevices() {
        const owner = getOwner(this);
        const store = owner.lookup('service:store');

        const devices = await store.query('device', { vehicle_uuid: this.id });
        this.devices = devices;

        return devices;
    }
}
