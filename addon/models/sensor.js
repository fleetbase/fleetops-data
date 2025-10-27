import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class SensorModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') telematic_uuid;
    @attr('string') device_uuid;
    @attr('string') warranty_uuid;
    @attr('string') sensorable_type;
    @attr('string') sensorable_uuid;
    @attr('string') photo_uuid;

    /** @relationships */
    @belongsTo('telematic', { async: false }) telematic;
    @belongsTo('device', { async: false }) device;
    @belongsTo('warranty', { async: false }) warranty;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') photo_url;
    @attr('string') internal_id;
    @attr('string') type;
    @attr('string') serial_number;
    @attr('string') imei;
    @attr('string') imsi;
    @attr('string') firmware_version;
    @attr('string') unit;
    @attr('string') threshold_status;
    @attr('number') min_threshold;
    @attr('number') max_threshold;
    @attr('boolean') threshold_inclusive;
    @attr('boolean') is_active;
    @attr('string') last_value;
    @attr('number') report_frequency_sec;
    @attr('point') last_position;
    @attr('object') calibration;
    @attr('object') meta;
    @attr('string') slug;
    @attr('string', { defaultValue: 'inactive' }) status;

    /** @dates */
    @attr('date') last_reading_at;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('name', 'serial_number', 'internal_id', 'imei', 'public_id') get displayName() {
        return this.name || this.serial_number || this.internal_id || this.imei || this.public_id;
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

    @computed('last_reading_at') get lastReadingAgo() {
        if (!isValidDate(this.last_reading_at)) {
            return null;
        }
        return formatDistanceToNow(this.last_reading_at);
    }

    @computed('last_reading_at') get lastReadingAt() {
        if (!isValidDate(this.last_reading_at)) {
            return null;
        }
        return formatDate(this.last_reading_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('last_reading_at') get lastReadingAtShort() {
        if (!isValidDate(this.last_reading_at)) {
            return null;
        }
        return formatDate(this.last_reading_at, 'dd, MMM');
    }
}
