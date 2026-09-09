import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

const PREFIX = `${ENV.API.host}/${ENV.API.namespace}`;

module('Unit | Adapter | facilitator-contact', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:facilitator-contact');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('a single record is fetched from the facilitator-scoped contacts endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('con_1', 'facilitator-contact'), `${PREFIX}/contacts/facilitators/con_1`);
    });

    test('the endpoint ignores the model name, because the path encodes the role', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('con_1', 'anything'), `${PREFIX}/contacts/facilitators/con_1`);
    });

    test('an id-less lookup still resolves to the collection endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord(null, 'facilitator-contact'), `${PREFIX}/contacts/facilitators`);
    });

    test('the URL tracks the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForFindRecord('con_1', 'facilitator-contact'), 'https://other.example/v2/contacts/facilitators/con_1');
    });
});
