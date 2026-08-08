/**
 * Shared assertions for the structural contracts that Fleet-Ops models share.
 *
 * These helpers exist because ~59 models declare the same shapes — Ember Data
 * attribute transforms, relationship options, `date-fns` formatting getters and
 * GeoJSON point accessors. Asserting those inline in every model test would bury
 * the model-specific behaviour that actually differs. Every helper reports the
 * model and field it is checking so a failure names the exact contract that
 * broke.
 *
 * Helpers here never re-implement production logic: expected values are written
 * as literals so a regression in the production formatter is caught rather than
 * mirrored.
 */

/**
 * A fixed local-time instant used by every formatted-date assertion.
 *
 * Constructed from local calendar parts (not an ISO string) so `date-fns`
 * formats it identically in every timezone the suite might run in.
 *
 * 2024-03-14 09:05:00 local time.
 */
export const FIXED_DATE = new Date(2024, 2, 14, 9, 5, 0, 0);

/** `FIXED_DATE` rendered as `yyyy-MM-dd HH:mm`. */
export const FIXED_DATE_LONG = '2024-03-14 09:05';

/** `FIXED_DATE` rendered as `dd, MMM`. */
export const FIXED_DATE_SHORT = '14, Mar';

/** `FIXED_DATE` rendered as `PP HH:mm`. */
export const FIXED_DATE_PP = 'Mar 14, 2024 09:05';

/** `FIXED_DATE` rendered as `dd, MMM yyyy`. */
export const FIXED_DATE_SHORT_YEAR = '14, Mar 2024';

/** `FIXED_DATE` rendered as `HH:mm`. */
export const FIXED_DATE_TIME = '09:05';

/** `FIXED_DATE` rendered as `PPP`. */
export const FIXED_DATE_PPP = 'March 14th, 2024';

/** `FIXED_DATE` rendered as `PP`. */
export const FIXED_DATE_PP_ONLY = 'Mar 14, 2024';

/** `FIXED_DATE` rendered as `dd MMM yyyy`. */
export const FIXED_DATE_DAY_MONTH_YEAR = '14 Mar 2024';

/** `FIXED_DATE` rendered as `d MMM yyyy HH:mm`. */
export const FIXED_DATE_DAY_MONTH_YEAR_TIME = '14 Mar 2024 09:05';

/**
 * An instant exactly three days before now.
 *
 * `formatDistanceToNow` is relative to the clock, so a literal expectation is
 * only stable if the input is expressed relative to the clock too. Three days
 * is far enough from the rounding boundaries that a slow test run — or a DST
 * shift — cannot change the rendered phrase.
 */
export function threeDaysAgo() {
    return new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
}

/** `threeDaysAgo()` rendered by `formatDistanceToNow`. */
export const THREE_DAYS_DISTANCE = '3 days';

/** `threeDaysAgo()` rendered by `formatDistanceToNow` with `addSuffix`. */
export const THREE_DAYS_DISTANCE_SUFFIXED = '3 days ago';

/** Values that must never be formatted into a date string. */
export const INVALID_DATE_INPUTS = [
    ['null', null],
    ['undefined', undefined],
    ['an unparseable Date', new Date('not-a-date')],
];

/**
 * Assert that a model declares the expected Ember Data transform for each
 * attribute.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 * @param {Object} expected map of attribute name to transform type
 */
export function assertAttributeTypes(assert, store, modelName, expected) {
    const attributes = store.modelFor(modelName).attributes;

    for (const [name, type] of Object.entries(expected)) {
        const meta = attributes.get(name);

        assert.ok(meta, `${modelName} declares a \`${name}\` attribute`);
        assert.strictEqual(meta && meta.type, type, `${modelName}.${name} is an @attr('${type}')`);
    }
}

/**
 * Assert that a model declares a relationship with the expected target and
 * options.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 * @param {String} key relationship name
 * @param {Object} expected
 * @param {String} expected.kind `belongsTo` or `hasMany`
 * @param {String} expected.type target model name
 * @param {Boolean} [expected.async]
 * @param {Boolean} [expected.polymorphic]
 * @param {String|null} [expected.inverse]
 */
