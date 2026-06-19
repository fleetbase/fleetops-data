import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

/**
 * Abstract base model for resources a device can be attached to.
 * Concrete types: attachable-vehicle, attachable-asset.
 */
export default class AttachableModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;

    /** @attributes */
    @attr('string') name;
    @attr('string') display_name;
    @attr('string') type;
    @attr('string') status;
    @attr('string') photo_url;
    @attr('string') avatar_url;
    @attr('boolean') online;
    @attr('boolean') is_online;
    @attr('point') location;
    @attr('string') speed;
    @attr('string') heading;
    @attr('string') altitude;
    @attr('raw') meta;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('name', 'display_name', 'public_id') get displayName() {
        return this.display_name || this.name || this.public_id;
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
}
