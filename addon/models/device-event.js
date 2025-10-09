import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class DeviceEventModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') device_uuid;

    /** @relationships */
    @belongsTo('device', { async: false }) device;

    /** @attributes */
    @attr('raw') payload;
    @attr('raw') meta;
    @attr('string') location;
    @attr('string') event_type;
    @attr('string') severity;
    @attr('string') ident;
    @attr('string') protocol;
    @attr('string') provider;
    @attr('string') mileage;
    @attr('string') state;
    @attr('string') code;
    @attr('string') reason;
    @attr('string') comment;
    @attr('string') slug;
    @attr('string') device_name;

    /** @dates */
    @attr('date') occurred_at;
    @attr('date') processed_at;
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

    @computed('occurred_at') get occurredAgo() {
        if (!isValidDate(this.occurred_at)) {
            return null;
        }
        return formatDistanceToNow(this.occurred_at);
    }

    @computed('occurred_at') get occurredAt() {
        if (!isValidDate(this.occurred_at)) {
            return null;
        }
        return formatDate(this.occurred_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('occurred_at') get occurredAtShort() {
        if (!isValidDate(this.occurred_at)) {
            return null;
        }
        return formatDate(this.occurred_at, 'dd, MMM');
    }

    @computed('processed_at') get processedAgo() {
        if (!isValidDate(this.processed_at)) {
            return null;
        }
        return formatDistanceToNow(this.processed_at);
    }

    @computed('processed_at') get processedAt() {
        if (!isValidDate(this.processed_at)) {
            return null;
        }
        return formatDate(this.processed_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('processed_at') get processedAtShort() {
        if (!isValidDate(this.processed_at)) {
            return null;
        }
        return formatDate(this.processed_at, 'dd, MMM');
    }
}
