# KOA-Manager: Offline Failover QA Test Script (Phase 1)

This document provides a rigorous, step-by-step Quality Assurance (QA) manual to stress-test the 14-day offline failover system of the KOA-Manager PWA. The application is designed to allow zoo keepers to continue recording critical husbandry, medical, and movement data even in areas with no Wi-Fi or cellular connectivity.

## How to Verify a Successful Sync
Before starting the tests, ensure you know how to verify that data has moved from your local device to the cloud:
1.  **PWA Diagnostics**: Navigate to **Settings > System Health**. The **PWA Diagnostics** card displays the status of "Offline Storage" (should be "Connected") and the "Last Sync" timestamp.
2.  **Optimistic UI**: When offline, the app will show your new records immediately in the lists. These are stored in your browser's local storage (IndexedDB/LocalStorage).
3.  **Cloud Confirmation**: Once back online, verify the record exists by refreshing the page or checking the **Supabase Dashboard** (for administrators). A successful sync is confirmed when the record persists after a hard browser refresh.

---

## Test Scenario 1: The Tunnel Test (Mid-Action Disconnect)
**Objective**: Verify that the application gracefully handles a sudden loss of connectivity during data entry without losing the current form state or failing to save.

| Steps to Execute | Expected App Behavior | Pass/Fail |
| :--- | :--- | :---: |
| 1. Ensure the device is **Online** and logged in. | App functions normally; Dashboard loads. | [ ] |
| 2. Navigate to **Husbandry > Daily Logs**. | Existing logs for today are visible. | [ ] |
| 3. Click **"Add Entry"** and select **"Feed"**. | The Add Feed modal opens. | [ ] |
| 4. **Turn on Airplane Mode** (or disable Wi-Fi/Data). | The app remains responsive; no "Offline" error modal blocks the form. | [ ] |
| 5. Fill out the form (select Food Type, enter Quantity, add Notes). | Form inputs are accepted normally. | [ ] |
| 6. Click **"Save Entry"**. | The modal closes. The new Feed log appears in the list immediately. | [ ] |
| 7. **Turn off Airplane Mode** (Reconnect). | The device reconnects to the network. | [ ] |
| 8. Wait 5 seconds, then perform a **Hard Refresh** (Cmd+R / Ctrl+R). | The record remains in the list, confirming it was successfully synced to the cloud. | [ ] |

---

## Test Scenario 2: The Avalanche Test (Multiple Queued Actions)
**Objective**: Verify that the system can queue multiple distinct actions across different modules while offline and sync them sequentially upon reconnection.

| Steps to Execute | Expected App Behavior | Pass/Fail |
| :--- | :--- | :---: |
| 1. **Go Offline** (Airplane Mode). | App enters offline state. | [ ] |
| 2. Add a **Feed Log** for Animal A in **Husbandry**. | Entry 1 appears in the Daily Logs list. | [ ] |
| 3. Navigate to **Logistics > Movements** and record a move for Animal B. | Entry 2 is saved locally; UI reflects the new location. | [ ] |
| 4. Navigate to **Animals > Medical** and add a **Clinical Note** for Animal C. | Entry 3 is saved locally; Note appears in Medical history. | [ ] |
| 5. **Reconnect to Wi-Fi**. | The sync engine detects the connection. | [ ] |
| 6. Navigate to **Settings > System Health**. | "Last Sync" should update to the current time within 10-15 seconds. | [ ] |
| 7. Check the **Supabase Database** (or refresh the app on a second device). | All three records (Feed, Movement, Medical) must be present in the cloud. | [ ] |
| 8. Verify no duplicate records exist for any of the actions. | Each action resulted in exactly one server-side record. | [ ] |

---

## Test Scenario 3: The Multi-Device Conflict (Offline Archive vs. Online Note)
**Objective**: Verify the resolution logic when one device performs a structural change (Archiving) while offline, while another device adds data to the same record while online.

| Steps to Execute | Expected App Behavior | Pass/Fail |
| :--- | :--- | :---: |
| 1. **Device A**: Go **Offline**. Navigate to an active Animal Profile and click **"Archive"**. | Animal is marked as "Archived" locally on Device A. | [ ] |
| 2. **Device B**: Stay **Online**. Navigate to the **same animal** and add a **Medical Note**. | Medical note is saved to the server immediately. | [ ] |
| 3. **Device A**: **Reconnect** to Wi-Fi. | Device A syncs the "Archive" status to the server. | [ ] |
| 4. On **Device B**, refresh the Animal Profile. | The animal should now show as **Archived**. | [ ] |
| 5. On **Device A**, refresh the Animal Profile. | The **Medical Note** added by Device B must be visible in the history. | [ ] |
| 6. Verify the animal is correctly listed in the **Archived Animals** section. | Data integrity is maintained; both the archive status and the note are preserved. | [ ] |

---

## Post-Test Cleanup
- Delete any test records created during this session from the Supabase dashboard.
- Ensure all test devices are back online and synced.
- Reset the "Last Sync" timestamp by performing a fresh action while online.

**QA Signature:** ____________________  **Date:** ____________________
