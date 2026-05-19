import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Serializer | order', function (hooks) {
    setupTest(hooks);

    // Replace this with your real tests.
    test('it exists', function (assert) {
        let store = this.owner.lookup('service:store');
        let serializer = store.serializerFor('order');

        assert.ok(serializer);
    });

    test('it serializes records', function (assert) {
        let store = this.owner.lookup('service:store');
        let record = store.createRecord('order', {});

        let serializedRecord = record.serialize();

        assert.ok(serializedRecord);
    });

    test('selected order config scalar fields win over a stale relationship snapshot', function (assert) {
        let store = this.owner.lookup('service:store');
        let transport = store.push({
            data: {
                type: 'order-config',
                id: 'transport-config-uuid',
                attributes: {
                    key: 'transport',
                    name: 'Transport',
                },
            },
        });
        let haulage = store.push({
            data: {
                type: 'order-config',
                id: 'haulage-config-uuid',
                attributes: {
                    key: 'haulage',
                    name: 'Haulage',
                },
            },
        });
        let record = store.createRecord('order', {
            order_config: transport,
            order_config_uuid: haulage.id,
            type: haulage.key,
        });

        let serializedRecord = record.serialize();

        assert.strictEqual(serializedRecord.order_config_uuid, haulage.id);
        assert.strictEqual(serializedRecord.type, haulage.key);
        assert.notOk(serializedRecord.order_config);
    });
});
