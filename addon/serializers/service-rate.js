import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class ServiceRateSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            order_config: { embedded: 'always' },
            zone: { embedded: 'always' },
            service_area: { embedded: 'always' },
            parcel_fees: { embedded: 'always' },
            rate_fees: { embedded: 'always' },
        };
    }

    /**
     * After pushing the payload to the store, clean up any duplicate unsaved records.
     * This runs after normalization and store.push().
     */
    pushPayload(store, payload) {
        // Call parent to push the payload
        super.pushPayload(store, payload);
        
        // Clean up duplicates for service-rate records
        if (payload.service_rate || payload.data?.type === 'service-rate') {
            const serviceRateId = payload.service_rate?.id || payload.data?.id;
            if (serviceRateId) {
                const serviceRate = store.peekRecord('service-rate', serviceRateId);
                if (serviceRate && serviceRate.isFixedRate) {
                    this._cleanupDuplicateRateFees(serviceRate);
                }
            }
        }
    }

    /**
     * Normalize single response - called after save/create
     */
    normalizeSaveResponse(store, primaryModelClass, payload, id, requestType) {
        const normalized = super.normalizeSaveResponse(store, primaryModelClass, payload, id, requestType);
        
        // After normalization, schedule cleanup of duplicate rate_fees
        if (normalized.data && normalized.data.type === 'service-rate') {
            const serviceRateId = normalized.data.id;
            // Schedule cleanup after the store has been updated
            setTimeout(() => {
                const serviceRate = store.peekRecord('service-rate', serviceRateId);
                if (serviceRate && serviceRate.isFixedRate) {
                    this._cleanupDuplicateRateFees(serviceRate);
                }
            }, 0);
        }
        
        return normalized;
    }

    /**
     * Clean up duplicate unsaved rate_fees records
     */
    _cleanupDuplicateRateFees(serviceRate) {
        const existing = serviceRate.rate_fees.toArray();
        const saved = existing.filter(f => !f.isNew);
        const unsaved = existing.filter(f => f.isNew);
        
        if (unsaved.length === 0) return;
        
        const savedByDistance = new Map(saved.map(f => [f.distance, f]));
        
        unsaved.forEach(fee => {
            if (savedByDistance.has(fee.distance)) {
                serviceRate.rate_fees.removeObject(fee);
                fee.unloadRecord();
            }
        });
    }
}
