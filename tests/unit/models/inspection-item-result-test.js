import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { assertAttributeTypes, assertRelationships } from 'dummy/tests/helpers/model-contract';

module('Unit | Model | inspection-item-result', function (hooks) {
    setupTest(hooks);

    test('it declares its attribute and relationship contract', function (assert) {
        const store = this.owner.lookup('service:store');

        assertAttributeTypes(assert, store, 'inspection-item-result', {
            inspection_submission_uuid: 'string',
            issue_uuid: 'string',
            work_order_uuid: 'string',
            item_key: 'string',
            status: 'string',
            severity: 'string',
            passed: 'boolean',
            photos: 'raw',
            created_at: 'date',
            updated_at: 'date',
        });
        assertRelationships(assert, store, 'inspection-item-result', {
            submission: { kind: 'belongsTo', type: 'inspection-submission', async: false, inverse: null },
            issue: { kind: 'belongsTo', type: 'issue', async: false, inverse: null },
            work_order: { kind: 'belongsTo', type: 'work-order', async: false, inverse: null },
        });
    });
});
