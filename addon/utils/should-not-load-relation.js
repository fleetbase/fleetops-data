import { isBlank } from '@ember/utils';
import { underscore } from '@ember/string';

/**
 * Read whatever a relationship currently holds.
 *
 * An async relationship hands back a promise proxy, which is never blank even
 * when nothing has been loaded, so a declared relationship is read through its
 * Ember Data reference instead. Anything that is not a declared relationship
 * (a plain attribute, or a plain object in a test) is read directly.
 *
 * @param {Object} model
 * @param {String} relationship
 * @return {*} the loaded record(s), or nothing
 */
function loadedRelation(model, relationship) {
    const meta = model.constructor?.relationshipsByName?.get(relationship);

    if (meta?.kind === 'belongsTo') {
        return model.belongsTo(relationship).value();
    }

    if (meta?.kind === 'hasMany') {
        return model.hasMany(relationship).value();
    }

    return model[relationship];
}

/**
 * Whether a `load<Relation>()` helper can skip its fetch: either there is no
 * identifier to fetch by, or the related record is already loaded.
 *
 * @param {Object} model
 * @param {String} relationship
 * @param {String|null} [relationshipId] the identifier attribute, derived from
 *                      the relationship name when omitted
 * @return {Boolean}
 */
export default function shouldNotLoadRelation(model, relationship, relationshipId = null) {
    relationshipId = relationshipId === null ? `${underscore(relationship)}_uuid` : relationshipId;
    return isBlank(model[relationshipId]) || !isBlank(loadedRelation(model, relationship));
}
