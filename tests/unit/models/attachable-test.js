import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | attachable', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('attachable'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
                updatedAtShort: FIXED_DATE_SHORT,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    module('displayName', function () {
        test('the server-supplied display name wins', function (assert) {
            const attachable = this.store.createRecord('attachable', { display_name: 'Van 1 (fleet)', name: 'Van 1', public_id: 'veh_1' });

            assert.strictEqual(attachable.displayName, 'Van 1 (fleet)');
        });

        test('it falls back to the name, then the public id', function (assert) {
            const attachable = this.store.createRecord('attachable', { name: 'Van 1', public_id: 'veh_1' });
            assert.strictEqual(attachable.displayName, 'Van 1');

            attachable.set('name', null);
            assert.strictEqual(attachable.displayName, 'veh_1');
        });

        test('an unidentified attachable has no display name', function (assert) {
            assert.strictEqual(this.store.createRecord('attachable').displayName, undefined);
        });
    });
});
