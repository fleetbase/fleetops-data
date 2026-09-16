import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import RESTAdapter from '@ember-data/adapter/rest';
import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | fuel provider connection', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
        this.serializer = this.store.serializerFor('fuel-provider-connection');
    });

    test('it is a Fleetbase application serializer that embeds records', function (assert) {
        assert.ok(this.serializer instanceof ApplicationSerializer, 'it inherits the Fleetbase wire conventions');
        assert.ok(EmbeddedRecordsMixin.detect(this.serializer), 'it can inline related records');
        assertPrimaryKeyIsUuid(assert, this.store, 'fuel-provider-connection');
    });

    test('it declares exactly the expected relationship serialization contract', function (assert) {
        assertEmbeddedAttrs(assert, this.store, 'fuel-provider-connection', {});
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'fuel-provider-connection', { provider: 'contract-value' });

        assert.strictEqual(record.provider, 'contract-value', 'the attribute survives normalization');
    });

    test('a record serializes its attributes back onto the wire', function (assert) {
        const record = this.store.createRecord('fuel-provider-connection', { provider: 'contract-value' });

        assert.strictEqual(record.serialize().provider, 'contract-value');
    });

    test('the token used for connection testing is included in the create payload', function (assert) {
        const credentials = { api_token: 'test-token', auth_type: 'ws_sk_header' };
        const record = this.store.createRecord('fuel-provider-connection', { provider: 'petroapp', environment: 'sandbox', credentials });
        const payload = record.serialize();

        assert.deepEqual(payload.credentials, credentials, 'Ember Data serializes the token and authentication method');
        assert.strictEqual(payload.environment, 'sandbox');
        record.set('credentials', { api_token: 'replacement-token' });
        assert.deepEqual(record.serialize().credentials, { api_token: 'replacement-token' }, 'credential edits are tracked and serialized');
    });

    test('editing a fetched connection omits credentials until a replacement is supplied', function (assert) {
        const record = assertNormalizesUuidAsId(assert, this.store, 'fuel-provider-connection', { provider: 'petroapp', name: 'Sandbox' });
        record.set('name', 'Renamed sandbox');

        assert.false(Object.hasOwn(record.serialize(), 'credentials'), 'a name-only update cannot clear the stored token');
        record.set('credentials', null);
        assert.false(Object.hasOwn(record.serialize(), 'credentials'), 'null credentials are also omitted');
        record.set('credentials', { api_token: 'replacement-token' });
        assert.deepEqual(record.serialize().credentials, { api_token: 'replacement-token' });
    });

    test('saving a connection sends credentials and accepts the write-only server response', async function (assert) {
        const credentials = { api_token: 'test-token', auth_type: 'ws_sk_header' };
        this.owner.register(
            'adapter:fuel-provider-connection',
            class extends RESTAdapter {
                ajax(url, method, options) {
                    assert.strictEqual(method, 'POST');
                    assert.deepEqual(options.data.fuelProviderConnection.credentials, credentials);
                    assert.strictEqual(options.data.fuelProviderConnection.environment, 'sandbox');

                    return Promise.resolve({
                        fuelProviderConnection: {
                            uuid: 'saved-connection',
                            provider: 'petroapp',
                            name: 'Sandbox',
                            environment: 'sandbox',
                            status: 'configured',
                        },
                    });
                }
            }
        );
        const record = this.store.createRecord('fuel-provider-connection', { provider: 'petroapp', name: 'Sandbox', environment: 'sandbox', credentials });
        await record.save();
        assert.strictEqual(record.id, 'saved-connection');
        assert.false(record.isNew, 'the save completes without requiring credentials in the response');
    });

    test('repeated public-ID lookups reuse the UUID record without an identifier collision', async function (assert) {
        let requests = 0;
        this.owner.register(
            'adapter:fuel-provider-connection',
            class extends RESTAdapter {
                queryRecord(store, type, query) {
                    requests++;
                    assert.deepEqual(query, { public_id: 'fuel_provider_connection_test', single: true });
                    return Promise.resolve({ fuelProviderConnection: { uuid: 'connection-uuid', public_id: 'fuel_provider_connection_test', provider: 'petroapp', status: 'connected' } });
                }
            }
        );
        const first = await this.store.queryRecord('fuel-provider-connection', { public_id: 'fuel_provider_connection_test', single: true });
        const second = await this.store.queryRecord('fuel-provider-connection', { public_id: 'fuel_provider_connection_test', single: true });
        assert.strictEqual(first.id, 'connection-uuid');
        assert.strictEqual(second, first, 'refreshing the public URL keeps one record with its canonical UUID');
        assert.strictEqual(requests, 2);
    });
});
