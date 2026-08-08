import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | recurring order schedule', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'recurring-order-schedule', {
            customer: { kind: 'belongsTo', type: 'customer', async: false, polymorphic: true },
            facilitator: { kind: 'belongsTo', type: 'facilitator', async: false, polymorphic: true },
            order_config: { kind: 'belongsTo', type: 'order-config', async: false },
            driver_assigned: { kind: 'belongsTo', type: 'driver', async: false },
            vehicle_assigned: { kind: 'belongsTo', type: 'vehicle', async: false },
            service_rate: { kind: 'belongsTo', type: 'service-rate', async: false },
        });
    });
});
