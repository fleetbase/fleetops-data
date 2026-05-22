import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class ServiceRateFeeModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') service_rate_uuid;
    @attr('string') service_area_uuid;
    @attr('string') zone_uuid;

    /** @relationships */
    @belongsTo('service-area') service_area;
    @belongsTo('zone') zone;

    /** @attributes */
    @attr('string') label;
    @attr('number') priority;
    @attr('boolean', { defaultValue: false }) is_fallback;
    @attr('number') distance;
    @attr('string') distance_unit;
    @attr('string') unit;
    @attr('string') fee;
    @attr('string') currency;
    @attr('number') min;
    @attr('number') max;

    /** @dates */
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

    @computed('is_fallback', 'zone_uuid', 'service_area_uuid', 'zone.id', 'service_area.id') get geography_type() {
        if (this.is_fallback) {
            return 'fallback';
        }

        if (this.zone_uuid || this.zone?.id) {
            return 'zone';
        }

        return 'service_area';
    }

    /** @methods */
    toJSON() {
        return {
            uuid: this.uuid,
            service_rate_uuid: this.service_rate_uuid,
            service_area_uuid: this.service_area_uuid,
            zone_uuid: this.zone_uuid,
            label: this.label,
            priority: this.priority,
            is_fallback: this.is_fallback,
            distance: this.distance,
            distance_unit: this.distance_unit,
            min: this.min,
            max: this.max,
            unit: this.unit,
            fee: this.fee,
            currency: this.currency,
        };
    }
}
