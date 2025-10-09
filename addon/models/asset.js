import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class AssetModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') category_uuid;
    @attr('string') vendor_uuid;
    @attr('string') warranty_uuid;
    @attr('string') telematic_uuid;
    @attr('string') assigned_to_uuid;
    @attr('string') assigned_to_type;
    @attr('string') operator_uuid;
    @attr('string') operator_type;
    @attr('string') current_place_uuid;
    @attr('string') photo_uuid;

    /** @relationships */
    @belongsTo('category', { async: false }) category;
    @belongsTo('vendor', { async: false }) vendor;
    @belongsTo('warranty', { async: false }) warranty;
    @belongsTo('telematic', { async: false }) telematic;
    @belongsTo('place', { async: false }) current_place;
    @belongsTo('file', { async: false }) photo;
    @hasMany('device', { async: false }) devices;
    @hasMany('equipment', { async: false }) equipments;
    @hasMany('maintenance', { async: false }) maintenances;
    @hasMany('sensor', { async: false }) sensors;
    @hasMany('part', { async: false }) parts;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') description;
    @attr('string') code;
    @attr('string') type;
    @attr('point') location;
    @attr('string') speed;
    @attr('string') heading;
    @attr('string') altitude;
    @attr('string') status;
    @attr('string') usage_type;
    @attr('string') vin;
    @attr('string') plate_number;
    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') color;
    @attr('string') serial_number;
    @attr('string') measurement_system;
    @attr('string') odometer;
    @attr('string') odometer_unit;
    @attr('string') transmission;
    @attr('string') fuel_volume_unit;
    @attr('string') fuel_Type;
    @attr('string') ownership_type;
    @attr('string') engine_hours;
    @attr('string') gvw;
    @attr('raw') capacity;
    @attr('raw') specs;
    @attr('raw') attributes;
    @attr('string') notes;
    @attr('string') slug;
    @attr('string') photo_url;
    @attr('string') display_name;
    @attr('string') category_name;
    @attr('string') vendor_name;
    @attr('string') warranty_name;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('year', 'make', 'model') get yearMakeModel() {
        return [this.year, this.make, this.model].filter(Boolean).join(' ');
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

    @computed('deleted_at') get deletedAgo() {
        if (!isValidDate(this.deleted_at)) {
            return null;
        }
        return formatDistanceToNow(this.deleted_at);
    }

    @computed('deleted_at') get deletedAt() {
        if (!isValidDate(this.deleted_at)) {
            return null;
        }
        return formatDate(this.deleted_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('deleted_at') get deletedAtShort() {
        if (!isValidDate(this.deleted_at)) {
            return null;
        }
        return formatDate(this.deleted_at, 'dd, MMM');
    }
}
