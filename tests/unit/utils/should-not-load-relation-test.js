import shouldNotLoadRelation from '@fleetbase/fleetops-data/utils/should-not-load-relation';
import { setupTest } from 'dummy/tests/helpers';
import { module, test } from 'qunit';

/**
 * `shouldNotLoadRelation` is the guard every `order.load*()` method opens with.
 * It answers "can I skip the network round-trip?" and says yes when either there
 * is no id to fetch, or the relationship is already populated.
 */
module('Unit | Utility | should-not-load-relation', function (hooks) {
    setupTest(hooks);

    test('a relationship with no id to fetch should not be loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order');

        assert.true(shouldNotLoadRelation(order, 'payload'), 'there is nothing to fetch without payload_uuid');
    });

    test('an id with nothing loaded yet should be loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order', { payload_uuid: 'payload_1' });

        assert.false(shouldNotLoadRelation(order, 'payload'), 'the fetch is worth making');
    });

    test('an already-populated relationship should not be loaded again', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order', { payload_uuid: 'payload_1' });

        order.set('payload', store.createRecord('payload'));

        assert.true(shouldNotLoadRelation(order, 'payload'), 'the record is already in hand');
    });

    test('the id attribute is derived by underscoring the relationship name', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order', { order_config_uuid: 'config_1' });

        assert.false(shouldNotLoadRelation(order, 'order_config'), 'order_config maps onto order_config_uuid');
    });

    test('a camelCase relationship name is underscored before the lookup', function (assert) {
        assert.false(shouldNotLoadRelation({ tracking_number_uuid: 'track_1' }, 'trackingNumber'), 'trackingNumber maps onto tracking_number_uuid');
        assert.true(shouldNotLoadRelation({ trackingNumber_uuid: 'track_1' }, 'trackingNumber'), 'the camelCase key is not consulted');
    });

    test('an explicit id attribute overrides the derived one', function (assert) {
        const subject = { driver_assigned_uuid: 'driver_1', driver_uuid: null };

        assert.false(shouldNotLoadRelation(subject, 'driver', 'driver_assigned_uuid'), 'the caller-supplied key is used');
        assert.true(shouldNotLoadRelation(subject, 'driver'), 'and the derived key still says there is nothing to fetch');
    });

    test('a blank id is treated as no id at all', function (assert) {
        assert.true(shouldNotLoadRelation({ place_uuid: '' }, 'place'), 'an empty string is not a fetchable id');
        assert.true(shouldNotLoadRelation({ place_uuid: '   ' }, 'place'), 'whitespace is not a fetchable id');
        assert.true(shouldNotLoadRelation({ place_uuid: null }, 'place'));
    });

    test('an id plus a blank relationship still warrants a load', function (assert) {
        assert.false(shouldNotLoadRelation({ place_uuid: 'place_1', place: null }, 'place'));
        assert.false(shouldNotLoadRelation({ place_uuid: 'place_1', place: [] }, 'place'), 'an empty collection counts as not loaded');
    });
});
