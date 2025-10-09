import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class WarrantyModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') subject_type;
    @attr('string') subject_uuid;
    @attr('string') vendor_uuid;

    /** @relationships */
    @belongsTo('vendor', { async: false }) vendor;

    /** @attributes */
    @attr('string') provider;
    @attr('string') policy_number;
    @attr('raw') coverage;
    @attr('raw') terms;
    @attr('raw') policy;
    @attr('raw') meta;
    @attr('string') slug;
    @attr('string') vendor_name;

    /** @dates */
    @attr('date') start_date;
    @attr('date') end_date;
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

    @computed('start_date') get startDateAgo() {
        if (!isValidDate(this.start_date)) {
            return null;
        }
        return formatDistanceToNow(this.start_date);
    }

    @computed('start_date') get startDate() {
        if (!isValidDate(this.start_date)) {
            return null;
        }
        return formatDate(this.start_date, 'PPP');
    }

    @computed('start_date') get startDateShort() {
        if (!isValidDate(this.start_date)) {
            return null;
        }
        return formatDate(this.start_date, 'dd, MMM');
    }

    @computed('end_date') get endDateAgo() {
        if (!isValidDate(this.end_date)) {
            return null;
        }
        return formatDistanceToNow(this.end_date);
    }

    @computed('end_date') get endDate() {
        if (!isValidDate(this.end_date)) {
            return null;
        }
        return formatDate(this.end_date, 'PPP');
    }

    @computed('end_date') get endDateShort() {
        if (!isValidDate(this.end_date)) {
            return null;
        }
        return formatDate(this.end_date, 'dd, MMM');
    }
}
