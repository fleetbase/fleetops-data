import Model, { attr, belongsTo } from '@ember-data/model';

export default class AssetConnectionModel extends Model {
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') connector_type;
    @attr('string') connector_uuid;
    @attr('string') connected_type;
    @attr('string') connected_uuid;
    @attr('string', { defaultValue: 'towing' }) relationship_type;
    @attr('number', { defaultValue: 1 }) position;
    @attr('string') source;
    @attr('string') confidence;
    @attr('string') notes;
    @attr('raw') meta;
    @attr('boolean') active;
    @attr('date') connected_at;
    @attr('date') disconnected_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    @belongsTo('vehicle', { async: false }) vehicle;
    @belongsTo('trailer', { async: false }) trailer;
}
