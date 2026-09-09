import AttachableAssetModel from './attachable-asset';
import { attr } from '@ember-data/model';

/** Concrete polymorphic model for a Trailer attached to a device. */
export default class AttachableTrailerModel extends AttachableAssetModel {
    @attr('string') body_type;
    @attr('string') coupling_type;
    @attr('number') axle_count;
    @attr('boolean') refrigerated;
    @attr('string') current_vehicle_name;
}
