import Application from 'dummy/app';
import config from 'dummy/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { sendCoverage } from 'ember-cli-code-coverage/test-support';
import loadAddonModules from './helpers/load-addon-modules';

// Evaluate every addon module before the suite starts so that files without a
// dedicated test still appear in the coverage report (at 0%) rather than
// vanishing from the denominator. See tests/helpers/load-addon-modules.js.
loadAddonModules();

setApplication(Application.create(config.APP));

setup(QUnit.assert);

// Ship the instrumented counters to the ember-cli-code-coverage middleware once
// the whole suite has run. Without this the browser collects coverage that is
// never written to disk. It is a no-op when COVERAGE is not set, because nothing
// populated `window.__coverage__`.
QUnit.done(async function () {
    await sendCoverage();
});

start();
