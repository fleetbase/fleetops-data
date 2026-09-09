import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

const PREFIX = `${ENV.API.host}/${ENV.API.namespace}`;

module('Unit | Adapter | customer-contact', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:customer-contact');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('a single record is fetched from the customer-scoped contacts endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('cus_1', 'customer-contact'), `${PREFIX}/contacts/customers/cus_1`);
    });

    test('the endpoint ignores the model name, because the path encodes the role', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('cus_1', 'anything'), `${PREFIX}/contacts/customers/cus_1`);
    });

    test('an id-less lookup still resolves to the collection endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord(null, 'customer-contact'), `${PREFIX}/contacts/customers`);
    });

    test('it is distinct from the contact endpoint used for facilitators', function (assert) {
        const facilitatorAdapter = this.owner.lookup('adapter:facilitator-contact');

        assert.notStrictEqual(
            this.adapter.urlForFindRecord('id_1', 'customer-contact'),
            facilitatorAdapter.urlForFindRecord('id_1', 'facilitator-contact'),
            'a contact acting as a customer is a different resource from one acting as a facilitator'
        );
    });

    test('the URL tracks the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForFindRecord('cus_1', 'customer-contact'), 'https://other.example/v2/contacts/customers/cus_1');
    });
});
