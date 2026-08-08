import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | contact', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'contact', {
            photo: { kind: 'belongsTo', type: 'file' },
            user: { kind: 'belongsTo', type: 'user' },
            place: { kind: 'belongsTo', type: 'place' },
            places: { kind: 'hasMany', type: 'place' },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('contact'), {
            photo_url: 'https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('contact'),
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
            this.store.createRecord('contact'),
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

    module('customerId', function () {
        test('it rewrites a contact public id into its customer form', function (assert) {
            assert.strictEqual(this.store.createRecord('contact', { public_id: 'contact_abc123' }).customerId, 'customer_abc123');
        });

        test('an id that is not a contact id is passed through unchanged', function (assert) {
            assert.strictEqual(this.store.createRecord('contact', { public_id: 'customer_abc123' }).customerId, 'customer_abc123');
        });
    });

    test('has_place follows the place identifier rather than the loaded record', function (assert) {
        const contact = this.store.createRecord('contact');

        assert.false(contact.has_place);

        contact.set('place_uuid', 'place_1');
        assert.true(contact.has_place);
    });
});
