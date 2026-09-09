import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';
import ENV from 'dummy/config/environment';

const PREFIX = `${ENV.API.host}/${ENV.API.namespace}/fleet-ops/v1`;

module('Unit | Adapter | manifest-stop', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.adapter = this.owner.lookup('adapter:manifest-stop');
    });

    test('it extends the Fleetbase application adapter, inheriting host and namespace', function (assert) {
        assert.ok(this.adapter instanceof ApplicationAdapter);
        assert.strictEqual(this.adapter.host, ENV.API.host);
        assert.strictEqual(this.adapter.namespace, ENV.API.namespace);
    });

    test('a single record is fetched from the versioned Fleet-Ops manifest-stops endpoint', function (assert) {
        assert.strictEqual(this.adapter.urlForFindRecord('stop_1', 'manifest-stop'), `${PREFIX}/manifest-stops/stop_1`);
    });

    test('updates are sent to the same endpoint as reads', function (assert) {
        assert.strictEqual(this.adapter.urlForUpdateRecord('stop_1', 'manifest-stop'), `${PREFIX}/manifest-stops/stop_1`);
        assert.strictEqual(this.adapter.urlForUpdateRecord('stop_1'), this.adapter.urlForFindRecord('stop_1'), 'reading and writing a stop share one URL');
    });

    test('stops are a separate resource from the manifests that own them', function (assert) {
        const manifestAdapter = this.owner.lookup('adapter:manifest');

        assert.notStrictEqual(this.adapter.urlForFindRecord('id_1'), manifestAdapter.urlForFindRecord('id_1'));
    });

    test('the URLs track the configured host', function (assert) {
        this.adapter.host = 'https://other.example';
        this.adapter.namespace = 'v2';

        assert.strictEqual(this.adapter.urlForFindRecord('stop_1'), 'https://other.example/v2/fleet-ops/v1/manifest-stops/stop_1');
        assert.strictEqual(this.adapter.urlForUpdateRecord('stop_1'), 'https://other.example/v2/fleet-ops/v1/manifest-stops/stop_1');
    });
});
