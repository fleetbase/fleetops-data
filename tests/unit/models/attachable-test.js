import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | attachable', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        const store = this.owner.lookup('service:store');
        const model = store.createRecord('attachable', {});

        assert.ok(model);
    });
});
