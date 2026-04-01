# ⚡ Quick Start: Apply Migrations in 5 Minutes

## 🚀 Fastest Method (Recommended)

### Step 1: Open Supabase Dashboard
Click here: **https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new**

### Step 2: Copy & Paste Migrations in Order

Open `DEPLOYMENT_COMPLETE.md` and copy each migration SQL section **one at a time**.

**Order matters!**
1. Migration 003 (Notification System) → Run ✓
2. Migration 004 (Calendar Integrations) → Run ✓
3. Migration 005 (Case Predictions) → Run ✓
4. Migration 006 (Portal Integrations) → Run ✓
5. Migration 007 (Analytics & Predictions) → Run ✓

### Step 3: Verify

After each migration runs successfully:
- Green checkmark = ✅ Success
- Red error = ❌ Check error message (usually means table already exists)

---

## 📱 Alternative: Use Interactive Script

If you prefer command-line:

```bash
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin
chmod +x deploy-migrations.sh
./deploy-migrations.sh
```

Then select option "2. Apply all migrations" from the menu.

---

## ✅ Migrations Applied Successfully?

Test by logging in:
- URL: https://prevos.easypanel.io
- Email: teste@prevos.com
- Password: 123456

Then navigate to these new menu items:
- 📧 **Notificações** (Header bell icon)
- 🏛️ **Portais Judiciais** (Sidebar)
- 📊 **Analytics & ML** (Sidebar)

---

## 🎯 Expected Tables After Migrations

**Migration 003**: notification_settings, notification_log, notification_queue, contact_info
**Migration 004**: calendar_integrations, calendar_events, calendar_sync_log
**Migration 005**: case_predictions, prediction_history
**Migration 006**: portal_integrations, processo_status, portal_sync_log
**Migration 007**: revenue_actuals, revenue_predictions, workload_actuals, workload_predictions, analytics_dashboard

---

## ⚠️ If You Get Errors

### "Relation already exists"
- This means the table was already created in a previous run
- It's safe to ignore - the migration is already applied
- Just move to the next migration

### "Function does not exist"
- Check that you ran migrations in order (003 before 004, etc.)
- Some migrations depend on previous ones

### "Permission denied"
- You need to be logged in with a Supabase admin account
- Go to: https://app.supabase.com and sign in

---

## 📊 What Gets Enabled

Once migrations are applied:

✅ **Notifications**
- Email, SMS, in-app, push notifications
- Automated deadline alerts
- Notification history & read tracking

✅ **Calendar Integration**
- Sync with Google Calendar & Outlook
- Bidirectional synchronization
- Calendar event tracking in PrevOS

✅ **Case Analysis**
- AI-powered case viability predictions
- Risk assessment
- Positive/negative factors analysis
- Prediction history tracking

✅ **Judicial Portal Integration**
- Automatic TRF, INSS, CNJ tracking
- Case status updates
- Movement history
- Automatic alerts on status changes

✅ **Analytics & ML**
- Revenue forecasting (6-month)
- Workload prediction
- Staffing recommendations
- Dashboard insights & KPIs

---

## 🎬 Next Steps After Migrations

1. ✅ Migrations applied
2. Test features in the app
3. (Optional) Configure OAuth for Google Calendar & Outlook
4. (Optional) Set up email/SMS (Mailgun, Twilio)
5. (Optional) Connect Claude API for AI features

**That's it!** Your legal tech platform is ready. 🚀
