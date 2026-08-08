import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | maintenance subject', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance-subject'),
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

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('maintenance-subject'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
                createdAtShort: FIXED_DATE_SHORT,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('displayName prefers the server display name, then the name, then the public id', function (assert) {
        const subject = this.store.createRecord('maintenance-subject', { display_name: 'Van 1 (fleet)', name: 'Van 1', public_id: 'veh_1' });
        assert.strictEqual(subject.displayName, 'Van 1 (fleet)');

        subject.set('display_name', null);
        assert.strictEqual(subject.displayName, 'Van 1');

        subject.set('name', null);
        assert.strictEqual(subject.displayName, 'veh_1');
    });
});
