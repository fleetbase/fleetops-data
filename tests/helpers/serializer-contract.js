/**
 * Shared assertions for the Fleet-Ops serializer wire contract.
 *
 * Nearly every serializer in this addon is an `ApplicationSerializer` mixed with
 * `EmbeddedRecordsMixin`, and its whole authored contract is the `attrs` map:
 * which relationships travel inline with the parent record, and which are sent
 * as bare identifiers. Getting that map wrong silently changes what the Fleetbase
 * API receives, so it is asserted exactly — an added or removed embed fails.
 *
 * Behaviour beyond the map (custom `serialize`, `normalize` and
 * `serializePolymorphicType` overrides) is tested in the serializer's own file.
 */

/** Every embedded relationship is declared with this configuration. */
export const EMBEDDED = { embedded: 'always' };

/**
 * Assert the serializer's `attrs` map matches the expected wire contract exactly.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 * @param {Object} expected the complete expected `attrs` map ({} for none)
 */
export function assertEmbeddedAttrs(assert, store, modelName, expected) {
    const attrs = store.serializerFor(modelName).attrs ?? {};

    assert.deepEqual(attrs, expected, `${modelName} declares exactly the expected relationship serialization contract`);
}

/**
 * Assert the serializer keys records by the Fleetbase `uuid` rather than `id`.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 */
export function assertPrimaryKeyIsUuid(assert, store, modelName) {
    assert.strictEqual(store.serializerFor(modelName).primaryKey, 'uuid', `${modelName} records are identified by uuid on the wire`);
}

/**
 * Assert a server payload keyed by `uuid` normalizes onto a record with that id.
 *
 * @param {Assert} assert
 * @param {Store} store
 * @param {String} modelName
 * @param {Object} [attributes] extra attributes to round-trip
 * @return {Model} the pushed record, for further assertions
 */
export function assertNormalizesUuidAsId(assert, store, modelName, attributes = {}) {
    const record = store.push(store.normalize(modelName, { uuid: `${modelName}_uuid_1`, ...attributes }));

    assert.strictEqual(record.id, `${modelName}_uuid_1`, `${modelName} takes its Ember Data id from the payload uuid`);

    return record;
}

/**
 * Assert that serializing a record emits `<relationship>_uuid` for a belongsTo.
 *
 * The application serializer adds these identifiers for every belongsTo, which is
 * how the Fleetbase API links records that are not sent embedded.
 *
 * @param {Assert} assert
 * @param {Object} json the serialized payload
 * @param {String} key relationship name
 * @param {String} expectedId
 */
export function assertRelationshipIdentifier(assert, json, key, expectedId) {
    assert.strictEqual(json[`${key}_uuid`], expectedId, `the payload links ${key} by uuid`);
}
