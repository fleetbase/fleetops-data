import FacilitatorModel from './facilitator';
import { attr } from '@ember-data/model';
import { computed, get } from '@ember/object';
import config from 'ember-get-config';

export default class FacilitatorDriverModel extends FacilitatorModel {
    /** @ids */
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') user_uuid;
    @attr('string') vehicle_uuid;
    @attr('string') vendor_uuid;
    @attr('string') current_job_uuid;
    @attr('string') photo_uuid;
    @attr('string') vehicle_id;
    @attr('string') vendor_id;
    @attr('string') current_job_id;
    @attr('string') internal_id;

    /** @attributes */
    @attr('string') name;
    @attr('string') phone;
    @attr('string') email;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.driverImage'),
    })
    photo_url;
    @attr('string') vehicle_name;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    vehicle_avatar;
    @attr('string') vendor_name;
    @attr('string') drivers_license_number;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.driverAvatar'),
    })
    avatar_url;
    @attr('string') avatar_value;
    @attr('point') location;
    @attr('number') heading;
    @attr('string') country;
    @attr('string') city;
    @attr('string', { defaultValue: 'available' }) status;
    @attr('boolean') online;
    @attr('raw') meta;

    /** @dates */
    @attr('date') license_expiry;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('photo_url') get photoUrl() {
        if (!this.photo_url) {
            return get(config, 'defaultValues.driverImage');
        }

        return this.photo_url;
    }

    @computed('name', 'public_id') get displayName() {
        if (!this.name) {
            return this.public_id;
        }

        return this.name;
    }
}
