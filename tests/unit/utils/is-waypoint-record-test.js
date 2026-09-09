import isWaypointRecord from '@fleetbase/fleetops-data/utils/is-waypoint-record';
import WaypointModel from '@fleetbase/fleetops-data/models/waypoint';
import PlaceModel from '@fleetbase/fleetops-data/models/place';
import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ObjectProxy from '@ember/object/proxy';

module('Unit | Utility | is-waypoint-record', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('it returns true for a waypoint record', function (assert) {
        assert.true(isWaypointRecord(this.store.createRecord('waypoint', {})));
    });

    test('it returns false for a place, which waypoint extends', function (assert) {
        // WaypointModel extends PlaceModel, so the check has to be narrow enough
        // to reject the parent while still accepting the child.
        assert.true(WaypointModel.prototype instanceof PlaceModel, 'waypoint does extend place');
        assert.false(isWaypointRecord(this.store.createRecord('place', {})));
    });

    test('it returns false for an unrelated record', function (assert) {
        assert.false(isWaypointRecord(this.store.createRecord('order', {})));
    });

    test('it returns false for a proxy wrapping a waypoint', function (assert) {
        const record = this.store.createRecord('waypoint', {});

        assert.false(isWaypointRecord(ObjectProxy.create({ content: record })), 'instanceof looks at the proxy, not its content');
    });

    test('it returns false for plain and nullish values', function (assert) {
        assert.false(isWaypointRecord({}));
        assert.false(isWaypointRecord(null));
        assert.false(isWaypointRecord(undefined));
        assert.false(isWaypointRecord('waypoint'));
        assert.false(isWaypointRecord([]));
    });

    test('it returns false for an object merely shaped like a waypoint', function (assert) {
        assert.false(isWaypointRecord({ place: {}, order: 1 }), 'the check is by identity, not by shape');
    });
});
