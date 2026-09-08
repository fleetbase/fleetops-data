'use strict';

/**
 * Code that cannot be reached through any supported use of this addon.
 *
 * The coverage gate requires 100% of everything reachable. A handful of
 * defensive clauses can never execute — their guard conditions are mutually
 * exclusive with the code path that leads to them, or Ember Data forbids the
 * state they defend against — and no test can honestly cover them without
 * faking framework internals into shapes the framework itself rejects.
 *
 * Rather than weaken the gate, each one is listed here with the reason it is
 * unreachable. The gate treats these exact locations as covered and **fails if
 * any of them becomes reachable**, so an exemption can never quietly widen or
 * outlive its cause. Every entry has a matching section in DEFECTS.md.
 *
 * Locations are identified as they appear in the Istanbul report:
 *   statements: 1-indexed source line
 *   branches:   `<type>@<line>#<index>` (index is the position within the branch)
 *   functions:  the function name Istanbul recorded
 *
 * This list should shrink, never grow.
 */
module.exports = {
    'addon/models/order.js': {
        reason:
            'Two guards in loadPayload/loadCustomer are already implied by the checks above them. ' +
            'loadPayload line 492 requires a payload whose `waypoints` is neither a ManyArray nor an array, which Ember Data cannot produce; ' +
            'loadCustomer line 517 repeats the condition shouldNotLoadRelation() has just returned false for. See DEFECTS.md §12.',
        statements: [493, 518],
        branches: ['if@492#0', 'binary-expr@492#2', 'if@517#0'],
    },

    'addon/models/payload.js': {
        reason:
            'orderWaypoints falls back to returning `this.waypoints` when the relationship has no `toArray`. ' +
            'Ember Data rejects any attempt to unset a hasMany, so the relationship is always a ManyArray and the fallback cannot run. See DEFECTS.md §13.',
        statements: [118],
        branches: ['if@114#1'],
    },

    'addon/models/service-rate.js': {
        reason:
            'Two shapes of dead defence. `rankFee` returns 2 for a fee that is neither new nor has an id, which Ember Data cannot produce — a record is either unsaved (no id) or loaded (has one). ' +
            'The `?? []` fallbacks guard against `rate_fees`/`parcel_fees` having no `toArray`, which is never true of a hasMany. See DEFECTS.md §14.',
        statements: [141, 184, 223],
        branches: ['if@140#0', 'if@183#0', 'if@222#0', 'binary-expr@131#1', 'binary-expr@210#1', 'binary-expr@256#1', 'binary-expr@283#1', 'binary-expr@298#1', 'binary-expr@316#1'],
    },

    'addon/serializers/device.js': {
        reason:
            'The `return;` for a missing inherited serializePolymorphicType cannot run: `super` resolves lexically against the class prototype chain, where JSONSerializer always provides one. ' +
            'The test deletes it from the owning prototype to prove the branch behaves, but Istanbul attributes the hit to the deleted-prototype call rather than the guard. See DEFECTS.md §15.',
        statements: [44],
        branches: ['if@41#1'],
    },
};
