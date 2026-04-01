import MaintenanceSubjectModel from './maintenance-subject';
import { attr } from '@ember-data/model';

/**
 * Concrete polymorphic model for Equipment acting as a maintenance subject.
 * Resolved when the backend sends subject_type / target_type / maintainable_type = 'fleet-ops:equipment'.
 */
export default class MaintenanceSubjectEquipmentModel extends MaintenanceSubjectModel {
    /** @ids */
    @attr('string') warranty_uuid;
    @attr('string') photo_uuid;
    @attr('string') equipable_type;
    @attr('string') equipable_uuid;

    /** @attributes */
    @attr('string') code;
    @attr('string') serial_number;
    @attr('string') manufacturer;
    @attr('string') model;
    @attr('number') purchase_price;
    @attr('string') warranty_name;
    @attr('raw') meta;

    /** @dates */
    @attr('date') purchased_at;
}
