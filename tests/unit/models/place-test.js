import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertPointAccessors, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | place', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'place', {
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('image defaults come from application configuration rather than being hard-coded', function (assert) {
        const record = this.store.createRecord('place');

        assert.strictEqual(record.avatar_url, ENV.defaultValues.placeAvatar, 'avatar_url falls back to defaultValues.placeAvatar');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('place'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
                updatedAtShort: FIXED_DATE_SHORT,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('place'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
                createdAtShort: FIXED_DATE_SHORT,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('the GeoJSON point accessors read the location attribute', function (assert) {
        assertPointAccessors(assert, this.store.createRecord('place'), { attribute: 'location' });
    });

    module('display and serialization', function () {
        test('displayName prefers the name, then the address, then the street', function (assert) {
            const place = this.store.createRecord('place', { name: 'Depot', address: '1 Main St, Singapore', street1: '1 Main St' });
            assert.strictEqual(place.displayName, 'Depot');

            place.set('name', null);
            assert.strictEqual(place.displayName, '1 Main St, Singapore');

            place.set('address', null);
            assert.strictEqual(place.displayName, '1 Main St');
        });

        test('displayName is undefined for a place with no identity at all', function (assert) {
            assert.strictEqual(this.store.createRecord('place').displayName, undefined);
        });

        test('toJSON emits the address fields the backend expects, keyed by uuid', function (assert) {
            const place = this.store.push(
                this.store.normalize('place', {
                    uuid: 'place_1',
                    vendor_uuid: 'vendor_1',
                    name: 'Depot',
                    phone: '+6560000000',
                    type: 'warehouse',
                    address: '1 Main St, Singapore',
                    street1: '1 Main St',
                    city: 'Singapore',
                    country: 'SG',
                    meta: { dock: 3 },
                })
            );

            const json = place.toJSON();

            assert.strictEqual(json.uuid, 'place_1', 'the Ember Data id is emitted as uuid');
            assert.strictEqual(json.vendor_uuid, 'vendor_1');
            assert.strictEqual(json.name, 'Depot');
            assert.strictEqual(json.city, 'Singapore');
            assert.deepEqual(json.meta, { dock: 3 });
            assert.notOk('public_id' in json, 'fields the backend does not accept are left out');
        });

        test('toJSON of an unsaved place has no uuid', function (assert) {
            assert.strictEqual(this.store.createRecord('place').toJSON().uuid, null);
        });
    });

    test('a place starts unselected', function (assert) {
        assert.false(this.store.createRecord('place').selected, 'selection is UI state that starts cleared');
    });
});
