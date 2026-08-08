import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | asset', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'asset', {
            category: { kind: 'belongsTo', type: 'category', async: false },
            vendor: { kind: 'belongsTo', type: 'vendor', async: false },
            warranty: { kind: 'belongsTo', type: 'warranty', async: false },
            telematic: { kind: 'belongsTo', type: 'telematic', async: false },
            current_place: { kind: 'belongsTo', type: 'place', async: false },
            photo: { kind: 'belongsTo', type: 'file', async: false },
            devices: { kind: 'hasMany', type: 'device', async: false },
            equipments: { kind: 'hasMany', type: 'equipment', async: false },
            maintenances: { kind: 'hasMany', type: 'maintenance', async: false },
            sensors: { kind: 'hasMany', type: 'sensor', async: false },
            parts: { kind: 'hasMany', type: 'part', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('asset'),
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
            this.store.createRecord('asset'),
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

    test('deleted_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('asset'),
            'deleted_at',
            {
                deletedAt: FIXED_DATE_LONG,
                deletedAtShort: FIXED_DATE_SHORT,
            },
            {
                deletedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('yearMakeModel joins the parts that are present and omits the rest', function (assert) {
        assert.strictEqual(this.store.createRecord('asset', { year: '2020', make: 'Ford', model: 'Transit' }).yearMakeModel, '2020 Ford Transit');
        assert.strictEqual(this.store.createRecord('asset', { make: 'Ford' }).yearMakeModel, 'Ford');
        assert.strictEqual(this.store.createRecord('asset').yearMakeModel, '');
    });
});
