import Model, { attr, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';
import first from '@fleetbase/ember-core/utils/first';

export default class ServiceAreaModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') parent_uuid;

    /** @relationships */
    @hasMany('zone', { async: false }) zones;
    @hasMany('custom-field-value', { async: false }) custom_field_values;

    /** @attributes */
    @attr('string') name;
    @attr('string') type;
    @attr('string') country;
    @attr('string') color;
    @attr('string') stroke_color;
    @attr('string') status;
    @attr('multi-polygon') border;
    @attr('point') center;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('border.coordinates.@each') get coordinates() {
        const polygons = this.border?.coordinates[0] ?? [];
        return polygons.length ? polygons[0] : [];
    }

    @computed('coordinates.@each') get leafletCoordinates() {
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
