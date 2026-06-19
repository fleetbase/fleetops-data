import AttachableModel from './attachable';
import { attr } from '@ember-data/model';
import { get, computed } from '@ember/object';
import config from 'ember-get-config';

/**
 * Concrete polymorphic model for a Vehicle attached to a device.
 */
export default class AttachableVehicleModel extends AttachableModel {
    /** @ids */
    @attr('string') internal_id;
    @attr('string') photo_uuid;
    @attr('string') vendor_uuid;
    @attr('string') category_uuid;
    @attr('string') warranty_uuid;
    @attr('string') telematic_uuid;

    /** @attributes */
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleImage'),
    })
    photo_url;

    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    avatar_url;

    @attr('string') avatar_value;
    @attr('string') driver_name;
    @attr('string') vendor_name;
    @attr('string') make;
    @attr('string') model;
    @attr('string') model_type;
    @attr('string') year;
    @attr('string') trim;
    @attr('string') color;
    @attr('string') plate_number;
    @attr('string') call_sign;
    @attr('string') serial_number;
    @attr('string') vin;
    @attr('string') measurement_system;
    @attr('string') odometer;
    @attr('string') odometer_unit;
    @attr('number') engine_hours;

    @computed('year', 'make', 'model') get yearMakeModel() {
        return [this.year, this.make, this.model].filter(Boolean).join(' ');
    }
}
