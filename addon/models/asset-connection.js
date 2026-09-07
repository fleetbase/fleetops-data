import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceStrict } from 'date-fns';

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

    @belongsTo('vehicle', { async: false, inverse: null }) vehicle;
    @belongsTo('trailer', { async: false, inverse: null }) trailer;

    @computed('active', 'disconnected_at') get isActive() {
        return this.active === true || (this.active !== false && !this.disconnected_at);
    }

    @computed('connected_at') get connectedAt() {
        return isValidDate(this.connected_at) ? formatDate(this.connected_at, 'yyyy-MM-dd HH:mm') : null;
    }

    @computed('disconnected_at') get disconnectedAt() {
        return isValidDate(this.disconnected_at) ? formatDate(this.disconnected_at, 'yyyy-MM-dd HH:mm') : null;
    }

    @computed('connected_at', 'disconnected_at') get duration() {
        if (!isValidDate(this.connected_at)) {
            return null;
        }

        return formatDistanceStrict(this.connected_at, isValidDate(this.disconnected_at) ? this.disconnected_at : new Date());
    }
}
