import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate } from 'date-fns';

/**
 * ManifestStop model
 *
 * Represents a single physical stop within a Manifest. Each stop corresponds
 * to one Order (or one waypoint within a multi-waypoint order) and carries
 * a direct FK to the Place it represents for fast map rendering and geofence
 * arrival detection in the Navigator app.
 *
 * Status lifecycle: pending → arrived → completed | skipped
 */
export default class ManifestStopModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') manifest_uuid;
    @attr('string') order_uuid;
    @attr('string') place_uuid;
    @attr('string') waypoint_uuid;

    /** @relationships */
    @belongsTo('manifest', { async: false, inverse: 'stops' }) manifest;
    @belongsTo('order', { async: false }) order;
    @belongsTo('place', { async: false }) place;

    /** @attributes */
    @attr('number') sequence;
    @attr('string') status;
    @attr('string') notes;

    /** @timing */
    @attr('date') estimated_arrival;
    @attr('date') actual_arrival;

    /** @distance from previous stop (metres) */
    @attr('number') distance_from_prev_m;

    /** @meta */
    @attr('raw') meta;

    /** @dates */
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('status') get isPending() {
        return this.status === 'pending';
    }

    @computed('status') get isArrived() {
        return this.status === 'arrived';
    }

    @computed('status') get isCompleted() {
        return this.status === 'completed';
    }

    @computed('status') get isSkipped() {
        return this.status === 'skipped';
    }

    @computed('status') get statusLabel() {
        const labels = {
            pending: 'Pending',
            arrived: 'Arrived',
            completed: 'Completed',
            skipped: 'Skipped',
        };
        return labels[this.status] ?? this.status;
    }

    @computed('estimated_arrival') get estimatedArrivalFormatted() {
        if (!isValidDate(this.estimated_arrival)) {
            return null;
        }
        return formatDate(this.estimated_arrival, 'HH:mm');
    }

    @computed('actual_arrival') get actualArrivalFormatted() {
        if (!isValidDate(this.actual_arrival)) {
            return null;
        }
        return formatDate(this.actual_arrival, 'HH:mm');
    }

    @computed('distance_from_prev_m') get distanceFromPrevKm() {
        return this.distance_from_prev_m ? (this.distance_from_prev_m / 1000).toFixed(1) : null;
    }

    @computed('sequence') get stopLabel() {
        return `Stop ${this.sequence}`;
    }
}
