import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { next } from '@ember/runloop';

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
     * Normalize single response - called after save/create
     * Directly set rate_fees relationship to only saved records from backend
     */
    normalizeSaveResponse(store, primaryModelClass, payload, id, requestType) {
        const normalized = super.normalizeSaveResponse(store, primaryModelClass, payload, id, requestType);
        
        // After normalization, replace rate_fees with only the saved records from backend
        if (normalized.data && normalized.data.type === 'service-rate') {
            const serviceRateId = normalized.data.id;
            const rateFeeIds = normalized.data.relationships?.rate_fees?.data || [];
            
            // Schedule after store update using Ember run loop
            next(() => {
                const serviceRate = store.peekRecord('service-rate', serviceRateId);
                if (serviceRate && serviceRate.isFixedRate) {
                    // Get all rate_fees
                    const allFees = serviceRate.get('rate_fees').toArray();
                    const savedFees = allFees.filter(f => !f.isNew);
                    const unsavedFees = allFees.filter(f => f.isNew);
                    
                    // Create a map of saved fees by distance
                    const savedByDistance = new Map(savedFees.map(f => [f.distance, f]));
                    
                    // Only remove unsaved fees that duplicate saved fees
                    unsavedFees.forEach(fee => {
                        if (savedByDistance.has(fee.distance)) {
                            serviceRate.get('rate_fees').removeObject(fee);
                            fee.unloadRecord();
                        }
                    });
                }
            });
        }
        
        return normalized;
    }
}
