import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, FIXED_DATE_SHORT, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | service area', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'service-area', {
            zones: { kind: 'hasMany', type: 'zone', async: false },
            custom_field_values: { kind: 'hasMany', type: 'custom-field-value', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('service-area'),
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
            this.store.createRecord('service-area'),
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

    module('geography', function () {
        test('coordinates reads the outer ring of the border', function (assert) {
            const record = this.store.push(
                this.store.normalize('service-area', {
                    uuid: 'service-area_1',
                    border: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [103.8, 1.35],
                                    [103.9, 1.36],
                                ],
                            ],
                        ],
                    },
                })
            );

            assert.deepEqual(record.coordinates, [
                [103.8, 1.35],
                [103.9, 1.36],
            ]);
        });

        test('coordinates is empty when no border has been drawn', function (assert) {
            assert.deepEqual(this.store.createRecord('service-area').coordinates, []);
        });

        test('leafletCoordinates flips each pair into latitude-first order', function (assert) {
            const record = this.store.push(
                this.store.normalize('service-area', {
                    uuid: 'service-area_2',
                    border: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [103.8, 1.35],
                                    [103.9, 1.36],
                                ],
                            ],
                        ],
                    },
                })
            );

            assert.deepEqual(record.leafletCoordinates, [
                [1.35, 103.8],
                [1.36, 103.9],
            ]);
        });

        test('firstCoordinatePair is the first vertex, latitude first', function (assert) {
            const record = this.store.push(
                this.store.normalize('service-area', {
                    uuid: 'service-area_3',
                    border: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [103.8, 1.35],
                                    [103.9, 1.36],
                                ],
                            ],
                        ],
                    },
                })
            );

            assert.deepEqual(record.firstCoordinatePair, [1.35, 103.8]);
            assert.strictEqual(record.firstCoordinatePairLatitude, 1.35);
            assert.strictEqual(record.firstCoordinatePairLongitude, 103.8);
        });

        test('firstCoordinatePair falls back to the origin for an undrawn area', function (assert) {
            const record = this.store.createRecord('service-area');

            assert.deepEqual(record.firstCoordinatePair, [0, 0]);
            assert.strictEqual(record.firstCoordinatePairLatitude, 0);
            assert.strictEqual(record.firstCoordinatePairLongitude, 0);
        });
    });
});
