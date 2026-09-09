import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

module('Unit | Adapter | customer', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:customer');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('queries go to the polymorphic customer lookup endpoint, not /customers', function (assert) {
        assert.strictEqual(this.adapter.urlForQuery({ query: 'ada' }, 'customer'), `${ENV.API.host}/${ENV.API.namespace}/query/customers`);
    });

    test('the query URL ignores the query and model name it is handed', function (assert) {
        assert.strictEqual(
            this.adapter.urlForQuery({ anything: true }, 'anything'),
            this.adapter.urlForQuery(),
            'the endpoint is fixed, because the server resolves the concrete type itself'
        );
    });

    test('the query URL tracks the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForQuery(), 'https://other.example/v2/query/customers');
    });

    test('other request types keep the inherited RESTAdapter URLs', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('cus_1', 'customer'), `${ENV.API.host}/${ENV.API.namespace}/customers/cus_1`);
        assert.strictEqual(this.adapter.urlForFindAll('customer'), `${ENV.API.host}/${ENV.API.namespace}/customers`);
    });
});
