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

    test('the status flags identify exactly one status at a time', function (assert) {
        const schedule = this.store.createRecord('recurring-order-schedule');
        const flags = { active: 'isActive', paused: 'isPaused', canceled: 'isCanceled' };

        for (const status of Object.keys(flags)) {
            schedule.set('status', status);

            for (const [otherStatus, flag] of Object.entries(flags)) {
                assert.strictEqual(schedule[flag], status === otherStatus, `${flag} is ${status === otherStatus} while ${status}`);
            }
        }
    });

    test('no flag is true for an unset status', function (assert) {
        const schedule = this.store.createRecord('recurring-order-schedule');

        assert.false(schedule.isActive);
        assert.false(schedule.isPaused);
        assert.false(schedule.isCanceled);
    });
});
