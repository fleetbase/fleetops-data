import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | device', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('attachable is a synchronous polymorphic relationship', function (assert) {
        const store = this.owner.lookup('service:store');
        const relationship = store.modelFor('device').relationshipsByName.get('attachable');

        assert.strictEqual(relationship.kind, 'belongsTo');
        assert.strictEqual(relationship.type, 'attachable');
        assert.true(relationship.options.polymorphic);
        assert.false(relationship.options.async);
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device'),
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
            this.store.createRecord('device'),
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

    test('deleted_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device'),
            'deleted_at',
            {
                deletedAt: FIXED_DATE_LONG,
                deletedAtShort: FIXED_DATE_SHORT,
            },
            {
                deletedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('last_online_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device'),
            'last_online_at',
            {
                lastOnlineAt: FIXED_DATE_LONG,
                lastOnlineAtShort: FIXED_DATE_SHORT,
            },
            {
                lastOnlineAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    module('displayName', function () {
        test('it prefers the human name', function (assert) {
            const device = this.store.createRecord('device', { name: 'Gateway 1', serial_number: 'SN-1', internal_id: 'INT-1', imei: '123', public_id: 'device_1' });

            assert.strictEqual(device.displayName, 'Gateway 1');
        });

        test('it falls back through serial number, internal id, IMEI and public id in that order', function (assert) {
            const device = this.store.createRecord('device', { serial_number: 'SN-1', internal_id: 'INT-1', imei: '123', public_id: 'device_1' });
            assert.strictEqual(device.displayName, 'SN-1');

            device.set('serial_number', null);
            assert.strictEqual(device.displayName, 'INT-1');

            device.set('internal_id', null);
            assert.strictEqual(device.displayName, '123');

            device.set('imei', null);
            assert.strictEqual(device.displayName, 'device_1');
        });

        test('an entirely unidentified device has no display name', function (assert) {
            assert.strictEqual(this.store.createRecord('device').displayName, undefined);
        });
    });
});
