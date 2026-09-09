import { module, test } from 'qunit';
import { setupTest } from 'dummy/tests/helpers';
import { EMBEDDED, assertEmbeddedAttrs, assertNormalizesUuidAsId, assertPrimaryKeyIsUuid } from 'dummy/tests/helpers/serializer-contract';

module('Unit | Serializer | inspection-submission', function (hooks) {
    setupTest(hooks);

    test('it keys records by uuid and embeds every related record', function (assert) {
        const store = this.owner.lookup('service:store');

        assertPrimaryKeyIsUuid(assert, store, 'inspection-submission');
        assertEmbeddedAttrs(assert, store, 'inspection-submission', {
            form: EMBEDDED,
            vehicle: EMBEDDED,
            driver: EMBEDDED,
            submitted_by: EMBEDDED,
            issue: EMBEDDED,
            work_order: EMBEDDED,
            item_results: EMBEDDED,
            custom_field_values: EMBEDDED,
        });
    });

    test('a server payload is normalized onto a record keyed by uuid', function (assert) {
        const submission = assertNormalizesUuidAsId(assert, this.owner.lookup('service:store'), 'inspection-submission', { status: 'submitted' });

        assert.strictEqual(submission.status, 'submitted');
    });
});
