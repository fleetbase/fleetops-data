import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class TelematicModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') warranty_uuid;

    /** @relationships */
    @belongsTo('warranty', { async: false }) warranty;

    /** @attributes */
    @attr('string') name;
    @attr('string') provider;
    @attr('string') model;
    @attr('string') serial_number;
    @attr('string') firmware_version;
    @attr('string') status;
    @attr('string') imei;
    @attr('string') iccid;
    @attr('string') imsi;
    @attr('string') msisdn;
    @attr('raw') last_metrics;
    @attr('raw') config;
    @attr('raw') meta;
    @attr('string') slug;
    @attr('string') warranty_name;

    /** @dates */
    @attr('date') last_seen_at;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
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

    @computed('last_seen_at') get lastSeenAgo() {
        if (!isValidDate(this.last_seen_at)) {
            return null;
        }
        return formatDistanceToNow(this.last_seen_at);
    }

    @computed('last_seen_at') get lastSeenAt() {
        if (!isValidDate(this.last_seen_at)) {
            return null;
        }
        return formatDate(this.last_seen_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('last_seen_at') get lastSeenAtShort() {
        if (!isValidDate(this.last_seen_at)) {
            return null;
        }
        return formatDate(this.last_seen_at, 'dd, MMM');
    }
}
