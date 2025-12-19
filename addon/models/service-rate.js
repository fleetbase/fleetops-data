import Model, { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import { computed, action } from '@ember/object';
import { getOwner } from '@ember/application';
import { format as formatDate, formatDistanceToNow } from 'date-fns';

export default class ServiceRate extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') service_area_uuid;
    @attr('string') zone_uuid;
    @attr('string') order_config_uuid;

    /** @relationships */
    @hasMany('service-rate-fee') rate_fees;
    @hasMany('service-rate-parcel-fee') parcel_fees;
    @belongsTo('service-area') service_area;
    @belongsTo('order-config') order_config;
    @belongsTo('zone') zone;
    @hasMany('custom-field-value', { async: false }) custom_field_values;



    /** @attributes */
    @attr('string') service_area_name;
    @attr('string') zone_name;
    @attr('string') service_name;
    @attr('string') service_type;
    @attr('string') base_fee;
    @attr('string') per_meter_flat_rate_fee;
    @attr('string') per_meter_unit;
    @attr('string', { defaultValue: 'km' }) max_distance_unit;
    @attr('number', { defaultValue: 1 }) max_distance;
    @attr('string') algorithm;
    @attr('string') rate_calculation_method;
    @attr('string') cod_calculation_method;
    @attr('string') cod_flat_fee;
    @attr('string') cod_percent;
    @attr('string') peak_hours_calculation_method;
    @attr('string') peak_hours_flat_fee;
    @attr('string') peak_hours_percent;
    @attr('string') peak_hours_start;
    @attr('string') peak_hours_end;
    @attr('string') currency;
    @attr('string') duration_terms;
    @attr('string') estimated_days;
    @attr('boolean') has_cod_fee;
    @attr('boolean') has_peak_hours_fee;
    @attr('raw') meta;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('updated_at') get updatedAgo() {
        return formatDistanceToNow(this.updated_at);
    }

    @computed('updated_at') get updatedAt() {
        return formatDate(this.updated_at, 'yyyy-MM-dd HH:mm');
    }

    @computed('updated_at') get updatedAtShort() {
        return formatDate(this.updated_at, 'dd, MMM');
    }

    @computed('created_at') get createdAgo() {
        return formatDistanceToNow(this.created_at);
    }

    @computed('created_at') get createdAt() {
        return this.created_at ? formatDate(this.created_at, 'yyyy-MM-dd HH:mm') : null;
    }

    @computed('created_at') get createdAtShort() {
        return this.created_at ? formatDate(this.created_at, 'dd, MMM') : null;
    }

    @computed('rate_calculation_method') get isFixedMeter() {
        return this.rate_calculation_method === 'fixed_meter' || this.rate_calculation_method === 'fixed_rate';
    }

    @computed('rate_calculation_method') get isFixedRate() {
        return this.rate_calculation_method === 'fixed_meter' || this.rate_calculation_method === 'fixed_rate';
    }

    @computed('rate_calculation_method') get isPerMeter() {
        return this.rate_calculation_method === 'per_meter';
    }

    @computed('rate_calculation_method') get isPerDrop() {
        return this.rate_calculation_method === 'per_drop';
    }

    @computed('rate_calculation_method') get isAlgorithm() {
        return this.rate_calculation_method === 'algo';
    }

    @computed('rate_calculation_method') get isParcelService() {
        return this.rate_calculation_method === 'parcel';
    }

    @computed('peak_hours_calculation_method') get hasPeakHoursFlatFee() {
        return this.peak_hours_calculation_method === 'flat';
    }

    @computed('peak_hours_calculation_method') get hasPeakHoursPercentageFee() {
        return this.peak_hours_calculation_method === 'percentage';
    }

    @computed('cod_calculation_method') get hasCodFlatFee() {
        return this.cod_calculation_method === 'flat';
    }

    @computed('cod_calculation_method') get hasCodPercentageFee() {
        return this.cod_calculation_method === 'percentage';
    }

    @computed('rate_fees.[]', 'rate_fees.@each.distance', 'max_distance') get rateFees() {
        const n = Math.max(0, Number(this.max_distance) || 0);
        const existing = (this.rate_fees?.toArray?.() ?? [])
            .filter(r => r.distance !== null && r.distance !== undefined && !r.isDeleted);
        
        // Return existing fees sorted by distance, filtered by max_distance
        return existing
            .filter(r => r.distance >= 0 && r.distance < n)
            .sort((a, b) => a.distance - b.distance);
    }

    /** @methods */
    @action generateFixedRateFees() {
        if (!this.isFixedRate) return;
        
        const store = getOwner(this).lookup('service:store');
        const unit = this.max_distance_unit;
        const currency = this.currency;
        const n = Math.max(0, Number(this.max_distance) || 0);
        
        // Get existing fees that have been saved (have IDs)
        const existing = (this.rate_fees?.toArray?.() ?? []).slice();
        const savedFees = existing.filter(r => !r.isNew);
        const byDistance = new Map(savedFees.map((r) => [r.distance, r]));
        
        // Remove unsaved fees (local duplicates)
        existing.forEach(fee => {
            if (fee.isNew) {
                this.rate_fees.removeObject(fee);
                fee.unloadRecord();
            }
        });
        
        // Remove fees beyond max_distance
        savedFees.forEach(fee => {
            if (fee.distance >= n) {
                this.rate_fees.removeObject(fee);
                if (!fee.isNew) {
                    fee.deleteRecord();
                }
            }
        });
        
        // Create missing fees
        for (let d = 0; d < n; d++) {
            let rec = byDistance.get(d);
            if (!rec) {
                rec = store.createRecord('service-rate-fee', {
                    distance: d,
                    distance_unit: unit,
                    fee: 0,
                    currency,
                });
                this.rate_fees.addObject(rec);
            } else {
                // Update existing record properties
                rec.setProperties({ distance_unit: unit, currency });
            }
        }
    }
    
    @action syncServiceRateFees() {
        this.generateFixedRateFees();
    }



    @action createDefaultPerDropFee(attributes = {}) {
        const store = getOwner(this).lookup('service:store');
        return store.createRecord('service-rate-fee', {
            min: 1,
            max: 5,
            fee: 0,
            unit: 'waypoint',
            currency: this.currency,
            ...attributes,
        });
    }

    @action addPerDropRateFee() {
        const store = getOwner(this).lookup('service:store');
        const existingFees = this.rate_fees?.toArray?.() ?? [];
        const last = existingFees[existingFees.length - 1];
        const min = last ? last.max + 1 : 1;
        const max = min + 5;

        const newFee = store.createRecord('service-rate-fee', {
            min: min,
            max: max,
            unit: 'waypoint',
            fee: 0,
            currency: this.currency,
        });

        this.rate_fees.addObject(newFee);
    }

    @action removePerDropFee(fee) {
        if (!fee || !fee.destroyRecord) return;
        this.rate_fees.removeObject(fee);
        fee.destroyRecord();
    }

    @action resetPerDropFees() {
        // Remove all existing per-drop fees
        const existingFees = this.rate_fees?.toArray?.() ?? [];
        existingFees.forEach(fee => {
            if (fee.unit === 'waypoint') {
                this.rate_fees.removeObject(fee);
                fee.destroyRecord();
            }
        });
        
        // Add a new default per-drop fee
        const defaultFee = this.createDefaultPerDropFee();
        this.rate_fees.addObject(defaultFee);
    }
}
