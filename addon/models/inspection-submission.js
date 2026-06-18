import Model, { attr, belongsTo } from '@ember-data/model';

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

    get createdAt() {
        return this.created_at;
    }

    get updatedAt() {
        return this.updated_at;
    }

    get submittedAt() {
        return this.submitted_at;
    }

    get resolvedAt() {
        return this.resolved_at;
    }
}
