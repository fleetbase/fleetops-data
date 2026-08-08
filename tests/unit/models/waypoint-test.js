import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | waypoint', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'waypoint', {
            place: { kind: 'belongsTo', type: 'place', async: false },
            tracking_number: { kind: 'belongsTo', type: 'tracking-number', async: false },
            customer: { kind: 'belongsTo', type: 'customer', async: false, polymorphic: true, inverse: 'waypoints' },
        });
    });
});
