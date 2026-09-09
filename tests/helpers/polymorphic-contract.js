/**
 * Shared assertions for `serializePolymorphicType`.
 *
 * Six Fleet-Ops serializers implement the same hook: when the record does not
 * already carry an explicit `<key>_type`, derive one from the related record's
 * model name, strip the abstract subtype prefix Ember Data uses locally
 * (`facilitator-`, `maintenance-subject-`, `customer-`), and send it to the
 * backend as `fleet-ops:<type>`. Getting the prefix wrong makes the API resolve
 * the wrong PHP class, so it is asserted directly rather than inferred.
 *
 * The hook is a documented serializer extension point, so calling it directly
 * with a minimal snapshot is a fair unit test — and it is the only way to reach
 * the defensive paths that a full `record.serialize()` cannot produce.
 */

/**
 * Build the smallest snapshot `serializePolymorphicType` actually reads.
 *
 * @param {Object} [options]
 * @param {Object} [options.attrs] values `snapshot.attr(key)` should return
 * @param {Object|null} [options.belongsTo] value `snapshot.belongsTo(key)` should return
 * @return {Object}
 */
export function snapshotStub({ attrs = {}, belongsTo = null } = {}) {
    return {
        attr: (key) => attrs[key],
        belongsTo: () => belongsTo,
    };
}

/**
 * Assert the full contract of one serializer's `serializePolymorphicType`.
 *
 * @param {Assert} assert
 * @param {Object} options
 * @param {Serializer} options.serializer
 * @param {String} options.key the polymorphic relationship name
 * @param {Object} options.stripped map of local model name to the bare type the
 *                 backend should receive
 */
export function assertPolymorphicTypeContract(assert, { serializer, key, stripped }) {
    // Some of these serializers also consult `belongsTo.attr(...)` for a type the
    // related record carries itself, so every stub answers that too.
    const relatedStub = (modelName) => ({ modelName, attr: () => null });

    for (const [modelName, expected] of Object.entries(stripped)) {
        const json = {};

        serializer.serializePolymorphicType(snapshotStub({ belongsTo: relatedStub(modelName) }), json, { key });

        assert.strictEqual(json[`${key}_type`], `fleet-ops:${expected}`, `a ${modelName} is sent as fleet-ops:${expected}`);
    }

    const withoutRelated = {};
    serializer.serializePolymorphicType(snapshotStub({ belongsTo: null }), withoutRelated, { key });
    assert.strictEqual(withoutRelated[`${key}_type`], null, `an unset ${key} clears the type rather than leaving it stale`);

    const alreadyTyped = {};
    serializer.serializePolymorphicType(snapshotStub({ attrs: { [`${key}_type`]: 'fleet-ops:vendor' }, belongsTo: relatedStub('facilitator-contact') }), alreadyTyped, { key });
    assert.deepEqual(alreadyTyped, {}, `an explicitly chosen ${key}_type is left untouched`);

    const nonString = {};
    serializer.serializePolymorphicType(snapshotStub({ belongsTo: relatedStub(42) }), nonString, { key });
    assert.strictEqual(nonString[`${key}_type`], 'fleet-ops:42', 'a non-string model name is passed through rather than crashing the prefix strip');
}
