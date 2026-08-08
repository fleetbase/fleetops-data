'use strict';

module.exports = function (environment) {
    const ENV = {
        modulePrefix: 'dummy',
        environment,
        rootURL: '/',
        locationType: 'history',
        EmberENV: {
            // The Fleetbase console — the application this addon is built for —
            // enables Ember's array prototype extensions, and Fleet-Ops models
            // rely on them (`pushObjects` on plain arrays in payload getters,
            // `objectAt` in order meta serialization). The dummy application has
            // to match that runtime or the tests would exercise a configuration
            // no consumer actually runs.
            EXTEND_PROTOTYPES: true,
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
            },
        },

        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created
        },

        // `@fleetbase/ember-core`'s application adapter reads `config.API.host` at
        // module scope, so the dummy application must declare it before any
        // adapter module can even be evaluated. The values are deliberately
        // obviously-fake: nothing in the suite performs a real request.
        API: {
            host: 'https://api.fleetbase.test',
            namespace: 'int/v1',
        },

        // Several models derive `@attr` defaults from these at class-definition
        // time. Distinct sentinel values let the model tests assert that the
        // default is wired to configuration rather than hard-coded.
        defaultValues: {
            driverImage: 'https://fleetbase.test/images/driver.png',
            driverAvatar: 'https://fleetbase.test/images/driver-avatar.svg',
            vehicleImage: 'https://fleetbase.test/images/vehicle.png',
            vehicleAvatar: 'https://fleetbase.test/images/vehicle-avatar.svg',
            placeAvatar: 'https://fleetbase.test/images/place-avatar.svg',
            vendorImage: 'https://fleetbase.test/images/vendor.png',
        },
    };

    if (environment === 'development') {
        // ENV.APP.LOG_RESOLVER = true;
        // ENV.APP.LOG_ACTIVE_GENERATION = true;
        // ENV.APP.LOG_TRANSITIONS = true;
        // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
        // ENV.APP.LOG_VIEW_LOOKUPS = true;
    }

    if (environment === 'test') {
        // Testem prefers this...
        ENV.locationType = 'none';

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';
        ENV.APP.autoboot = false;
    }

    if (environment === 'production') {
        // here you can enable a production-specific feature
    }

    return ENV;
};
