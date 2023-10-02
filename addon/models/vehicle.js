import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { get, computed } from '@ember/object';
import { format as formatDate, isValid as isValidDate, formatDistanceToNow } from 'date-fns';
import { getOwner } from '@ember/application';
import isRelationMissing from '@fleetbase/ember-core/utils/is-relation-missing';
import config from 'ember-get-config';

export default class VehicleModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') photo_uuid;
    @attr('string') vendor_uuid;
    @attr('boolean') online;

    /** @relationships */
    @belongsTo('driver', { async: false }) driver;
    @belongsTo('vendor', { async: false }) vendor;
    @hasMany('vehicle-device', { async: false }) devices;

    /** @attributes */
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleImage'),
    })
    photo_url;
    @attr('string') driver_name;
    @attr('string') vendor_name;
    @attr('string') display_name;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    avatar_url;
    @attr('point') location;
    @attr('string') speed;
    @attr('string') heading;
    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') trim;
    @attr('string') type;
    @attr('string') plate_number;
    @attr('string') vin;
    @attr('raw') vin_data;
    @attr('raw') model;
    @attr('raw') telematics;
    @attr('raw') meta;
    @attr('string') status;
    @attr('string') slug;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('year', 'make', 'model', 'trim', 'plate_number', 'internal_id') get displayName() {
        const nameSegments = [this.year, this.make, this.model, this.trim, this.plate_number, this.internal_id];
        return nameSegments.filter(Boolean).join(' ').trim();
    }

    @computed('updated_at') get updatedAgo() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDistanceToNow(this.updated_at);
    }

    @computed('updated_at') get updatedAt() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDate(this.updated_at, 'PPP p');
    }

    @computed('updated_at') get updatedAtShort() {
        if (!isValidDate(this.updated_at)) {
            return null;
        }
        return formatDate(this.updated_at, 'PP');
    }

    @computed('created_at') get createdAgo() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDistanceToNow(this.created_at);
    }

    @computed('created_at') get createdAt() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDate(this.created_at, 'PPP p');
    }

    @computed('created_at') get createdAtShort() {
        if (!isValidDate(this.created_at)) {
            return null;
        }
        return formatDate(this.created_at, 'PP');
    }

    /** @methods */
    loadDriver() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        return new Promise((resolve) => {
            if (isRelationMissing(this, 'driver')) {
                return store
                    .findRecord('driver', this.driver_uuid)
                    .then((driver) => {
                        this.driver = driver;

                        resolve(driver);
                    })
                    .catch(() => {
                        resolve(null);
                    });
            }

            resolve(this.driver);
        });
    }
    loadDevices() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        return new Promise((resolve, reject) => {
            return store
                .findRecord('vehicle-device', { vehicle_uuid: this.id })
                .then((devices) => {
                    this.vehicle_devices = devices;

                    resolve(devices);
                })
                .catch(reject);
        });
    }
}
