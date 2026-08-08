import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_TIME, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | manifest stop', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'manifest-stop', {
            manifest: { kind: 'belongsTo', type: 'manifest', async: false, inverse: 'stops' },
            order: { kind: 'belongsTo', type: 'order', async: false },
            place: { kind: 'belongsTo', type: 'place', async: false },
        });
    });

    test('estimated_arrival renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest-stop'),
            'estimated_arrival',
            {
                estimatedArrivalFormatted: FIXED_DATE_TIME,
            },
            {}
        );
    });

    test('actual_arrival renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest-stop'),
            'actual_arrival',
            {
                actualArrivalFormatted: FIXED_DATE_TIME,
            },
            {}
        );
    });

    module('status lifecycle', function () {
        const STATUSES = { pending: 'isPending', arrived: 'isArrived', completed: 'isCompleted', skipped: 'isSkipped' };

        test('exactly one status flag is true at a time', function (assert) {
            const stop = this.store.createRecord('manifest-stop');

            for (const status of Object.keys(STATUSES)) {
                stop.set('status', status);

                for (const [otherStatus, flag] of Object.entries(STATUSES)) {
                    assert.strictEqual(stop[flag], status === otherStatus, `${flag} is ${status === otherStatus} while the stop is ${status}`);
                }
            }
        });

        test('statusLabel renders each status for display', function (assert) {
            const stop = this.store.createRecord('manifest-stop');

            assert.deepEqual(
                Object.keys(STATUSES).map((status) => {
                    stop.set('status', status);
                    return stop.statusLabel;
                }),
                ['Pending', 'Arrived', 'Completed', 'Skipped']
            );
        });

        test('statusLabel passes an unrecognized status through untranslated', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest-stop', { status: 'failed' }).statusLabel, 'failed');
        });
    });

    module('derived display values', function () {
        test('distanceFromPrevKm converts metres to one decimal place', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest-stop', { distance_from_prev_m: 2450 }).distanceFromPrevKm, '2.5');
        });

        test('distanceFromPrevKm is null for the first stop, which has no leg before it', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest-stop').distanceFromPrevKm, null);
            assert.strictEqual(this.store.createRecord('manifest-stop', { distance_from_prev_m: 0 }).distanceFromPrevKm, null, 'a zero-length leg reads the same way');
        });

        test('stopLabel numbers the stop by its sequence', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest-stop', { sequence: 3 }).stopLabel, 'Stop 3');
        });

        test('stopLabel of an unsequenced stop still renders', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest-stop').stopLabel, 'Stop undefined');
        });
    });
});
