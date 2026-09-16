import clearUnsetPolymorphicRelationships from '@fleetbase/fleetops-data/utils/clear-unset-polymorphic-relationships';
import { module, test } from 'qunit';

/**
 * A removed polymorphic relationship has to reach the server as cleared
 * columns; a relationship that is still set must be left to the type hook.
 */
module('Unit | Utility | clear-unset-polymorphic-relationships', function () {
    const snapshot = (related) => ({ belongsTo: (key) => related[key] ?? null });

    test('an unset relationship is sent with both its uuid and type cleared', function (assert) {
        const json = { target: null };

        const result = clearUnsetPolymorphicRelationships(snapshot({}), json, ['target']);

        assert.strictEqual(result, json, 'the payload is changed in place and returned');
        assert.strictEqual(json.target_uuid, null);
        assert.strictEqual(json.target_type, null);
    });

    test('a relationship that is set is left untouched', function (assert) {
        const json = { assignee_uuid: 'vendor_1', assignee_type: 'fleet-ops:vendor' };

        clearUnsetPolymorphicRelationships(snapshot({ assignee: { id: 'vendor_1' } }), json, ['assignee', 'target']);

        assert.strictEqual(json.assignee_uuid, 'vendor_1');
        assert.strictEqual(json.assignee_type, 'fleet-ops:vendor');
        assert.strictEqual(json.target_uuid, null, 'the unset sibling is still cleared');
    });
});
