> v0.2.4 ~ "Order config policies and triggers, adhoc dispatch and driver ratings"

---
## Highlights

- **Order config policies and triggers.** `order-config` gains `policies` and `triggers`, the generic settings Fleet-Ops uses to decide how a config's orders behave and what it does on order events. Examples are how adhoc orders are offered, what customers may do, and repricing on completion. They replace the separate adhoc columns that were added for a while during v0.2.4.
- **Adhoc dispatch and driver ratings.** The server-side fields are added in fleetbase/fleetops#424. ([#90](https://github.com/fleetbase/fleetops-data/pull/90))
  - `order`: `adhoc_strategy`, which is a strategy name, or null to use the config or company default; and `required_vehicle_type`.
  - `driver`: `rating_average` and `rating_count`.

---
## Upgrading
These fields are only filled in by a Fleet-Ops server that has order config policies (Fleet-Ops v0.7.0). On an older server they stay empty.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
---
