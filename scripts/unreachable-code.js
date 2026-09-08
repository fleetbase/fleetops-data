'use strict';

/**
 * Code that cannot be reached through any supported use of this addon.
 *
 * The coverage gate requires 100% of everything reachable. Should a defensive
 * clause ever be provably unreachable — its guard condition mutually exclusive
 * with the code path that leads to it, or Ember Data forbidding the state it
 * defends against — and impossible to delete, it can be listed here rather
 * than weakening the gate. The gate treats a listed location as covered and
 * **fails if it becomes reachable**, so an exemption can never quietly widen
 * or outlive its cause. Every entry must have a matching section in
 * DEFECTS.md explaining why deleting the code was not an option.
 *
 * The list is empty: every clause that used to be listed here was either made
 * reachable by reordering or deleted outright. Prefer that to adding an entry.
 *
 * An entry is keyed by the project-relative file path and identifies locations
 * as they appear in the Istanbul report:
 *
 *   'addon/models/example.js': {
 *       reason: 'Why the code cannot run and why it cannot be removed.',
 *       statements: [42],           // 1-indexed source line
 *       branches: ['if@41#1'],      // `<type>@<line>#<index>` within the branch
 *       functions: ['helperName'],  // the function name Istanbul recorded
 *   },
 *
 * This list should shrink, never grow.
 */
module.exports = {};
