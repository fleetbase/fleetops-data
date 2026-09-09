import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

module('Unit | Adapter | facilitator', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:facilitator');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('queries go to the polymorphic facilitator lookup endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForQuery({ query: 'acme' }, 'facilitator'), `${ENV.API.host}/${ENV.API.namespace}/query/facilitators`);
    });

    test('the facilitator endpoint is distinct from the customer one', function (assert) {
        const customerAdapter = this.owner.lookup('adapter:customer');

        assert.notStrictEqual(this.adapter.urlForQuery(), customerAdapter.urlForQuery(), 'facilitators and customers are looked up separately');
    });

    test('the query URL tracks the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForQuery(), 'https://other.example/v2/query/facilitators');
    });

    test('other request types keep the inherited RESTAdapter URLs', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('fac_1', 'facilitator'), `${ENV.API.host}/${ENV.API.namespace}/facilitators/fac_1`);
    });
});
