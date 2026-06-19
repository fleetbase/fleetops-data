import { module, test } from 'qunit';

import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | device event', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let model = store.createRecord('device-event', {});
        assert.ok(model);
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
});
