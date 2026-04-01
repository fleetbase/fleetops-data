import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class MaintenanceScheduleModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;

    /** @polymorphic relationships */
    @belongsTo('maintenance-subject', { polymorphic: true, async: false }) subject;
    @belongsTo('facilitator', { polymorphic: true, async: false }) default_assignee;

    /** @attributes */
    @attr('string') code;
    @attr('string') title;
    @attr('string') description;
    @attr('string') name;
    @attr('string') type;
    @attr('string') status;
    @attr('string') interval_method;

    /** @interval — time-based */
    @attr('string') interval_type;
    @attr('number') interval_value;
    @attr('string') interval_unit;

    /** @interval — distance / engine-hours */
    @attr('number') interval_distance;
    @attr('number') interval_engine_hours;

    /** @baseline readings */
    @attr('number') last_service_odometer;
    @attr('number') last_service_engine_hours;
    @attr('date') last_service_date;

    /** @next-due thresholds */
    @attr('date') next_due_date;
    @attr('number') next_due_odometer;
    @attr('number') next_due_engine_hours;

    /** @work-order defaults */
    @attr('string') default_priority;

    @attr('string') instructions;
    @attr('raw') meta;
    @attr('string') slug;

    /** @dates */
    @attr('date') last_triggered_at;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('status') get isActive() {
        return this.status === 'active';
    }

    @computed('status') get isPaused() {
        return this.status === 'paused';
    }

    @computed('next_due_date') get nextDueAt() {
        if (!isValidDate(this.next_due_date)) {
            return null;
        }
        return formatDate(this.next_due_date, 'yyyy-MM-dd HH:mm');
    }

    @computed('next_due_date') get nextDueAtShort() {
        if (!isValidDate(this.next_due_date)) {
            return null;
        }
        return formatDate(this.next_due_date, 'dd, MMM yyyy');
    }

    @computed('next_due_date') get nextDueAgo() {
        if (!isValidDate(this.next_due_date)) {
            return null;
        }
        return formatDistanceToNow(this.next_due_date, { addSuffix: true });
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
}
