import MaintenanceSubjectModel from './maintenance-subject';
import { attr } from '@ember-data/model';
import { get } from '@ember/object';
import config from 'ember-get-config';

/**
 * Concrete polymorphic model for a Vehicle acting as a maintenance subject.
 * Resolved when the backend sends subject_type / target_type / maintainable_type = 'fleet-ops:vehicle'.
 */
export default class MaintenanceSubjectVehicleModel extends MaintenanceSubjectModel {
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

    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') trim;
    @attr('string') plate_number;
    @attr('string') vin;
    @attr('string') driver_name;
    @attr('string') vendor_name;
    @attr('string') display_name;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    avatar_url;
    @attr('string') avatar_value;
    @attr('string') color;
    @attr('string') country;
    @attr('number') odometer;
    @attr('number') engine_hours;
    @attr('raw') meta;
}
