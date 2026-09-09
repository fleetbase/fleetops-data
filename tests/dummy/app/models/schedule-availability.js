import Model, { attr } from '@ember-data/model';

/**
 * Minimal stand-in for the `schedule-availability` model, which real host applications
 * supply (from `@fleetbase/ember-core` or a sibling engine) but this addon does
 * not define. Fleet-Ops models declare relationships to it, and Ember Data needs
 * a registered class before those relationships can be resolved at all.
 *
 * Deliberately thin: nothing in this suite asserts `schedule-availability` behaviour, only
 * that Fleet-Ops wires up to it correctly.
 */
export default class ScheduleAvailabilityModel extends Model {
    @attr('string') name;
    @attr('string') uuid;
}
