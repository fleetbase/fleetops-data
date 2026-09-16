/**
 * Send each unset polymorphic relationship as cleared.
 *
 * Ember Data only calls `serializePolymorphicType` for a related record that is
 * present, so a removed relationship otherwise reaches the server as `null`
 * embedded data while its `<key>_uuid` and `<key>_type` columns keep pointing
 * at the old record.
 *
 * @param {Snapshot} snapshot
 * @param {Object} json the serialized payload, changed in place
 * @param {Array<String>} keys the polymorphic relationship names
 * @return {Object} json
 */
export default function clearUnsetPolymorphicRelationships(snapshot, json, keys) {
    for (const key of keys) {
        if (!snapshot.belongsTo(key)) {
            json[`${key}_uuid`] = null;
            json[`${key}_type`] = null;
        }
    }

    return json;
}
