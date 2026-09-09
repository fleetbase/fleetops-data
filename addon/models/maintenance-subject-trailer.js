import MaintenanceSubjectModel from './maintenance-subject';
import { attr } from '@ember-data/model';

/** Concrete polymorphic model for Trailer maintenance targets. */
export default class MaintenanceSubjectTrailerModel extends MaintenanceSubjectModel {
    @attr('string') code;
    @attr('string') vin;
    @attr('string') plate_number;
    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') body_type;
    @attr('number') axle_count;
    @attr('string') current_vehicle_name;
}
