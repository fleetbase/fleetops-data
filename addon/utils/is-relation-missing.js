import shouldNotLoadRelation from './should-not-load-relation';

/**
 * Whether a relationship still has to be fetched: the model carries the
 * relationship's identifier but the related record is not loaded.
 *
 * This is the exact negation of `shouldNotLoadRelation`, kept under the name the
 * relation loaders read naturally. The `@fleetbase/ember-core` util of the same
 * name never consults the relationship at all (see DEFECTS.md), which is why the
 * loaders use this one.
 *
 * @param {Object} model
 * @param {String} relationship
 * @param {String|null} [relationshipId] the identifier attribute, derived from
 *                      the relationship name when omitted
 * @return {Boolean}
 */
export default function isRelationMissing(model, relationship, relationshipId = null) {
    return !shouldNotLoadRelation(model, relationship, relationshipId);
}
