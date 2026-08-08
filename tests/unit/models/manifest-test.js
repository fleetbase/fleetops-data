import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_DAY_MONTH_YEAR, FIXED_DATE_LONG, THREE_DAYS_DISTANCE, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | manifest', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('relationships target the right models with the right loading strategy', function (assert) {
        assertRelationships(assert, this.store, 'manifest', {
            driver: { kind: 'belongsTo', type: 'driver', async: false },
            vehicle: { kind: 'belongsTo', type: 'vehicle', async: false },
            stops: { kind: 'hasMany', type: 'manifest-stop', async: false },
        });
    });

    test('updated_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'updated_at',
            {
                updatedAt: FIXED_DATE_LONG,
            },
            {
                updatedAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('created_at renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'created_at',
            {
                createdAt: FIXED_DATE_LONG,
            },
            {
                createdAgo: THREE_DAYS_DISTANCE,
            }
        );
    });

    test('scheduled_date renders its formatting getters', function (assert) {
        assertDateGetters(
            assert,
            this.store.createRecord('manifest'),
            'scheduled_date',
            {
                scheduledDateFormatted: FIXED_DATE_DAY_MONTH_YEAR,
            },
            {}
        );
    });

    module('status lifecycle', function () {
        const STATUSES = { draft: 'isDraft', active: 'isActive', in_progress: 'isInProgress', completed: 'isCompleted', cancelled: 'isCancelled' };

        test('exactly one status flag is true at a time', function (assert) {
            const manifest = this.store.createRecord('manifest');

            for (const status of Object.keys(STATUSES)) {
                manifest.set('status', status);

                for (const [otherStatus, flag] of Object.entries(STATUSES)) {
                    assert.strictEqual(manifest[flag], status === otherStatus, `${flag} is ${status === otherStatus} while the manifest is ${status}`);
                }
            }
        });

        test('no flag is true for an unknown status', function (assert) {
            const manifest = this.store.createRecord('manifest', { status: 'archived' });

            for (const flag of Object.values(STATUSES)) {
                assert.false(manifest[flag], `${flag} is false`);
            }
        });

        test('statusLabel renders each lifecycle status for display', function (assert) {
            const manifest = this.store.createRecord('manifest');

            assert.deepEqual(
                Object.keys(STATUSES).map((status) => {
                    manifest.set('status', status);
                    return manifest.statusLabel;
                }),
                ['Draft', 'Active', 'In Progress', 'Completed', 'Cancelled']
            );
        });

        test('statusLabel passes an unrecognized status through untranslated', function (assert) {
            const manifest = this.store.createRecord('manifest', { status: 'archived' });

            assert.strictEqual(manifest.statusLabel, 'archived', 'a new backend status is shown rather than swallowed');
        });

        test('statusLabel of an unset status is the unset status itself', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest').statusLabel, undefined);
        });
    });

    module('progress and totals', function () {
        test('progressPercent is the completed share of the stop count, rounded', function (assert) {
            const manifest = this.store.createRecord('manifest', { stop_count: 3, completed_stops: 1 });

            assert.strictEqual(manifest.progressPercent, 33, '1 of 3 rounds to 33%');

            manifest.set('completed_stops', 3);
            assert.strictEqual(manifest.progressPercent, 100);
        });

        test('progressPercent treats a manifest with no stops as zero rather than dividing by zero', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest', { stop_count: 0, completed_stops: 0 }).progressPercent, 0);
            assert.strictEqual(this.store.createRecord('manifest').progressPercent, 0, 'and an unset stop count does the same');
        });

        test('progressPercent treats a missing completed count as none completed', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest', { stop_count: 4 }).progressPercent, 0);
        });

        test('totalDistanceKm converts metres to one decimal place', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest', { total_distance_m: 12345 }).totalDistanceKm, '12.3');
        });

        test('totalDistanceKm reads as zero when the plan has no distance yet', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest').totalDistanceKm, '0.0');
            assert.strictEqual(this.store.createRecord('manifest', { total_distance_m: 0 }).totalDistanceKm, '0.0');
        });

        test('totalDurationFormatted shows hours and minutes once the plan passes an hour', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest', { total_duration_s: 3600 + 25 * 60 }).totalDurationFormatted, '1h 25m');
        });

        test('totalDurationFormatted shows minutes only for a short plan', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest', { total_duration_s: 25 * 60 }).totalDurationFormatted, '25m');
        });

        test('totalDurationFormatted reads as zero when the plan has no duration yet', function (assert) {
            assert.strictEqual(this.store.createRecord('manifest').totalDurationFormatted, '0m');
            assert.strictEqual(this.store.createRecord('manifest', { total_duration_s: 0 }).totalDurationFormatted, '0m');
        });
    });
});
