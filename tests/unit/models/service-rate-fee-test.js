import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | service rate fee', function (hooks) {
    setupTest(hooks);

    // Replace this with your real tests.
    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('service-rate-fee', {});
        assert.ok(model);
    });

    test('geography type prefers transient selected geography type', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('service-rate-fee', {
            service_area_uuid: 'service_area_1',
        });

        model.set('selected_geography_type', 'zone');

        assert.strictEqual(model.geography_type, 'zone');
    });

    test('geography type derives from saved relationships when no transient type is selected', function (assert) {
        let store = this.owner.lookup('service:store');
        let zoneRule = store.createRecord('service-rate-fee', {
            zone_uuid: 'zone_1',
        });
        let serviceAreaRule = store.createRecord('service-rate-fee', {
            service_area_uuid: 'service_area_1',
        });
        let fallbackRule = store.createRecord('service-rate-fee', {
            is_fallback: true,
        });

        assert.strictEqual(zoneRule.geography_type, 'zone');
        assert.strictEqual(serviceAreaRule.geography_type, 'service_area');
        assert.strictEqual(fallbackRule.geography_type, 'fallback');
    });
});
