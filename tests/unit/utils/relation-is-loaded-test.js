import relationIsLoaded from '@fleetbase/fleetops-data/utils/relation-is-loaded';
import { setupTest } from 'dummy/tests/helpers';
import { module, test } from 'qunit';

module('Unit | Utility | relation-is-loaded', function (hooks) {
    setupTest(hooks);

    test('a populated relationship counts as loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order');
        const payload = store.createRecord('payload');

        order.set('payload', payload);

        assert.true(relationIsLoaded(order, 'payload'));
    });

    test('an unset belongsTo is not loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const order = store.createRecord('order');

        assert.false(relationIsLoaded(order, 'payload'));
    });

    test('an empty hasMany is not loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const payload = store.createRecord('payload');

        assert.false(relationIsLoaded(payload, 'waypoints'), 'a relationship with no members is blank');
    });

    test('a hasMany with members is loaded', function (assert) {
        const store = this.owner.lookup('service:store');
        const payload = store.createRecord('payload');

        payload.waypoints.pushObject(store.createRecord('waypoint'));

        assert.true(relationIsLoaded(payload, 'waypoints'));
    });

    test('it works on any object, not just Ember Data models', function (assert) {
        assert.true(relationIsLoaded({ place: { id: 'place_1' } }, 'place'));
        assert.false(relationIsLoaded({ place: null }, 'place'));
        assert.false(relationIsLoaded({}, 'place'), 'a missing key is blank');
    });

    test('blank scalars are not loaded', function (assert) {
        assert.false(relationIsLoaded({ place: '' }, 'place'), 'an empty string is blank');
        assert.false(relationIsLoaded({ place: '   ' }, 'place'), 'whitespace is blank');
        assert.false(relationIsLoaded({ place: [] }, 'place'), 'an empty array is blank');
    });

    test('falsy-but-present values are still values', function (assert) {
        assert.true(relationIsLoaded({ place: 0 }, 'place'), 'zero is not blank');
        assert.true(relationIsLoaded({ place: false }, 'place'), 'false is not blank');
    });
});
