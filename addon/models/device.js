import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class DeviceModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') telematic_uuid;
    @attr('string') warranty_uuid;
    @attr('string') attachable_type;
    @attr('string') attachable_uuid;
    @attr('string') photo_uuid;

    /** @relationships */
    @belongsTo('telematic', { async: false }) telematic;
    @belongsTo('warranty', { async: false }) warranty;
    @hasMany('device-event', { async: false }) events;
    @hasMany('sensor', { async: false }) sensors;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') model;
    @attr('string') location;
    @attr('string') type;
    @attr('string') device_id;
    @attr('string') internal_id;
    @attr('string') imei;
    @attr('string') imsi;
    @attr('string') firmware_version;
    @attr('string') provider;
    @attr('string') photo_url;
    @attr('string') manufacturer;
    @attr('string') serial_number;
    @attr('point') last_position;
    @attr('object') meta;
    @attr('object') data;
    @attr('object') options;
    @attr('boolean') online;
    @attr('string', { defaultValue: 'inactive' }) status;
    @attr('string') data_frequency;
    @attr('string') notes;
    @attr('string') slug;

    /** @dates */
    @attr('date') last_maintenance_date;
    @attr('date') installation_date;
    @attr('date') last_online_at;
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

    @computed('last_online_at') get lastOnlineAgo() {
        if (!isValidDate(this.last_online_at)) {
            return null;
        }
        return formatDistanceToNow(this.last_online_at);
    }

    @computed('last_online_at') get lastOnlineAt() {
        if (!isValidDate(this.last_online_at)) {
            return null;
        }
        return formatDate(this.last_online_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('last_online_at') get lastOnlineAtShort() {
        if (!isValidDate(this.last_online_at)) {
            return null;
        }
        return formatDate(this.last_online_at, 'dd, MMM');
    }
}
