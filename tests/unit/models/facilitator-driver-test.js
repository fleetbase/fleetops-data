import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';

module('Unit | Model | facilitator driver', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('facilitator-driver', {
            name: 'Test Driver',
            public_id: 'driver_test',
        });

        assert.ok(model);
        assert.strictEqual(model.displayName, 'Test Driver');
    });

    module('display', function () {
        test('photoUrl uses the supplied photo, falling back to the configured default', function (assert) {
            const store = this.owner.lookup('service:store');
            const driver = store.createRecord('facilitator-driver', { photo_url: 'https://cdn.example/ada.png' });

            assert.strictEqual(driver.photoUrl, 'https://cdn.example/ada.png');

            driver.set('photo_url', null);
            assert.strictEqual(driver.photoUrl, ENV.defaultValues.driverImage);
        });

        test('displayName prefers the name and falls back to the public id', function (assert) {
            const store = this.owner.lookup('service:store');
            const driver = store.createRecord('facilitator-driver', { name: 'Ada Lovelace', public_id: 'driver_1' });

            assert.strictEqual(driver.displayName, 'Ada Lovelace');

            driver.set('name', null);
            assert.strictEqual(driver.displayName, 'driver_1');
        });
    });
});
