import Model, { attr, belongsTo } from '@ember-data/model';

export default class InspectionItemResultModel extends Model {
    @attr('string') uuid;
    @attr('string') company_uuid;
    @attr('string') inspection_submission_uuid;
    @attr('string') issue_uuid;
    @attr('string') work_order_uuid;
    @belongsTo('inspection-submission', { async: false, inverse: null }) submission;
    @belongsTo('issue', { async: false, inverse: null }) issue;
    @belongsTo('work-order', { async: false, inverse: null }) work_order;
    @attr('string') item_key;
    @attr('string') label;
    @attr('string') category;
    @attr('string') status;
    @attr('string') severity;
    @attr('boolean') passed;
    @attr('string') comments;
    @attr('raw') photos;
    @attr('raw') meta;
    @attr('date') created_at;
    @attr('date') updated_at;
}
