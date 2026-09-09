import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';
import {} from 'dummy/tests/helpers/model-contract';

module('Unit | Model | maintenance subject vehicle', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('image defaults come from application configuration rather than being hard-coded', function (assert) {
        const record = this.store.createRecord('maintenance-subject-vehicle');

        assert.strictEqual(record.photo_url, ENV.defaultValues.vehicleImage, 'photo_url falls back to defaultValues.vehicleImage');
        assert.strictEqual(record.avatar_url, ENV.defaultValues.vehicleAvatar, 'avatar_url falls back to defaultValues.vehicleAvatar');
    });
});
