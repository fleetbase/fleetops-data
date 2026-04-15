import ApplicationAdapter from '@fleetbase/ember-core/adapters/application';

export default class ManifestStopAdapter extends ApplicationAdapter {
    urlForFindRecord(id) {
        return `${this.host}/${this.namespace}/fleet-ops/v1/manifest-stops/${id}`;
    }

    urlForUpdateRecord(id) {
        return `${this.host}/${this.namespace}/fleet-ops/v1/manifest-stops/${id}`;
    }
}
