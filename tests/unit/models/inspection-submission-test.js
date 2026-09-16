import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { FIXED_DATE_LONG, assertAttributeTypes, assertDateGetters, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | inspection-submission', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
        this.store = this.owner.lookup('service:store');
    });

    test('it declares its attribute and relationship contract', function (assert) {
        assertAttributeTypes(assert, this.store, 'inspection-submission', {
            public_id: 'string',
            inspection_form_uuid: 'string',
            vehicle_uuid: 'string',
            driver_uuid: 'string',
            item_results: 'raw',
            status: 'string',
            result: 'string',
            odometer: 'number',
            total_items: 'number',
            failed_items: 'number',
            has_failures: 'boolean',
            started_at: 'date',
            submitted_at: 'date',
            resolved_at: 'date',
            created_at: 'date',
            updated_at: 'date',
        });
        assertRelationships(assert, this.store, 'inspection-submission', {
            form: { kind: 'belongsTo', type: 'inspection-form', async: false, inverse: null },
            vehicle: { kind: 'belongsTo', type: 'vehicle', async: false, inverse: null },
            driver: { kind: 'belongsTo', type: 'driver', async: false, inverse: null },
            submitted_by: { kind: 'belongsTo', type: 'user', async: false, inverse: null },
            issue: { kind: 'belongsTo', type: 'issue', async: false, inverse: null },
            work_order: { kind: 'belongsTo', type: 'work-order', async: false, inverse: null },
        });
    });

    test('displayName prefers the public id, then the form name, then a generic label', function (assert) {
        const submission = this.store.createRecord('inspection-submission');

        assert.strictEqual(submission.displayName, 'Inspection');

        submission.set('form_name', 'Pre-trip');
        assert.strictEqual(submission.displayName, 'Pre-trip');

        submission.set('public_id', 'submission_1');
        assert.strictEqual(submission.displayName, 'submission_1');
    });

    test('submitted_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-submission'), 'submitted_at', {
            submittedAt: FIXED_DATE_LONG,
        });
    });

    test('resolved_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-submission'), 'resolved_at', {
            resolvedAt: FIXED_DATE_LONG,
        });
    });

    test('created_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-submission'), 'created_at', {
            createdAt: FIXED_DATE_LONG,
        });
    });

    test('updated_at renders its formatting getter', function (assert) {
        assertDateGetters(assert, this.store.createRecord('inspection-submission'), 'updated_at', {
            updatedAt: FIXED_DATE_LONG,
        });
    });
});
