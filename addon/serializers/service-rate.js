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
                if (serviceRate) {
                    // Cleanup rate_fees duplicates (for Fixed Rate and Per-Drop)
                    const allRateFees = serviceRate.get('rate_fees').toArray();
                    const savedRateFees = allRateFees.filter(f => !f.isNew);
                    const unsavedRateFees = allRateFees.filter(f => f.isNew);
                    
                    // Create a map of saved fees by distance
                    const savedByDistance = new Map(savedRateFees.map(f => [f.distance, f]));
                    
                    // Only remove unsaved fees that duplicate saved fees
                    unsavedRateFees.forEach(fee => {
                        if (savedByDistance.has(fee.distance)) {
                            serviceRate.get('rate_fees').removeObject(fee);
                            fee.unloadRecord();
                        }
                    });

                    // Cleanup parcel_fees duplicates
                    const allParcelFees = serviceRate.get('parcel_fees').toArray();
                    const savedParcelFees = allParcelFees.filter(f => !f.isNew);
                    const unsavedParcelFees = allParcelFees.filter(f => f.isNew);
                    
                    // Create a map of saved parcel fees by uuid (or another unique key)
                    const savedParcelByUuid = new Map(savedParcelFees.map(f => [f.get('id'), f]));
                    
                    // Remove unsaved parcel fees that have a saved version
                    unsavedParcelFees.forEach(fee => {
                        // For parcel fees, we need to check if there's a duplicate based on attributes
                        // Since they don't have a simple key like distance, we'll just remove all unsaved ones
                        // that don't have unique identifying attributes
                        const hasDuplicate = savedParcelFees.some(saved => 
                            saved.size === fee.size && 
                            saved.length === fee.length && 
                            saved.width === fee.width && 
                            saved.height === fee.height
                        );
                        
                        if (hasDuplicate) {
                            serviceRate.get('parcel_fees').removeObject(fee);
                            fee.unloadRecord();
                        }
                    });
                }
            });
        }
        
        return normalized;
    }
}
