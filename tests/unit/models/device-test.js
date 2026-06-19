import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | device', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('device', {});
        assert.ok(model);
    });

    test('attachable is a synchronous polymorphic relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const relationship = store.modelFor('device').relationshipsByName.get('attachable');

        assert.strictEqual(relationship.kind, 'belongsTo');
        assert.strictEqual(relationship.type, 'attachable');
        assert.true(relationship.options.polymorphic);
        assert.false(relationship.options.async);
    });
});
