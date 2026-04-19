# iFound Test Flow Document

Project: iFound QR Lost & Found Platform  
Prepared On: April 17, 2026

| Module | TestID | Test Name | Steps | Expected Result | Actual Result | Result PASS/FAIL |
|---|---|---|---|---|---|---|
| Authentication | AUTH-001 | Owner Sign Up With Email On Web | Open `/login` on web. Click `Continue with Email`. Select `Sign up`. Enter valid email. Enter valid password and confirm password. Click `Create account`. Enter OTP received on email. | Account is created. User is signed in. User is routed to dashboard. Email is linked to account. |  |  |
| Authentication | AUTH-002 | Owner Sign Up With Phone On Web | Open `/login`. Enter phone number with valid India or Singapore number. Select `Sign up`. Continue. Enter OTP. | Account is created. User is signed in after OTP flow. Phone number is attached to account. |  |  |
| Authentication | AUTH-003 | Owner Sign In With Email On Web | Open `/login`. Enter registered email. Enter valid password. Click `Continue`. | User is authenticated and routed to dashboard. |  |  |
| Authentication | AUTH-004 | Owner Sign In With Phone OTP On Web | Open `/login`. Enter registered phone number. Click `Continue`. Enter OTP. | User is authenticated and routed to dashboard. |  |  |
| Authentication | AUTH-005 | Owner Sign In With Google On Web | Open `/login`. Click `Google`. Complete provider sign in. | User is authenticated and routed to dashboard. Existing account should reuse same user identity when matching account exists. |  |  |
| Authentication | AUTH-006 | Owner Sign In With Apple On Web | Open `/login`. Click `Apple`. Complete provider sign in. | User is authenticated and routed to dashboard. Existing account should reuse same user identity when matching account exists. |  |  |
| Authentication | AUTH-007 | Existing Signed In User Opens Login Page | Sign in first. Open `/login`. | User is redirected out of login and taken to dashboard. |  |  |
| Authentication | AUTH-008 | Home Page Signed In State | Sign in. Open `/`. | Home page shows dashboard and sign out actions instead of sign in only state. |  |  |
| Authentication | AUTH-009 | Home Page Signed Out State | Ensure no session exists. Open `/`. | Home page shows sign in and get started actions. |  |  |
| Authentication | AUTH-010 | Invalid Email Login | Open `/login`. Enter invalid email or wrong password. Continue. | Proper validation or auth error is shown. User is not logged in. |  |  |
| Authentication | AUTH-011 | Invalid Phone OTP | Open `/login`. Use phone login. Enter wrong OTP. | Verification fails with clear error. Session is not created. |  |  |
| Authentication | AUTH-012 | Existing Email Account During Signup | Start email sign up using email already registered. | UI shows existing account message and prompts user to continue sign in/link flow. |  |  |
| Authentication | AUTH-013 | Google Sign In Matches Existing Email Account | Create account with email first. Sign out. Sign in with Google using same email. | Same user identity is reused. No duplicate customer account is created for business flow. |  |  |
| Authentication | AUTH-014 | Mobile App Sign Up With Email | Open mobile app. Navigate to sign up. Use email registration and OTP/verification flow. | Account is created and accessible in app. |  |  |
| Authentication | AUTH-015 | Mobile App Sign Up With Phone | Open mobile app. Use phone registration flow and complete OTP. | Account is created and accessible in app. |  |  |
| Authentication | AUTH-016 | Mobile App Social Sign In | Open mobile app. Use Google or Apple sign in. | User signs in successfully and reaches owner app home/dashboard. |  |  |
| Authentication | AUTH-017 | Sign Out On Web | Sign in. Click sign out from home or dashboard. | Session is cleared and user returns to signed out state. |  |  |
| Authentication | AUTH-018 | Sign Out On Mobile App | Sign in on mobile app. Tap sign out. | Session is cleared and login screen is shown. |  |  |
| Superadmin QR Inventory | QRADM-001 | Admin Access To QR Inventory | Sign in as Admin. Open `dashboard/qr-codes`. | Admin sees QR inventory mode, not owner registration-only mode. |  |  |
| Superadmin QR Inventory | QRADM-002 | Admin Generate Pack Of 4 | Sign in as Admin. Open QR inventory page. Click `Generate QR Packs`. Select pack size `4`. Enter pack count `1`. Save. | 4 unique QR codes are created with same pack ID and marked `UNASSIGNED`. |  |  |
| Superadmin QR Inventory | QRADM-003 | Admin Generate Pack Of 10 | Sign in as Admin. Open QR inventory page. Click `Generate QR Packs`. Select pack size `10`. Enter pack count `1`. Save. | 10 unique QR codes are created with same pack ID and marked `UNASSIGNED`. |  |  |
| Superadmin QR Inventory | QRADM-004 | Admin Generate Multiple Packs | Select pack size and enter pack count greater than 1. Save. | Correct number of packs and QR codes are created. Each pack has separate pack ID. |  |  |
| Superadmin QR Inventory | QRADM-005 | Admin Batch Label Saved | Generate pack with batch label. Reload page. | Generated QR rows show batch label in pack details. |  |  |
| Superadmin QR Inventory | QRADM-006 | Admin Download QR Image | On inventory page click `Download QR` for an unassigned code. | QR image downloads or opens correctly. Encoded target points to `/found/<code>`. |  |  |
| Superadmin QR Inventory | QRADM-007 | Generated Codes Are Unique | Generate multiple packs. Compare QR code values. | No duplicate QR code values exist. |  |  |
| Superadmin QR Inventory | QRADM-008 | Admin Cannot Accidentally Register Inventory As Owner | While signed in as Admin, open QR inventory page. | Admin mode does not expose owner registration form as primary flow. |  |  |
| Superadmin QR Inventory | QRADM-009 | Admin View Assigned QR Codes | After owner registers some QR codes, open admin QR inventory page. | Admin sees assigned QR codes along with unassigned inventory. |  |  |
| Superadmin QR Inventory | QRADM-010 | Admin Inventory After Owner Registration | Generate a QR pack. Register one QR code from owner account. Return to admin page. | Registered code moves from `UNASSIGNED` to `ASSIGNED`. Owner info appears. |  |  |
| Superadmin Manage Users | ADM-001 | Admin Open App User Table | Sign in as Admin. Open `/dashboard/users`. | App user table loads from User table with real rows. |  |  |
| Superadmin Manage Users | ADM-002 | Admin Open Cognito Manage Route | Sign in as Admin. Open `/dashboard/manage-cognito`. | Real Cognito user pool users are listed. |  |  |
| Superadmin Manage Users | ADM-003 | Non Admin Cannot Open Cognito Manage Route | Sign in as Owner. Try `/dashboard/manage-cognito`. | Access is blocked and user is redirected or denied. |  |  |
| Superadmin Analytics | ANA-001 | Admin QR Analytics Inventory Counts | Generate packs and register some QR codes. Open admin QR inventory and dashboard pages. | Totals and states match created and assigned inventory. |  |  |
| Owner QR Registration | OWNQR-001 | Owner Open QR Registration Page On Web | Sign in as Owner. Open `dashboard/qr-codes`. | Owner sees `Register QR Code` action and own registered QR table. |  |  |
| Owner QR Registration | OWNQR-002 | Register Valid QR Code | Sign in as Owner. Click `Register QR Code`. Enter valid unassigned QR code. Enter item name, category, optional description. Submit. | QR code is validated, valuable record is created, QR becomes assigned to owner. |  |  |
| Owner QR Registration | OWNQR-003 | Register Invalid QR Code | Enter QR code that does not exist. Submit. | Registration is rejected with clear validation error. |  |  |
| Owner QR Registration | OWNQR-004 | Register Already Assigned QR Code | Enter QR code already assigned to some owner. Submit. | Registration is rejected with clear validation error. |  |  |
| Owner QR Registration | OWNQR-005 | Register QR Code With Empty Item Name | Enter valid QR code but leave item name blank. Submit. | Validation blocks submission. |  |  |
| Owner QR Registration | OWNQR-006 | Register QR Code With Missing Category | Enter valid QR code and item name but no category. Submit. | Validation blocks submission. |  |  |
| Owner QR Registration | OWNQR-007 | Registered QR Appears In Owner Table | Register valid QR code. Reload page. | QR appears in owner QR table with item details. |  |  |
| Owner QR Registration | OWNQR-008 | QR Landing URL Works After Registration | Register valid QR code. Open generated `/found/<code>` URL. | Dynamic found page loads correct item and owner details. |  |  |
| Owner QR Registration | OWNQR-009 | Edit Registered QR Details | Register QR code. Use edit action. Update item name/category/description. Save. | Updated values are saved and visible in table and found page. |  |  |
| Owner QR Registration | OWNQR-010 | Retire Assigned QR Code | Register QR code. Use retire action. | QR status changes to retired/inactive. Finder flow should reflect retired behavior if configured. |  |  |
| Owner QR Registration | OWNQR-011 | Reactivate Retired QR Code | Retire QR code first. Use reactivate action. | QR returns to active assigned state. |  |  |
| Owner QR Registration | OWNQR-012 | Download Assigned QR Code | Register QR code. Use download action. | QR image downloads or opens successfully. |  |  |
| Owner QR Registration | OWNQR-013 | Owner Mobile App Register Valid QR Code | Sign in on mobile app. Use QR registration flow if available in app. Scan or enter valid unassigned code. Add item details. Save. | QR is validated and assigned to owner. |  |  |
| Owner QR Registration | OWNQR-014 | Owner Mobile App Register Invalid QR Code | Use invalid or already assigned code in app registration flow. | App shows validation error and prevents registration. |  |  |
| Owner QR Registration | OWNQR-015 | Owner Sees Registered QR On Web And Mobile | Register QR from web, then open mobile app. | Registered QR is visible on both platforms under same account. |  |  |
| Owner Settings | OWNSET-001 | Add Email After Social Sign In | Sign in with Google or Apple. Open settings. Add email and verify it. | Email is saved and verified for same account. |  |  |
| Owner Settings | OWNSET-002 | Add Phone After Social Sign In | Sign in with Google or Apple. Open settings. Add phone and verify OTP. | Phone is saved and verified for same account. |  |  |
| Owner Settings | OWNSET-003 | Link Google To Existing Email Account | Sign up with email. Open settings. Link Google. | Same account remains linked with Google. |  |  |
| Owner Settings | OWNSET-004 | Link Apple To Existing Email Account | Sign up with email. Open settings. Link Apple. | Same account remains linked with Apple. |  |  |
| Owner Settings | OWNSET-005 | Set Password For Social Account | Sign in with Google or Apple. Open settings. Set password. | User can sign in later with email/password using same account. |  |  |
| Owner Messaging | MSG-001 | Finder Send Message From QR Landing On Web | Open `/found/<code>` for valid assigned QR. Click `Send Message`. Enter message and optional contact. Submit. | Message is saved and owner is notified according to system behavior. |  |  |
| Owner Messaging | MSG-002 | Finder Send Message From Mobile Browser | Open same QR link in mobile browser. Send message. | Message is saved successfully and owner side can see it. |  |  |
| Owner Messaging | MSG-003 | Owner Activity Logs Message Event | Finder sends message to owner QR. Owner opens activity page. | Activity page shows message event with item and timestamp. |  |  |
| Owner Messaging | MSG-004 | Message Tied To Correct Owner | Use QR assigned to Owner A. Finder sends message. | Message record belongs only to Owner A. |  |  |
| Owner Calls | CALL-001 | Finder Start Audio Call To Correct Owner | Assign QR to owner. Owner joins call page. Finder opens found page and starts audio call. | Finder joins correct room. Owner receives/participates in same room. |  |  |
| Owner Calls | CALL-002 | Finder Start Video Call To Correct Owner | Assign QR to owner. Owner joins supported call flow. Finder starts video call. | Finder is routed to correct owner meeting session. |  |  |
| Owner Calls | CALL-003 | Call Event Logged In Activity | Finder starts call from QR page. Owner opens activity. | Call event appears in activity log. |  |  |
| Owner Calls | CALL-004 | Wrong Owner Is Not Reached | Use QR belonging to Owner A while Owner B is also online. Finder starts call. | Call is routed only to Owner A room. |  |  |
| Finder QR Landing | FIND-001 | Valid Assigned QR Opens Dynamic Found Page | Open `/found/<valid assigned code>`. | Page shows correct item name, category, description, and owner context. |  |  |
| Finder QR Landing | FIND-002 | Invalid QR Shows Error State | Open `/found/<invalid code>`. | Page shows QR unavailable or not found state. |  |  |
| Finder QR Landing | FIND-003 | Unassigned QR Behavior | Open `/found/<valid unassigned code>`. | System shows unavailable or unassigned safe state and does not expose owner actions. |  |  |
| Finder QR Landing | FIND-004 | Initial Scan Is Logged | Open valid assigned QR link. | Initial scan event is recorded in backend and visible in owner activity. |  |  |
| Finder QR Landing | FIND-005 | Finder Privacy Text Visible | Open valid found page. | Page clearly indicates finder location or private contact data is not exposed unnecessarily. |  |  |
| Dashboard Activity | ACT-001 | Owner Activity Page Loads Real Data | Sign in as Owner. Open `/dashboard/activity`. | Real scans, calls, and messages are shown. |  |  |
| Dashboard Activity | ACT-002 | Today Scan Count Is Accurate | Trigger some scans for owner QR codes today. Open activity page. | Today scans summary matches actual events. |  |  |
| Dashboard Activity | ACT-003 | Contact Attempts Count Is Accurate | Trigger messages and calls. Open activity page. | Contact attempts summary matches total call and message events. |  |  |
| Dashboard Activity | ACT-004 | Unique Locations Count Is Accurate | Trigger scans with different location values where available. | Unique location count updates correctly. |  |  |
| Dashboard Activity | ACT-005 | Export Activity CSV | Open activity page. Click export. | CSV is generated with activity rows. |  |  |
| Dashboard Analytics | DASH-001 | Owner Dashboard Loads Aggregated Analytics | Sign in as Owner. Open dashboard. | Dashboard shows real scans, contacts, revenue, and subscription metrics from analytics store. |  |  |
| Dashboard Analytics | DASH-002 | Payments Page Loads Real Analytics | Open `/dashboard/payments`. | Revenue, MRR, active subscriptions, average transaction and payment table are real. |  |  |
| Dashboard Analytics | DASH-003 | Analytics Update After New Scan | Register QR. Open found page to generate scan. Refresh dashboard/activity. | Scan metrics and activity update correctly. |  |  |
| Dashboard Analytics | DASH-004 | Analytics Update After Message | Finder sends message. Refresh dashboard/activity. | Contact/message metrics update correctly. |  |  |
| Dashboard Analytics | DASH-005 | Analytics Update After Payment | Create or record owner payment. Refresh payments/dashboard. | Revenue and payment metrics update correctly. |  |  |
| Dashboard Analytics | DASH-006 | Analytics Update After Subscription Change | Create or update owner subscription. Refresh payments/dashboard. | Subscription totals and statuses update correctly. |  |  |
| Payments | PAY-001 | Owner Payment Table Shows Real Payments | Open `/dashboard/payments`. | Only real owner payments are listed with correct amounts and statuses. |  |  |
| Payments | PAY-002 | Payment Export CSV | Open payments page. Export. | CSV downloads with payment rows. |  |  |
| Payments | PAY-003 | Payment Status Mapping | Ensure payments exist with pending, paid, failed, refunded. Open payments page. | UI status labels match backend status values correctly. |  |  |
| Users | USR-001 | Admin App User Table Loads Real Users | Open `/dashboard/users` as Admin. | Users are shown from app user table with QR count and latest plan. |  |  |
| Users | USR-002 | App User Table Search | Search by user name or email. | Matching rows are filtered correctly. |  |  |
| Users | USR-003 | App User Table Status Filter | Filter by status. | Only rows with selected status are shown. |  |  |
| Users | USR-004 | App User Table Plan Filter | Filter by plan. | Only rows with selected plan are shown. |  |  |
| Cognito Manage | COG-001 | Admin Opens Cognito Manage Page | Open `/dashboard/manage-cognito` as Admin. | Real Cognito users load. |  |  |
| Cognito Manage | COG-002 | Provider Detection On Cognito Manage Page | Ensure native and Google users exist. Open manage page. | Provider column correctly identifies Cognito and Google users. |  |  |
| Cognito Manage | COG-003 | Groups Display On Cognito Manage Page | Ensure Admin and Owner users exist. | Group memberships display correctly. |  |  |
| Cognito Manage | COG-004 | Disabled User Visibility | Disable a Cognito user through admin action or console. Open page. | User appears as disabled. |  |  |
| Legal | LEG-001 | Terms Page Loads | Open `/terms`. | Terms page loads with header and footer. |  |  |
| Legal | LEG-002 | Privacy Page Loads | Open `/privacy`. | Privacy page loads with header and footer. |  |  |
| Legal | LEG-003 | Login Links Open Legal Pages | Open `/login`. Click Terms and Privacy links. | Correct legal pages open. |  |  |
| Legal | LEG-004 | Footer Links Open Legal Pages | Open `/`. Click legal links in footer. | Correct legal pages open. |  |  |
| Cross Platform | XPLAT-001 | Owner Registers QR On Web And Views On Mobile | Register QR on web. Open mobile app with same account. | QR assignment appears in mobile app. |  |  |
| Cross Platform | XPLAT-002 | Owner Registers QR On Mobile And Views On Web | Register QR on mobile app. Open web dashboard. | QR assignment appears in web dashboard. |  |  |
| Cross Platform | XPLAT-003 | Finder Web Action Visible On Owner Mobile | Finder scans and messages via web. Owner opens mobile app. | Relevant item/activity is visible to owner. |  |  |
| Cross Platform | XPLAT-004 | Finder Web Action Visible On Owner Web | Finder scans and messages. Owner opens web dashboard. | Relevant item/activity is visible to owner. |  |  |
| Security & Validation | SEC-001 | Owner Cannot Assign Random Nonexistent Code | Try registering arbitrary QR code string not pre-generated. | System rejects registration. |  |  |
| Security & Validation | SEC-002 | Owner Cannot Reassign Another Owner Code | Try registering a code already assigned to someone else. | System rejects registration. |  |  |
| Security & Validation | SEC-003 | Guest Cannot Open Admin Routes | Open admin routes without sign in or as non-admin. | Access is blocked. |  |  |
| Security & Validation | SEC-004 | Owner Cannot Generate QR Inventory Packs | Sign in as Owner. Open QR page. | Owner cannot access bulk inventory generation flow. |  |  |
| Security & Validation | SEC-005 | QR Registration Uses Valid Backend State | Register valid code twice in quick succession from different sessions. | Only first succeeds. Second is rejected as already assigned. |  |  |

