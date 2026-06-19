import AttachableModel from './attachable';
import { attr } from '@ember-data/model';

/**
 * Concrete polymorphic model for an Asset attached to a device.
 */
export default class AttachableAssetModel extends AttachableModel {
    /** @ids */
    @attr('string') category_uuid;
    @attr('string') vendor_uuid;
    @attr('string') warranty_uuid;
    @attr('string') telematic_uuid;
    @attr('string') current_place_uuid;
    @attr('string') photo_uuid;

    /** @attributes */
    @attr('string') description;
    @attr('string') code;
    @attr('string') category_name;
    @attr('string') vendor_name;
    @attr('string') warranty_name;
    @attr('string') current_location;
    @attr('string') usage_type;
    @attr('string') vin;
    @attr('string') plate_number;
    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') color;
    @attr('string') serial_number;
    @attr('string') measurement_system;
    @attr('string') odometer;
    @attr('string') odometer_unit;
    @attr('string') notes;
    @attr('raw') capacity;
    @attr('raw') specs;
    @attr('raw') attributes;
}
