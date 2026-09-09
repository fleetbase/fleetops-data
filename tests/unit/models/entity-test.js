import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertDefaults, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | entity', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'entity', {
            payload: { kind: 'belongsTo', type: 'payload' },
            customer: { kind: 'belongsTo', type: 'customer', async: false, polymorphic: true },
            supplier: { kind: 'belongsTo', type: 'vendor' },
            driver: { kind: 'belongsTo', type: 'driver' },
            trackingNumber: { kind: 'belongsTo', type: 'tracking-number' },
            destination: { kind: 'belongsTo', type: 'place' },
            photo: { kind: 'belongsTo', type: 'file' },
        });
    });

    test('a new record applies its configured defaults', function (assert) {
        assertDefaults(assert, this.store.createRecord('entity'), {
            photo_url: 'https://flb-assets.s3-ap-southeast-1.amazonaws.com/static/parcels/medium.png',
            currency: 'USD',
            weight_unit: 'g',
            dimensions_unit: 'cm',
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('entity'),
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
            this.store.createRecord('entity'),
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

    module('dimension display', function () {
        test('dimensions renders width by height by depth with the unit', function (assert) {
            const entity = this.store.createRecord('entity', { length: '30', width: '20', height: '10', dimensions_unit: 'cm' });

            assert.strictEqual(entity.dimensions, '30x20x10 cm');
        });

        test('each individual dimension is rendered with its unit', function (assert) {
            const entity = this.store.createRecord('entity', { length: '30', width: '20', height: '10', dimensions_unit: 'cm' });

            assert.strictEqual(entity.displayLength, '30cm');
            assert.strictEqual(entity.displayWidth, '20cm');
            assert.strictEqual(entity.displayHeight, '10cm');
        });

        test('weight is rendered with its own unit, which defaults to grams', function (assert) {
            const entity = this.store.createRecord('entity', { weight: '500' });

            assert.strictEqual(entity.displayWeight, '500g');
        });
    });
});
