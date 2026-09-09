import AttachableModel from './attachable';
import { attr } from '@ember-data/model';

/**
 * Concrete polymorphic model for a Driver that equipment is issued to.
 *
 * Drivers are not telematics attachables, but equipment can be equipped to a driver
 * (`fleet-ops:driver`), and the equipment serializer resolves that polymorphic
 * relationship through the attachable model family.
 */
export default class AttachableDriverModel extends AttachableModel {
    @attr('string') internal_id;
    @attr('string') phone;
    @attr('string') email;
    @attr('string') drivers_license_number;
    @attr('string') vehicle_name;
    @attr('string') vendor_name;
}
