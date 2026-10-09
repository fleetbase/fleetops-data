import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { helper } from '@ember/component/helper';
import { SHARED_RESOURCE_KEYS } from '@fleetbase/fleetops-data/utils/resource-descriptors';

/**
 * Each shared resource ships a pill, a summary, an identity cell and a
 * select option that only name the resource type and hand everything else
 * to the generic components the UI package provides. The UI package is not
 * part of this addon, so those generics are stubbed here with templates
 * that echo what they were given.
 */
module('Integration | Component | resource wrappers', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.owner.register(
            'helper:or',
            helper(([a, b, c]) => a ?? b ?? c)
        );
        this.owner.register('template:components/resource/pill', hbs`<span data-test-pill data-type={{@resourceType}}>{{@resource.name}}</span>`);
        this.owner.register('template:components/resource/summary', hbs`<span data-test-summary data-type={{@resourceType}}>{{@resource.name}}</span>`);
        this.owner.register('template:components/resource/select-option', hbs`<span data-test-option data-type={{@resourceType}}>{{@option.name}}</span>`);
        this.owner.register('template:components/table/cell/identity', hbs`<span data-test-cell data-type={{@resourceType}}>{{@row.name}}</span>`);
    });

    for (const key of SHARED_RESOURCE_KEYS) {
        test(`${key} wrappers resolve and pass the ${key} resource type through`, async function (assert) {
            this.set('record', { name: `A ${key}` });
            this.set('pill', `${key}/pill`);
            this.set('summary', `${key}/summary`);
            this.set('cell', `cell/${key}-identity`);
            this.set('option', `select-option/${key}`);

            await render(hbs`
                {{component this.pill resource=this.record}}
                {{component this.summary resource=this.record}}
                {{component this.cell row=this.record}}
                {{component this.option option=this.record}}
            `);

            assert.dom('[data-test-pill]').hasAttribute('data-type', key).hasText(`A ${key}`);
            assert.dom('[data-test-summary]').hasAttribute('data-type', key).hasText(`A ${key}`);
            assert.dom('[data-test-cell]').hasAttribute('data-type', key).hasText(`A ${key}`);
            assert.dom('[data-test-option]').hasAttribute('data-type', key).hasText(`A ${key}`);
        });
    }

    test('a pill still accepts the resource under its own name, as it always did', async function (assert) {
        this.set('driver', { name: 'Ada Driver' });

        await render(hbs`<Driver::Pill @driver={{this.driver}} />`);

        assert.dom('[data-test-pill]').hasAttribute('data-type', 'driver').hasText('Ada Driver');
    });
});
