import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

const PREFIX = `${ENV.API.host}/${ENV.API.namespace}/fleet-ops/v1`;

module('Unit | Adapter | manifest', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:manifest');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('queries go to the versioned Fleet-Ops manifests collection', function (assert) {
        assert.strictEqual(this.adapter.urlForQuery({ driver_uuid: 'drv_1' }, 'manifest'), `${PREFIX}/manifests`);
    });

    test('a single record is fetched from the versioned Fleet-Ops manifests endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('man_1', 'manifest'), `${PREFIX}/manifests/man_1`);
    });

    test('the endpoint is versioned separately from the API namespace', function (assert) {
        assert.true(this.adapter.urlForFindRecord('man_1', 'manifest').includes('/fleet-ops/v1/'), 'manifests live behind the Fleet-Ops v1 route group');
    });

    test('the URLs track the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForQuery(), 'https://other.example/v2/fleet-ops/v1/manifests');
        assert.strictEqual(this.adapter.urlForFindRecord('man_1'), 'https://other.example/v2/fleet-ops/v1/manifests/man_1');
    });
});
