import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | attachable vehicle', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        const store = this.owner.lookup('service:store');
        const model = store.createRecord('attachable-vehicle', {});

        assert.ok(model);
    });

    test('yearMakeModel joins the parts that are present and omits the rest', function (assert) {
        const store = this.owner.lookup('service:store');

        assert.strictEqual(store.createRecord('attachable-vehicle', { year: '2020', make: 'Ford', model: 'Transit' }).yearMakeModel, '2020 Ford Transit');
        assert.strictEqual(store.createRecord('attachable-vehicle', { make: 'Ford' }).yearMakeModel, 'Ford');
        assert.strictEqual(store.createRecord('attachable-vehicle').yearMakeModel, '');
    });
});
