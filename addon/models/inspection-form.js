import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate } from 'date-fns';

export default class InspectionFormModel extends Model {
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') subject_uuid;
    @attr('string') subject_type;
    @attr('string') name;
    @attr('string') description;
    @attr('string') type;
    @attr('string') status;
    @belongsTo('maintenance-subject', { polymorphic: true, async: false }) subject;
    @attr('raw') items;
    @attr('raw') settings;
    @attr('raw') meta;
    @attr('number') item_count;
    @attr('boolean') is_published;
    @attr('date') published_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    get displayName() {
        return this.name || this.public_id;
    }

    /**
     * The display dates a table or a details panel reads. They returned the
     * raw `Date`, which rendered as a full datetime instance string in a
     * column; every other model in this package formats them here.
     */
    @computed('created_at') get createdAt() {
        if (!isValidDate(this.created_at)) {
            return null;
        }

        return formatDate(this.created_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('updated_at') get updatedAt() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }

        return formatDate(this.updated_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('published_at') get publishedAt() {
        if (!isValidDate(this.published_at)) {
            return null;
        }

        return formatDate(this.published_at, 'yyyy-MM-dd HH:mm');
    }
}
