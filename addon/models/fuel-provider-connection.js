import Model, { attr, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';

export default class FuelProviderConnectionModel extends Model {
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') provider;
    @attr('string') name;
    @attr('string', { defaultValue: 'production' }) environment;
    @attr('string', { defaultValue: 'configured' }) status;
    @attr('raw') sync_settings;
    @attr('raw') last_sync_state;
    @attr('string') last_error;
    @attr('raw') meta;

    @hasMany('fuel-provider-transaction') transactions;

    @attr('date') last_synced_at;
    @attr('date') last_tested_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    @computed('provider', 'name') get displayName() {
        return this.name || this.provider;
    }

    @computed('last_synced_at') get lastSyncedAt() {
        return this.formatDate(this.last_synced_at);
    }

    @computed('last_tested_at') get lastTestedAt() {
        return this.formatDate(this.last_tested_at);
    }

    @computed('updated_at') get updatedAgo() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }

        return formatDistanceToNow(this.updated_at);
    }

    formatDate(value) {
        if (!isValidDate(value)) {
            return null;
        }

        return formatDate(value, 'yyyy-MM-dd HH:mm');
    }
}
