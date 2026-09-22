> v0.2.2 ~ "Managed login state"

---
## Highlights

- **Driver and contact models expose their login state.** New read-only `is_staff_linked` and `login_status` attributes let the console show Reset Password, Send Credentials and Deactivate/Reactivate Login. They also lock email and phone on a profile linked to a team member's account.
- **The login account is never sent back.** Driver and contact login accounts are now managed by the server from the profile's name, email and phone (fleetbase/fleetops#338). The driver serializer no longer sends `user_uuid` or the login fields. The contact serializer no longer sends `user`, `user_uuid` or the login fields.

---
## Need help?
- [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
- [Discord](https://discord.gg/HnTqQ6zAVn)
