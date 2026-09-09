import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | device event', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('it exposes connectivity identity payload fields', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('device-event', {
            device_id: 'BX-025',
            device_imei: '867747078951793',
            device_connection_status: 'offline',
            telematic_uuid: 'telematic_1',
            telematic_name: 'AFAQY',
            provider_descriptor: {
                label: 'AFAQY',
                icon: '/engines-dist/images/telematics/providers/afaqy.webp',
            },
        });

        assert.strictEqual(model.device_id, 'BX-025');
        assert.strictEqual(model.device_imei, '867747078951793');
        assert.strictEqual(model.device_connection_status, 'offline');
        assert.strictEqual(model.telematic_uuid, 'telematic_1');
        assert.strictEqual(model.telematic_name, 'AFAQY');
        assert.deepEqual(model.provider_descriptor, {
            label: 'AFAQY',
            icon: '/engines-dist/images/telematics/providers/afaqy.webp',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device-event'),
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
            this.store.createRecord('device-event'),
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
            this.store.createRecord('device-event'),
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

    test('occurred_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device-event'),
            'occurred_at',
            {
                occurredAt: FIXED_DATE_LONG,
                occurredAtShort: FIXED_DATE_SHORT,
            },
            {
                occurredAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('processed_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('device-event'),
            'processed_at',
            {
                processedAt: FIXED_DATE_LONG,
                processedAtShort: FIXED_DATE_SHORT,
            },
            {
                processedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });
});