export function assertRelationship(assert, store, modelName, key, expected) {
    const relationship = store.modelFor(modelName).relationshipsByName.get(key);

    assert.ok(relationship, `${modelName} declares a \`${key}\` relationship`);

    if (!relationship) {
        return;
    }

    assert.strictEqual(relationship.kind, expected.kind, `${modelName}.${key} is a ${expected.kind}`);
    assert.strictEqual(relationship.type, expected.type, `${modelName}.${key} targets the ${expected.type} model`);

    if ('async' in expected) {
        assert.strictEqual(relationship.options.async, expected.async, `${modelName}.${key} async is ${expected.async}`);
    }

    if ('polymorphic' in expected) {
        assert.strictEqual(Boolean(relationship.options.polymorphic), expected.polymorphic, `${modelName}.${key} polymorphic is ${expected.polymorphic}`);
    }

    if ('inverse' in expected) {
        assert.strictEqual(relationship.options.inverse, expected.inverse, `${modelName}.${key} inverse is ${String(expected.inverse)}`);
    }
}

/**
 * Assert a batch of relationships in one call.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 * @param {Object} expected map of relationship name to the shape
 *                 {@link assertRelationship} accepts
 */
export function assertRelationships(assert, store, modelName, expected) {
    for (const [key, shape] of Object.entries(expected)) {
        assertRelationship(assert, store, modelName, key, shape);
    }
}

/**
 * Assert that a model's default attribute values are applied to a new record.
 *
 * @param {Assert} assert
 * @param {Model} record
 * @param {Object} expected map of attribute name to default value
 */
export function assertDefaults(assert, record, expected) {
    for (const [name, value] of Object.entries(expected)) {
        assert.strictEqual(record[name], value, `a new ${record.constructor.modelName} defaults \`${name}\` to ${JSON.stringify(value)}`);
    }
}

/**
 * Assert the full contract of a `date-fns` formatting getter trio.
 *
 * Covers both sides of the `isValidDate` guard every one of these getters has:
 * a real date renders the documented format, and null/undefined/Invalid Date
 * all render `null` rather than the string `"Invalid Date"`.
 *
 * @param {Assert} assert
 * @param {Model} record
 * @param {String} attribute the date attribute the getters read
 * @param {Object} formatted map of getter name to the expected string for
 *                 `FIXED_DATE`
 * @param {Object} [distance] map of getter name to the expected string for
 *                 `threeDaysAgo()`
 * @param {Object} [options]
 * @param {Boolean} [options.guarded] whether the getters check `isValidDate`
 *                  before formatting. A handful of models omit that guard, and
 *                  their getters throw on a missing date rather than returning
 *                  null; passing `false` asserts only the happy path so the test
 *                  documents real behaviour instead of an aspiration.
 */
export function assertDateGetters(assert, record, attribute, formatted, distance = {}, { guarded = true } = {}) {
    const label = record.constructor.modelName;

    record.set(attribute, FIXED_DATE);
    for (const [getter, expected] of Object.entries(formatted)) {
        assert.strictEqual(record[getter], expected, `${label}.${getter} formats ${attribute}`);
    }

    record.set(attribute, threeDaysAgo());
    for (const [getter, expected] of Object.entries(distance)) {
        assert.strictEqual(record[getter], expected, `${label}.${getter} describes the distance from ${attribute} to now`);
    }

    if (!guarded) {
        return;
    }

    const names = [...Object.keys(formatted), ...Object.keys(distance)];
    for (const [description, value] of INVALID_DATE_INPUTS) {
        record.set(attribute, value);
        for (const getter of names) {
            assert.strictEqual(record[getter], null, `${label}.${getter} is null when ${attribute} is ${description}`);
        }
    }
}

/**
 * The standard `created_at`/`updated_at` getter trio shared by most models.
 *
 * @param {Assert} assert
 * @param {Model} record
 * @param {String} attribute
 * @param {String} prefix getter prefix, e.g. `created` for `createdAt`
 * @param {Object} [options]
 * @param {String} [options.longFormat] expected `<prefix>At` output
 */
export function assertStandardDateGetters(assert, record, attribute, prefix, { longFormat = FIXED_DATE_LONG } = {}) {
    assertDateGetters(
        assert,
        record,
        attribute,
        {
            [`${prefix}At`]: longFormat,
            [`${prefix}AtShort`]: FIXED_DATE_SHORT,
        },
        {
            [`${prefix}Ago`]: THREE_DAYS_DISTANCE,
        }
    );
}

/**
 * Assert the GeoJSON point accessors shared by place, driver and vehicle.
 *
 * @param {Assert} assert
 * @param {Model} record
 * @param {Object} [options]
 * @param {String} [options.attribute] the `point` attribute name
 */
