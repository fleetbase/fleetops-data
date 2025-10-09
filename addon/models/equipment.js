import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class EquipmentModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') warranty_uuid;
    @attr('string') photo_uuid;
    @attr('string') equipable_type;
    @attr('string') equipable_uuid;

    /** @relationships */
    @belongsTo('warranty', { async: false }) warranty;
    @belongsTo('file', { async: false }) photo;
    @hasMany('maintenance', { async: false }) maintenances;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') code;
    @attr('string') type;
    @attr('string') status;
    @attr('string') serial_number;
    @attr('string') manufacturer;
    @attr('string') model;
    @attr('number') purchase_price;
    @attr('raw') meta;
    @attr('string') slug;
    @attr('string') warranty_name;
    @attr('string') photo_url;

    /** @dates */
    @attr('date') purchased_at;
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

    @computed('purchased_at') get purchasedAgo() {
        if (!isValidDate(this.purchased_at)) {
            return null;
        }
        return formatDistanceToNow(this.purchased_at);
    }

    @computed('purchased_at') get purchasedAt() {
        if (!isValidDate(this.purchased_at)) {
            return null;
        }
        return formatDate(this.purchased_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('purchased_at') get purchasedAtShort() {
        if (!isValidDate(this.purchased_at)) {
            return null;
        }
        return formatDate(this.purchased_at, 'dd, MMM');
    }
}
