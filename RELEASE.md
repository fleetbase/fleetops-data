> v0.2.4 ~ "Adhoc dispatch, fare and rating fields"

---
## Highlights

- **Adhoc dispatch, fares and driver ratings.** Models gain the fields the console needs to set how adhoc orders are offered, added on the server in fleetbase/fleetops#424. ([#90](https://github.com/fleetbase/fleetops-data/pull/90))
  - `order`: `adhoc_strategy` (a strategy name, or null for the config or company default), `required_vehicle_type`, `fare_finalized_at` and `paid_at`.
  - `order-config`: `adhoc_strategy`, `adhoc_offer_timeout`, and `customer_orders_adhoc` and `match_vehicle_type`, which both default to false.
  - `driver`: `rating_average` and `rating_count`.

---
## Upgrading
These fields are only filled in by a Fleet-Ops server that includes fleetbase/fleetops#424. On an older server they stay empty.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
---
