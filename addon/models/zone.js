import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { isArray } from '@ember/array';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';
import first from '@fleetbase/ember-core/utils/first';

export default class ZoneModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') service_area_uuid;

    /** @relationships */
    @belongsTo('service-area') service_area;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') description;
    @attr('string') color;
    @attr('string') stroke_color;
    @attr('string') status;
    @attr('polygon') border;
    @attr('point') center;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('border.coordinates.[]') get coordinates() {
        return this.border?.coordinates[0] ?? [];
    }

    @computed('coordinates') get leafletCoordinates() {
        return this.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
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
}
