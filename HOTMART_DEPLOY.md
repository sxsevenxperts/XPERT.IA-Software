# 🚀 Hotmart Integration - Deployment Guide

## Quick Start (5 minutes)

### 1️⃣ Apply Database Migration

**Option A: Via Supabase Dashboard (Easiest)**
```
1. Go to: https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new
2. Copy content from: supabase/migrations/009_hotmart_integration.sql
3. Paste and click "RUN"
4. You should see: "Tables created successfully" ✅
```

**Option B: Via CLI**
```bash
cd /Users/sergioponte/EasyDrive
supabase db push
```

**Verify it worked:**
- Go to Supabase Dashboard → Database → Tables
- You should see: `hotmart_transactions` table
- Subscriptions table should have `hotmart_transaction_id` column

---

### 2️⃣ Deploy Edge Function

**Option A: Via Supabase Dashboard (Recommended)**
```
1. Go to: https://app.supabase.com/project/kyefzktzhviahsodyayd/functions
2. Click "Create a new function"
3. Name: create-hotmart-user
4. Runtime: Deno
5. Copy content from: supabase/functions/create-hotmart-user/index.ts
6. Paste into editor
7. Click "Deploy"
8. You should see: "Status: DEPLOYED" ✅
```

**Option B: Via CLI**
```bash
cd /Users/sergioponte/EasyDrive
supabase login  # Login if needed
supabase functions deploy create-hotmart-user
```

**Verify it worked:**
- Go to Supabase Dashboard → Functions
- Click "create-hotmart-user"
- Should show "Status: DEPLOYED" (green checkmark)

---

### 3️⃣ Test the Flow

**Local Testing (with test parameters):**
```
Visit in browser:
http://localhost:5173/auth/hotmart-success?email=test@example.com&phone=11999999999&name=Test%20User&transaction_id=TEST-123

Expected:
1. Loading spinner appears
2. After 1-2 seconds: redirected to dashboard
3. Dashboard loads without needing to login
4. Check Supabase: new user should be created
5. Check Supabase: subscription should be active for 30 days
```

**Production Testing (after deploy):**
```
Same as above but use:
https://easydrive.sevenxperts.solutions/auth/hotmart-success?...
```

---

### 4️⃣ Test Real Hotmart Purchase

**Using Hotmart Sandbox:**
```
1. Go to Hotmart product page:
   https://pay.hotmart.com/Q104879353L?off=j97m36gi

2. Click "Comprar Acesso" button on EasyDrive Login page

3. Complete test purchase with:
   Email: your-test-email@gmail.com
   Phone: any valid number
   (Use Hotmart test cards if available)

4. After purchase:
   - Should be redirected to /auth/hotmart-success
   - Should see loading spinner
   - Should be auto-logged into dashboard
   - Subscription should show "Expires in: 30 days"
```

---

## ✅ Verification Checklist

### Database
- [ ] `hotmart_transactions` table exists in Supabase
- [ ] `subscriptions` table has `hotmart_transaction_id` column
- [ ] RLS policies are active

### Edge Function
- [ ] `create-hotmart-user` shows "DEPLOYED" status
- [ ] Function logs show successful executions

### Frontend
- [ ] "Comprar Acesso" button visible on Login page
- [ ] Button links to correct Hotmart product
- [ ] HotmartSuccess page handles redirect
- [ ] Auto-login works after purchase

### End-to-End
- [ ] Can click "Comprar Acesso"
- [ ] Gets to Hotmart product page
- [ ] After purchase: auto-redirected and logged in
- [ ] Dashboard accessible without login
- [ ] Subscription shows 30-day expiration
- [ ] Hotmart transaction logged in database

---

## 🔧 Troubleshooting

### Edge Function Fails to Deploy
**Error:** "Module not found: jose"
**Solution:** 
- Replace with: `https://deno.land/x/jose@v5.6.3/index.ts`
- The edge function already uses this URL

### Session Not Set After Purchase
**Error:** Redirected back to login instead of dashboard
**Solution:**
1. Check browser console (F12) for errors
2. Check Supabase Functions → Logs
3. Verify edge function returned correct session object

### User Created but Subscription Not Found
**Error:** "Subscrição inválida" message
**Solution:**
1. Run migration 009_hotmart_integration.sql
2. Check subscriptions table has data
3. Verify checkSubscription() function exists in supabase.js

### Hotmart Redirect Not Working
**Error:** 404 on /auth/hotmart-success
**Solution:**
1. Verify App.jsx imports HotmartSuccess
2. Check window.location.pathname routing logic
3. Clear browser cache (Ctrl+Shift+Delete)

---

## 📊 Files Changed/Created

```
Created:
✅ src/pages/HotmartSuccess.jsx
✅ supabase/functions/create-hotmart-user/index.ts
✅ supabase/migrations/009_hotmart_integration.sql
✅ HOTMART_INTEGRATION.md (documentation)
✅ HOTMART_DEPLOY.md (this file)

Modified:
✅ src/App.jsx (imports + routing)
✅ src/lib/supabase.js (added functions)
✅ src/pages/Login.jsx (added buy button)
✅ .env.example (added config docs)
```

---

## 🎯 What Happens Next

1. **Customer clicks "Comprar Acesso"** on login page
2. **Redirected to Hotmart** product page
3. **Completes purchase** on Hotmart
4. **Hotmart redirects to** `/auth/hotmart-success` with params
5. **HotmartSuccess page** extracts email, phone, name, transaction_id
6. **Calls edge function** to create user
7. **Edge function:**
   - Creates user in auth.users (auto-confirmed)
   - Creates 30-day subscription
   - Creates profile record
   - Generates JWT token
8. **Frontend sets session** with JWT
9. **Supabase auth listener** triggers
10. **Redirected to dashboard** - already logged in! ✅

---

## 🚨 Important Notes

⚠️ **Before Going Live:**
1. Test with a real Hotmart purchase (use sandbox if available)
2. Verify email delivery works (if notifications enabled)
3. Check database logs for errors
4. Test on production URL once deployed

⚠️ **Hotmart Configuration:**
- Return URL already configured: `https://easydrive.sevenxperts.solutions/auth/hotmart-success`
- Product URL: `https://pay.hotmart.com/Q104879353L?off=j97m36gi`
- These are set in Hotmart dashboard

⚠️ **Subscription Management:**
- All subscriptions are 30 days from purchase
- `checkSubscription()` validates expiration automatically
- Expired subs show message, prevent access

---

## 📞 Support Resources

**If something breaks:**
1. Check `/auth/hotmart-success` URL params in browser
2. Look at Supabase Functions → Logs
3. Check browser Console (F12) for JavaScript errors
4. Verify hotmart_transactions table has entries
5. Check subscriptions table has active records

**To debug manually:**
```sql
-- Check if user was created
SELECT * FROM auth.users WHERE email = 'customer@example.com';

-- Check subscription
SELECT * FROM subscriptions WHERE user_id = 'UUID-HERE';

-- Check hotmart transaction log
SELECT * FROM hotmart_transactions ORDER BY created_at DESC LIMIT 1;
```

---

**Status: READY TO DEPLOY 🚀**

All code is in place. Just need to:
1. Apply migration
2. Deploy edge function
3. Test the flow
4. Go live!

Estimated time: **5 minutes**
