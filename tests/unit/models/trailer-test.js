import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';

module('Unit | Model | trailer', function (hooks) {
    setupTest(hooks);

    test('it exposes first-class identity, capacity, connection, and telemetry state', function (assert) {
        const store = this.owner.lookup('service:store');
        const trailer = store.createRecord('trailer', {
            name: 'Reefer 12',
            year: '2026',
            make: 'Utility',
            model: '3000R',
            location: { type: 'Point', coordinates: [106.9, 47.9] },
            payload_capacity: 20000,
        });

        assert.strictEqual(trailer.asset_class, 'trailer');
        assert.strictEqual(trailer.yearMakeModel, '2026 Utility 3000R');
        assert.strictEqual(trailer.payload_capacity, 20000);
        assert.deepEqual(trailer.coordinates, [47.9, 106.9]);
    });
});
