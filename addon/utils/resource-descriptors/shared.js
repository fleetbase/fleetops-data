import { get } from '@ember/object';
import { first, present, relation, photo, icon, badge, badges, fact, relatedFact, join, dateLabel, typeLabel, polymorphicType, engineOpener, engineInstalled } from './helpers';

/**
 * The resources every Fleetbase extension can see through this package's
 * models: drivers, vehicles, customers, contacts, places, orders, vendors and
 * fleets. A descriptor teaches the console's resource identity components
 * how to show one of them. Opening loads the FleetOps engine on demand, so a
 * Storefront or Ledger page that lists drivers never pays for FleetOps until
 * someone clicks one. FleetOps itself replaces these with its own openers
 * when it boots.
 */
export const SHARED_RESOURCE_KEYS = ['driver', 'vehicle', 'customer', 'contact', 'place', 'order', 'vendor', 'fleet'];

function onlineFlag(record) {
    const online = get(record, 'online');

    return typeof online === 'boolean' ? online : undefined;
}

export function buildSharedResourceDescriptors(owner) {
    const canOpen = () => engineInstalled(owner);

    return [
        {
            key: 'driver',
            labelKey: 'resource.driver',
            icon: 'id-card',
            modelNames: ['driver'],
            aliases: ['attachable-driver', 'facilitator-driver', 'fleet-driver'],
            polymorphicTypes: ['fleet-ops:driver', 'Fleetbase\\FleetOps\\Models\\Driver'],
            permission: 'fleet-ops view driver',
            statusTones: {
                available: 'text-green-500',
                active: 'text-green-500',
                on_duty: 'text-green-500',
                busy: 'text-yellow-500',
                assigned: 'text-yellow-500',
                unavailable: 'text-gray-400',
                offline: 'text-gray-400',
                suspended: 'text-red-500',
            },
            title: (driver) => first(driver, 'name', 'displayName', 'display_name', 'public_id'),
            identifier: (driver) => first(driver, 'phone', 'email'),
            image: (driver) => photo(driver, 'driver'),
            online: onlineFlag,
            status: (driver) => first(driver, 'status'),
            badges: (driver) => {
                const vehicle = relation(owner, driver, 'vehicle');
                const label = first(vehicle, 'displayName', 'display_name', 'name') ?? first(driver, 'vehicle_assigned.display_name', 'vehicle_name');

                return badges(badge('vehicle', 'car', label, { relatedType: 'vehicle', relatedId: vehicle?.id ?? get(driver, 'vehicle_uuid') }));
            },
            selectDetails: (driver) => [first(driver, 'phone'), first(driver, 'email')],
            facts: (driver) => [
                fact('phone', first(driver, 'phone')),
                fact('email', first(driver, 'email')),
                relatedFact('vehicle', relation(owner, driver, 'vehicle'), 'vehicle', first(driver, 'vehicle_name')),
                fact(
                    'licence',
                    join(
                        [
                            first(driver, 'drivers_license_number'),
                            dateLabel(get(driver, 'license_expiry'), 'dd MMM yyyy') ? `expires ${dateLabel(get(driver, 'license_expiry'), 'dd MMM yyyy')}` : null,
                        ],
                        ' · '
                    )
                ),
                relatedFact('vendor', relation(owner, driver, 'vendor'), 'vendor', first(driver, 'vendor_name')),
                fact('status', first(driver, 'status'), { format: 'humanize' }),
            ],
            canOpen,
            open: engineOpener(owner, 'driver-actions'),
        },
        {
            key: 'vehicle',
            labelKey: 'resource.vehicle',
            icon: 'truck',
            modelNames: ['vehicle'],
            aliases: ['attachable-vehicle', 'maintenance-subject-vehicle'],
            polymorphicTypes: ['fleet-ops:vehicle', 'Fleetbase\\FleetOps\\Models\\Vehicle'],
            permission: 'fleet-ops view vehicle',
            statusTones: {
                available: 'text-green-500',
                active: 'text-green-500',
                in_service: 'text-green-500',
                maintenance: 'text-yellow-500',
                unavailable: 'text-gray-400',
                inactive: 'text-gray-400',
                out_of_service: 'text-red-500',
            },
            title: (vehicle) =>
                first(vehicle, 'displayName', 'display_name', 'name', 'yearMakeModel', 'public_id') ?? join([get(vehicle, 'year'), get(vehicle, 'make'), get(vehicle, 'model')]),
            identifier: (vehicle) => first(vehicle, 'plate_number', 'call_sign', 'vin', 'serial_number'),
            image: (vehicle) => photo(vehicle, 'vehicle'),
            online: onlineFlag,
            status: (vehicle) => first(vehicle, 'status'),
            badges: (vehicle) => {
                const driver = relation(owner, vehicle, 'driver');

                return badges(
                    badge('plate', 'id-card', first(vehicle, 'plate_number', 'call_sign', 'vehicle_number')),
                    badge('driver', 'user', first(driver, 'name', 'displayName') ?? first(vehicle, 'driver_name'), {
                        relatedType: 'driver',
                        relatedId: driver?.id ?? get(vehicle, 'driver_uuid'),
                    })
                );
            },
            selectDetails: (vehicle) => [first(vehicle, 'plate_number', 'vin', 'serial_number', 'call_sign'), first(vehicle, 'driver_name')],
            facts: (vehicle) => {
                const driver = relation(owner, vehicle, 'driver');
                const trailers = relation(owner, vehicle, 'trailers');
                const trailer = trailers ? (typeof trailers.objectAt === 'function' ? trailers.objectAt(0) : trailers[0]) : null;
                const extra = trailers?.length > 1 ? ` (+${trailers.length - 1})` : '';

                return [
                    fact('make-model', join([get(vehicle, 'year'), get(vehicle, 'make'), get(vehicle, 'model'), get(vehicle, 'trim')])),
                    fact('plate', join([first(vehicle, 'plate_number'), first(vehicle, 'vin')], ' · ')),
                    relatedFact('driver', driver, 'driver', first(vehicle, 'driver_name')),
                    trailer ? { ...relatedFact('trailer', trailer, 'trailer', first(trailer, 'displayName', 'display_name', 'name')), suffix: extra } : fact('trailer', null),
                    fact('odometer', present(get(vehicle, 'odometer')) ? join([get(vehicle, 'odometer'), get(vehicle, 'odometer_unit')]) : null),
                    fact('status', first(vehicle, 'status'), { format: 'humanize' }),
                ];
            },
            canOpen,
            open: engineOpener(owner, 'vehicle-actions'),
        },
        {
            key: 'customer',
            labelKey: 'resource.customer',
            icon: 'user-tag',
            modelNames: ['customer'],
            aliases: ['facilitator-customer'],
            polymorphicTypes: ['fleet-ops:customer', 'Fleetbase\\FleetOps\\Models\\Customer'],
            permission: 'fleet-ops view contact',
            title: (customer) => first(customer, 'name', 'public_id'),
            identifier: (customer) => typeLabel(first(customer, 'customer_type', 'type')) ?? 'Customer',
            image: (customer) => photo(customer, 'customer'),
            selectDetails: (customer) => [first(customer, 'email'), first(customer, 'phone')],
            facts: (customer) => [
                fact('type', typeLabel(first(customer, 'customer_type', 'type'))),
                fact('email', first(customer, 'email')),
                fact('phone', first(customer, 'phone')),
                fact('address', first(customer, 'address', 'address_street')),
                relatedFact('place', relation(owner, customer, 'place'), 'place', first(customer, 'place.address')),
            ],
            canOpen,
            open: engineOpener(owner, 'customer-actions'),
        },
        {
            key: 'contact',
            labelKey: 'resource.contact',
            icon: 'address-book',
            modelNames: ['contact'],
            aliases: ['facilitator-contact', 'customer-contact'],
            polymorphicTypes: ['fleet-ops:contact', 'Fleetbase\\FleetOps\\Models\\Contact'],
            permission: 'fleet-ops view contact',
            title: (contact) => first(contact, 'name', 'public_id'),
            identifier: (contact) => first(contact, 'title') ?? typeLabel(first(contact, 'type')),
            image: (contact) => photo(contact, 'contact'),
            selectDetails: (contact) => [first(contact, 'email'), first(contact, 'phone')],
            facts: (contact) => [
                fact('title', first(contact, 'title')),
                fact('email', first(contact, 'email')),
                fact('phone', first(contact, 'phone')),
                relatedFact('place', relation(owner, contact, 'place'), 'place', first(contact, 'address', 'place.address')),
                relatedFact('user', relation(owner, contact, 'user'), 'user', first(contact, 'user.name')),
            ],
            canOpen,
            open: engineOpener(owner, 'contact-actions'),
        },
        {
            key: 'place',
            labelKey: 'resource.place',
            icon: 'location-dot',
            modelNames: ['place'],
            polymorphicTypes: ['fleet-ops:place', 'Fleetbase\\FleetOps\\Models\\Place'],
            permission: 'fleet-ops view place',
            title: (place) => first(place, 'displayName', 'name', 'address', 'street1', 'public_id'),
            identifier: (place) => join([first(place, 'city'), first(place, 'country')], ', ') ?? first(place, 'public_id'),
            image: () => icon('location-dot'),
            selectDetails: (place) => [first(place, 'address', 'street1'), join([first(place, 'city'), first(place, 'country')], ', ')],
            facts: (place) => [
                fact('address', first(place, 'address', 'street1')),
                fact('phone', first(place, 'phone')),
                fact('type', first(place, 'type'), { format: 'humanize' }),
                relatedFact('vendor', relation(owner, place, 'vendor'), 'vendor', first(place, 'vendor_name')),
                fact('coordinates', first(place, 'positionString') ?? (present(get(place, 'latitude')) ? `${get(place, 'latitude')}, ${get(place, 'longitude')}` : null)),
            ],
            canOpen,
            open: engineOpener(owner, 'place-actions'),
        },
        {
            key: 'order',
            labelKey: 'resource.order',
            icon: 'box',
            modelNames: ['order'],
            polymorphicTypes: ['fleet-ops:order', 'Fleetbase\\FleetOps\\Models\\Order'],
            permission: 'fleet-ops view order',
            statusTones: {
                created: 'text-gray-400',
                preparing: 'text-yellow-500',
                dispatched: 'text-yellow-500',
                started: 'text-yellow-500',
                in_progress: 'text-yellow-500',
                enroute: 'text-yellow-500',
                completed: 'text-green-500',
                delivered: 'text-green-500',
                canceled: 'text-red-500',
                cancelled: 'text-red-500',
                failed: 'text-red-500',
            },
            title: (order) => first(order, 'tracking', 'tracking_number.tracking_number', 'public_id'),
            identifier: (order) => first(order, 'public_id', 'internal_id'),
            image: () => icon('box'),
            status: (order) => first(order, 'status'),
            selectDetails: (order) => [first(order, 'public_id'), first(order, 'status')],
            facts: (order) => [
                fact('status', first(order, 'status'), { format: 'humanize' }),
                relatedFact('customer', relation(owner, order, 'customer'), polymorphicType(order, 'customer', 'customer_type'), first(order, 'customer_name')),
                relatedFact('driver', relation(owner, order, 'driver_assigned'), 'driver', first(order, 'driver_name')),
                fact('route', join([first(order, 'pickupName', 'pickup_name'), first(order, 'dropoffName', 'dropoff_name')], ' → ')),
                fact('scheduled', get(order, 'scheduled_at'), { format: 'date' }),
                fact('order-config', first(order, 'order_config.name', 'type')),
            ],
            canOpen,
            open: guardOrder(engineOpener(owner, 'order-actions')),
        },
        {
            key: 'vendor',
            labelKey: 'resource.vendor',
            icon: 'building',
            modelNames: ['vendor'],
            aliases: ['facilitator-vendor', 'customer-vendor'],
            polymorphicTypes: ['fleet-ops:vendor', 'Fleetbase\\FleetOps\\Models\\Vendor'],
            permission: 'fleet-ops view vendor',
            title: (vendor) => first(vendor, 'name', 'public_id'),
            identifier: (vendor) => first(vendor, 'prettyType', 'internal_id', 'business_id'),
            image: (vendor) => photo(vendor, 'vendor', 'logo_url'),
            status: (vendor) => first(vendor, 'status'),
            selectDetails: (vendor) => [first(vendor, 'email'), first(vendor, 'phone')],
            facts: (vendor) => [
                fact('type', first(vendor, 'prettyType', 'type'), { format: 'humanize' }),
                fact('email', first(vendor, 'email')),
                fact('phone', first(vendor, 'phone')),
                fact('website', first(vendor, 'website_url')),
                fact('address', first(vendor, 'address', 'place.address', 'address_street')),
                fact('country', first(vendor, 'country')),
            ],
            canOpen,
            open: engineOpener(owner, 'vendor-actions'),
        },
        {
            key: 'fleet',
            labelKey: 'resource.fleet',
            icon: 'layer-group',
            modelNames: ['fleet'],
            polymorphicTypes: ['fleet-ops:fleet', 'Fleetbase\\FleetOps\\Models\\Fleet'],
            permission: 'fleet-ops view fleet',
            title: (fleet) => first(fleet, 'name', 'public_id'),
            identifier: (fleet) => first(fleet, 'task', 'public_id'),
            image: (fleet) => photo(fleet, 'fleet'),
            status: (fleet) => first(fleet, 'status'),
            selectDetails: (fleet) => [first(fleet, 'task'), present(get(fleet, 'drivers_count')) ? `${get(fleet, 'drivers_count')} drivers` : null],
            facts: (fleet) => [
                fact('task', first(fleet, 'task')),
                relatedFact('service-area', relation(owner, fleet, 'service_area'), 'service-area', first(fleet, 'service_area.name')),
                relatedFact('zone', relation(owner, fleet, 'zone'), 'zone', first(fleet, 'zone.name')),
                relatedFact('vendor', relation(owner, fleet, 'vendor'), 'vendor', first(fleet, 'vendor.name')),
                fact('drivers', present(get(fleet, 'drivers_count')) ? `${get(fleet, 'drivers_online_count') ?? 0} online of ${get(fleet, 'drivers_count')}` : null),
                fact('vehicles', present(get(fleet, 'vehicles_count')) ? `${get(fleet, 'vehicles_online_count') ?? 0} online of ${get(fleet, 'vehicles_count')}` : null),
            ],
            canOpen,
            open: engineOpener(owner, 'fleet-actions'),
        },
    ].map((descriptor) => ({
        ...descriptor,
        components: { identity: `cell/${descriptor.key}-identity`, ...(descriptor.components ?? {}) },
    }));
}

/**
 * An order row may only know its order by name (an identity stub) and a
 * stub has nothing to open; a saved order must carry an id.
 */
export function guardOrder(open) {
    return (order, ...rest) => {
        if (!order || order.isIdentityStub || !first(order, 'id', 'uuid')) {
            return false;
        }

        return open(order, ...rest);
    };
}

export default buildSharedResourceDescriptors;
