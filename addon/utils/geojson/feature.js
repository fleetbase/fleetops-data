import GeoJson from './geo-json';

export default class Feature extends GeoJson {
    constructor(input) {
        super();

        if (input && input.type === 'Feature') {
            Object.assign(this, input);
        } else if (input && input.type && input.coordinates) {
            this.geometry = input;
        } else if (input && input.geometry instanceof GeoJson) {
            this.geometry = input.geometry.toJSON();
        } else if (input && input instanceof GeoJson) {
            this.geometry = input.toJSON();
        } else {
            throw 'GeoJSON: invalid input for new Feature';
        }

        this.type = 'Feature';
    }
}
