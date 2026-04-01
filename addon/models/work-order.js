import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class WorkOrderModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') schedule_uuid;

    /** @polymorphic relationships */
    @belongsTo('maintenance-subject', { polymorphic: true, async: false }) target;
    @belongsTo('facilitator', { polymorphic: true, async: false }) assignee;

    /** @attributes */
    @attr('string') code;
    @attr('string') subject;
    @attr('string') status;
    @attr('string') priority;
    @attr('string') instructions;
    @attr('raw') checklist;
    @attr('raw') meta;
    @attr('string') slug;

    /** @dates */
    @attr('date') opened_at;
    @attr('date') due_at;
    @attr('date') closed_at;
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

    @computed('opened_at') get openedAgo() {
        if (!isValidDate(this.opened_at)) {
            return null;
        }
        return formatDistanceToNow(this.opened_at);
    }

    @computed('opened_at') get openedAt() {
        if (!isValidDate(this.opened_at)) {
            return null;
        }
        return formatDate(this.opened_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('opened_at') get openedAtShort() {
        if (!isValidDate(this.opened_at)) {
            return null;
        }
        return formatDate(this.opened_at, 'dd, MMM');
    }

    @computed('due_at') get dueAgo() {
        if (!isValidDate(this.due_at)) {
            return null;
        }
        return formatDistanceToNow(this.due_at);
    }

    @computed('due_at') get dueAt() {
        if (!isValidDate(this.due_at)) {
            return null;
        }
        return formatDate(this.due_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('due_at') get dueAtShort() {
        if (!isValidDate(this.due_at)) {
            return null;
        }
        return formatDate(this.due_at, 'dd, MMM');
    }

    @computed('closed_at') get closedAgo() {
        if (!isValidDate(this.closed_at)) {
            return null;
        }
        return formatDistanceToNow(this.closed_at);
    }

    @computed('closed_at') get closedAt() {
        if (!isValidDate(this.closed_at)) {
            return null;
        }
        return formatDate(this.closed_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('closed_at') get closedAtShort() {
        if (!isValidDate(this.closed_at)) {
            return null;
        }
        return formatDate(this.closed_at, 'dd, MMM');
    }
}
