import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import ENV from 'dummy/config/environment';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | vendor', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'vendor', {
            place: { kind: 'belongsTo', type: 'place' },
            personnels: { kind: 'hasMany', type: 'contact' },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('image defaults come from application configuration rather than being hard-coded', function (assert) {
        const record = this.store.createRecord('vendor');

        assert.strictEqual(record.logo_url, ENV.defaultValues.vendorImage, 'logo_url falls back to defaultValues.vendorImage');
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('vendor'),
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
            this.store.createRecord('vendor'),
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
});
