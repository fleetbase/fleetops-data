import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate } from 'date-fns';

export default class InspectionSubmissionModel extends Model {
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') inspection_form_uuid;
    @attr('string') vehicle_uuid;
    @attr('string') driver_uuid;
    @attr('string') submitted_by_uuid;
    @attr('string') issue_uuid;
    @attr('string') work_order_uuid;
    @belongsTo('inspection-form', { async: false, inverse: null }) form;
    @belongsTo('vehicle', { async: false, inverse: null }) vehicle;
    @belongsTo('driver', { async: false, inverse: null }) driver;
    @belongsTo('user', { async: false, inverse: null }) submitted_by;
    @belongsTo('issue', { async: false, inverse: null }) issue;
    @belongsTo('work-order', { async: false, inverse: null }) work_order;
    @attr('raw') item_results;
    @attr('string') type;
    @attr('string') status;
    @attr('string') result;
    @attr('string') source;
    @attr('number') odometer;
    @attr('number') engine_hours;
    @attr('number') total_items;
    @attr('number') failed_items;
    @attr('raw') location;
    @attr('raw') signature;
    @attr('raw') attachments;
    @attr('raw') meta;
    @attr('string') form_name;
    @attr('string') vehicle_name;
    @attr('string') driver_name;
    @attr('boolean') has_failures;
    @attr('date') started_at;
    @attr('date') submitted_at;
    @attr('date') resolved_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    get displayName() {
        return this.public_id || this.form_name || 'Inspection';
    }

    /**
     * The display dates a table or a details panel reads — formatted here, as
     * in every other model in this package, rather than handed out as a raw
     * `Date` that renders as a full datetime instance string.
     */
    @computed('created_at') get createdAt() {
        if (!isValidDate(this.created_at)) {
            return null;
        }

        return formatDate(this.created_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('updated_at') get updatedAt() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }

        return formatDate(this.updated_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('submitted_at') get submittedAt() {
        if (!isValidDate(this.submitted_at)) {
            return null;
        }

        return formatDate(this.submitted_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('resolved_at') get resolvedAt() {
        if (!isValidDate(this.resolved_at)) {
            return null;
        }

        return formatDate(this.resolved_at, 'yyyy-MM-dd HH:mm');
    }
}
