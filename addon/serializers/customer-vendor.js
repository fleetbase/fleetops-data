import CustomerSerializer from './customer';

/**
 * A vendor loaded as an order's customer. Like customer contacts, its embedded
 * `place` and `places` are normalized as the declared `place` model.
 */
export default class CustomerVendorSerializer extends CustomerSerializer {}
