# iFound Quick Sanity Test Checklist

Prepared On: April 17, 2026

Use this checklist after major backend, auth, QR, messaging, calling, or analytics changes.

| Module | TestID | Test Name | Steps | Expected Result | Actual Result | Result PASS/FAIL |
|---|---|---|---|---|---|---|
| Authentication | SAN-001 | Owner Login With Email | Open `/login`. Sign in with valid owner email and password. | Owner is routed to `/dashboard`. |  |  |
| Authentication | SAN-002 | Owner Login With Google | Open `/login`. Click `Google`. Complete sign in. | Owner is routed to `/dashboard` without duplicate-account issue. |  |  |
| Authentication | SAN-003 | Home Signed-In State | While signed in, open `/`. | Home page shows `Go to Dashboard` and `Sign Out`. |  |  |
| Superadmin QR Inventory | SAN-004 | Admin Generate QR Pack | Sign in as Admin. Open `/dashboard/qr-codes`. Generate 1 pack of 4. | 4 new QR codes are created as `UNASSIGNED`. |  |  |
| Owner QR Registration | SAN-005 | Owner Register Valid QR Code | Sign in as Owner. Open `/dashboard/qr-codes`. Register one QR code from admin-generated pack with item details. | Registration succeeds and QR appears in owner list as assigned. |  |  |
| Owner QR Registration | SAN-006 | Owner Reject Invalid QR Code | Try registering a fake QR code. | Registration is blocked with validation error. |  |  |
| Finder Flow | SAN-007 | Finder Open Found Page | Open `/found/<registered-qr-code>` in another browser/incognito. | Dynamic item page loads with correct item details. |  |  |
| Finder Flow | SAN-008 | Finder Send Message | From found page, send a message with optional contact. | Message succeeds and owner activity records it. |  |  |
| Finder Flow | SAN-009 | Finder Start Audio Call | Owner joins `/dashboard/calls`. Finder starts `Audio Call Owner` from found page. | Finder joins correct owner room and call connects. |  |  |
| Activity | SAN-010 | Owner Activity Update | Owner opens `/dashboard/activity` after scan/message/call tests. | Activity page shows scan, message, and call entries. |  |  |
| Analytics | SAN-011 | Dashboard Metrics Update | Owner opens `/dashboard` after scan/message tests. | Dashboard metrics reflect current scans and contacts. |  |  |
| Payments | SAN-012 | Payments Page Loads | Open `/dashboard/payments`. | Page loads real payment/subscription data and aggregated metrics. |  |  |
| Admin Users | SAN-013 | App Users Page Loads | Sign in as Admin. Open `/dashboard/users`. | Real users load from app user data. |  |  |
| Admin Cognito | SAN-014 | Cognito Manage Page Loads | Sign in as Admin. Open `/dashboard/manage-cognito`. | Real Cognito users load successfully. |  |  |
| Legal | SAN-015 | Legal Pages Load | Open `/terms` and `/privacy`. | Both pages load with header and footer. |  |  |

## Recommended Run Order

1. `SAN-001`
2. `SAN-004`
3. `SAN-005`
4. `SAN-007`
5. `SAN-008`
6. `SAN-009`
7. `SAN-010`
8. `SAN-011`
9. `SAN-012`
10. `SAN-013`
11. `SAN-014`
12. `SAN-015`

## Exit Criteria

Sanity run is considered acceptable when:

- all authentication checks pass
- one admin QR pack is generated successfully
- one owner QR registration succeeds
- invalid QR registration fails correctly
- found page loads for a registered QR
- message flow works
- call flow works
- activity and analytics update
- legal pages load