export function assertPointAccessors(assert, record, { attribute = 'location' } = {}) {
    const label = record.constructor.modelName;

    record.set(attribute, { type: 'Point', coordinates: [103.8198, 1.3521] });

    assert.strictEqual(record.longitude, 103.8198, `${label}.longitude reads coordinates[0]`);
    assert.strictEqual(record.latitude, 1.3521, `${label}.latitude reads coordinates[1]`);
    assert.deepEqual(record.coordinates, [1.3521, 103.8198], `${label}.coordinates is [latitude, longitude]`);
    assert.strictEqual(record.positionString, '1.3521 103.8198', `${label}.positionString is "latitude longitude"`);
    assert.deepEqual(record.latlng, { lat: 1.3521, lng: 103.8198 }, `${label}.latlng is a Leaflet-style pair`);
    assert.deepEqual(record.latitudelongitude, { latitude: 1.3521, longitude: 103.8198 }, `${label}.latitudelongitude is a long-form pair`);
    assert.true(record.hasValidCoordinates, `${label} accepts in-range coordinates`);
    assert.false(record.hasInvalidCoordinates, `${label}.hasInvalidCoordinates is the inverse`);

    record.set(attribute, { type: 'Point', coordinates: [0, 0] });
    assert.false(record.hasValidCoordinates, `${label} rejects null island`);
    assert.true(record.hasInvalidCoordinates, `${label}.hasInvalidCoordinates flags null island`);

    record.set(attribute, { type: 'Point', coordinates: [103.8198, 0] });
    assert.false(record.hasValidCoordinates, `${label} rejects a zero latitude`);

    record.set(attribute, { type: 'Point', coordinates: [0, 1.3521] });
    assert.false(record.hasValidCoordinates, `${label} rejects a zero longitude`);

    record.set(attribute, { type: 'Point', coordinates: [200, 100] });
    assert.false(record.hasValidCoordinates, `${label} rejects out-of-range coordinates`);
    assert.true(record.hasInvalidCoordinates, `${label}.hasInvalidCoordinates flags out-of-range coordinates`);

    record.set(attribute, { type: 'Point', coordinates: [180, 90] });
    assert.true(record.hasValidCoordinates, `${label} accepts the coordinate extremes`);
}

/**
 * Assert the contract of the promise-based `load<Relation>()` helpers that
 * fuel-report, issue, driver and vehicle all share.
 *
 * Each one fetches the related record when the model carries its identifier,
 * assigns it, and resolves; otherwise it resolves with whatever is already in
 * hand. A rejected fetch propagates rather than being swallowed.
 *
 * @param {Assert} assert
 * @param {Object} options
 * @param {Store} options.store
 * @param {Function} options.build returns a fresh record under test
 * @param {String} options.method the loader method name
 * @param {String} options.relationship the relationship it populates
 * @param {String} options.idAttribute the identifier attribute it reads
 * @param {String} options.modelName the related model name
 */
export async function assertRelationLoader(assert, { store, build, method, relationship, idAttribute, modelName }) {
    const calls = [];
    const related = store.push(store.normalize(modelName, { uuid: 'related_1' }));
    const originalFindRecord = store.findRecord;

    store.findRecord = function (...args) {
        calls.push(args);
        return Promise.resolve(related);
    };

    try {
        const record = build();
        record.set(idAttribute, 'related_1');

        const loaded = await record[method]();

        // Reference comparisons use assert.true so a failure does not make QUnit
        // walk an Ember Data record and trip its computed properties.
        assert.true(loaded === related, `${method} resolves with the fetched record`);
        assert.strictEqual(record.belongsTo(relationship).id(), 'related_1', `${method} assigns ${relationship}`);
        assert.deepEqual(calls[0], [modelName, 'related_1'], `${method} fetches the ${modelName} named by ${idAttribute}`);

        const withoutId = build();
        calls.length = 0;

        assert.notOk(await withoutId[method](), `${method} resolves with the empty relationship when there is no identifier`);
        assert.deepEqual(calls, [], `${method} makes no request without an identifier`);

        store.findRecord = () => Promise.reject(new Error('network down'));

        const failing = build();
        failing.set(idAttribute, 'related_1');

        await assert.rejects(failing[method](), /network down/, `${method} propagates a failed fetch rather than swallowing it`);
    } finally {
        store.findRecord = originalFindRecord;
    }
}
