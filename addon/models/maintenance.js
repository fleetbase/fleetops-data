import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class MaintenanceModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') work_order_uuid;
    @attr('string') maintainable_type;
    @attr('string') maintainable_uuid;
    @attr('string') performed_by_type;
    @attr('string') performed_by_uuid;

    /** @relationships */
    @belongsTo('work-order', { async: false }) work_order;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') type;
    @attr('string') status;
    @attr('string') priority;
    @attr('number') odometer;
    @attr('number') engine_hours;
    @attr('string') summary;
    @attr('string') notes;
    @attr('raw') line_items;
    @attr('number') labor_cost;
    @attr('number') parts_cost;
    @attr('number') tax;
    @attr('number') total_cost;
    @attr('raw') attachments;
    @attr('raw') meta;
    @attr('string') slug;

    /** @dates */
    @attr('date') scheduled_at;
    @attr('date') started_at;
    @attr('date') completed_at;
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

    @computed('scheduled_at') get scheduledAgo() {
        if (!isValidDate(this.scheduled_at)) {
            return null;
        }
        return formatDistanceToNow(this.scheduled_at);
    }

    @computed('scheduled_at') get scheduledAt() {
        if (!isValidDate(this.scheduled_at)) {
            return null;
        }
        return formatDate(this.scheduled_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('scheduled_at') get scheduledAtShort() {
        if (!isValidDate(this.scheduled_at)) {
            return null;
        }
        return formatDate(this.scheduled_at, 'dd, MMM');
    }

    @computed('started_at') get startedAgo() {
        if (!isValidDate(this.started_at)) {
            return null;
        }
        return formatDistanceToNow(this.started_at);
    }

    @computed('started_at') get startedAt() {
        if (!isValidDate(this.started_at)) {
            return null;
        }
        return formatDate(this.started_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('started_at') get startedAtShort() {
        if (!isValidDate(this.started_at)) {
            return null;
        }
        return formatDate(this.started_at, 'dd, MMM');
    }

    @computed('completed_at') get completedAgo() {
        if (!isValidDate(this.completed_at)) {
            return null;
        }
        return formatDistanceToNow(this.completed_at);
    }

    @computed('completed_at') get completedAt() {
        if (!isValidDate(this.completed_at)) {
            return null;
        }
        return formatDate(this.completed_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('completed_at') get completedAtShort() {
        if (!isValidDate(this.completed_at)) {
            return null;
        }
        return formatDate(this.completed_at, 'dd, MMM');
    }
}
