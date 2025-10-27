import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class PositionModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') order_uuid;
    @attr('string') destination_uuid;
    @attr('string') subject_uuid;
    @attr('string') subject_type;

    /** @relationships */
    @belongsTo('order', { async: false }) order;
    @belongsTo('place', { async: false }) destination;

    /** @attributes */
    @attr('point') coordinates;
    @attr('number') heading;
    @attr('number') bearing;
    @attr('number') speed;
    @attr('number') altitude;
    @attr('number') latitude;
    @attr('number') longitude;

    /** @dates */
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('coordinates') get location() {
        return this.coordinates;
    }

    @computed('latitude', 'longitude') get latLng() {
        if (this.latitude && this.longitude) {
            return [this.latitude, this.longitude];
        }
        return null;
    }

    @computed('created_at') get timestamp() {
        if (this.created_at && isValidDate(new Date(this.created_at))) {
            return formatDate(new Date(this.created_at), 'yyyy-MM-dd HH:mm:ss');
        }
        return null;
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

    @computed('speed') get speedKmh() {
        // Convert m/s to km/h
        if (this.speed !== null && this.speed !== undefined) {
            return (this.speed * 3.6).toFixed(2);
        }
        return 0;
    }

    @computed('speed') get speedMph() {
        // Convert m/s to mph
        if (this.speed !== null && this.speed !== undefined) {
            return (this.speed * 2.23694).toFixed(2);
        }
        return 0;
    }
}
