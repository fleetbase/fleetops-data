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
     * Normalize single response - called after save/create
     * Directly set rate_fees relationship to only saved records from backend
     */
    normalizeSaveResponse(store, primaryModelClass, payload, id, requestType) {
        const normalized = super.normalizeSaveResponse(store, primaryModelClass, payload, id, requestType);
        
        // After normalization, replace rate_fees with only the saved records from backend
        if (normalized.data && normalized.data.type === 'service-rate') {
            const serviceRateId = normalized.data.id;
            const rateFeeIds = normalized.data.relationships?.rate_fees?.data || [];
            
            // Schedule after store update
            setTimeout(() => {
                const serviceRate = store.peekRecord('service-rate', serviceRateId);
                if (serviceRate && serviceRate.isFixedRate && rateFeeIds.length > 0) {
                    // Get the saved rate_fees from the store
                    const savedFees = rateFeeIds.map(ref => store.peekRecord('service-rate-fee', ref.id)).filter(Boolean);
                    
                    // Directly set the relationship to only the saved records
                    serviceRate.set('rate_fees', savedFees);
                }
            }, 0);
        }
        
        return normalized;
    }
}
