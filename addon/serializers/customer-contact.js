import CustomerSerializer from './customer';

/**
 * A contact loaded as an order's customer. It shares the contact serializer so
 * its embedded `place` and `places` resolve to the declared `place` model rather
 * than being looked up by each place's own `type` attribute (apartment, house, office...).
 */
export default class CustomerContactSerializer extends CustomerSerializer {}
