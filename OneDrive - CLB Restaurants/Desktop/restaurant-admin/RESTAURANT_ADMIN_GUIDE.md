# 🎯 Restaurant Admin Website - Complete Guide

## 📋 **Overview**

This admin website manages the Tucci's mobile app loyalty program with **accurate information** based on how the system actually works, not guesses.

---

## ✅ **What's Been Improved**

### **1. Reward Catalog Management** 🎁 [IMPROVED]

**New Features:**
- ✅ **Image Upload** - Drag & drop images for rewards
- ✅ **Mobile App Preview** - See exactly how reward looks in app
- ✅ **Reward Templates** - Quick create common rewards ($5, $10, $15, $20, Free Appetizer, Free Dessert)
- ✅ **Better Stats** - Total, active, with images, avg cost
- ✅ **Smart Value Display** - Shows "Displays as: $10.00 Off" preview
- ✅ **Enhanced UX** - Larger images, better formatting, helpful tooltips

**How to Use:**
1. Click "Use Template" for quick rewards OR "Add New Reward" for custom
2. Fill in name, description, points cost
3. Upload image (optional but recommended!)
4. Click "Show Preview" to see mobile app mockup
5. Save → Appears in mobile app immediately!

---

### **2. Redemption Oversight** 📊 [ENHANCED]

**New Features:**
- ✅ **Usage Analytics Dashboard** - Redemption rate, success rate, avg time to use
- ✅ **Expiring Soon Filter** - Find rewards expiring in < 30 minutes
- ✅ **Detailed Stats** - Most redeemed reward, peak redemption time, total value used
- ✅ **Actionable Insights** - Recommendations based on expired unused rewards

**Key Metrics:**
- **Total Redemptions** - All time count
- **Actually Used** - How many were marked as "spent" at POS
- **Expiring Soon** - Active rewards < 30 min from expiration
- **Expired Unused** - Wasted redemptions (consider extending 4hr window)
- **Avg Time to Use** - Minutes from redemption to POS use

---

### **3. Receipt Claims Management** 📝 [NEW PAGE]

**Location:** `/loyalty/claims`

**What It Does:**
- View all customer receipt claims (pending, approved, rejected)
- Approve claims with one click
- Reject claims with reason
- Auto-verification against toast_orders table
- Duplicate prevention built-in

**Claims Process:**
1. Customer forgets to show loyalty code
2. Order syncs without link (goes to "Claimable Orders")
3. Customer submits claim via mobile app
4. System auto-matches order number + amount
5. **Currently:** Auto-approved if match found
6. **Admin can:** Review in this dashboard

**Note:** Most claims are auto-approved by the mobile app's claim feature. This dashboard is for monitoring and handling edge cases.

---

### **4. Claimable Orders Dashboard** 📋 [NEW PAGE]

**Location:** `/loyalty/claimable-orders`

**What It Shows:**
- Orders in `toast_orders` but NOT in `identity_links`
- These orders don't have a loyalty code attached
- Customers can claim these via "Claim Receipt" feature
- Shows check number, amount, date, guest info

**Why It's Useful:**
- See how many customers aren't providing loyalty codes
- Proactively contact customers with email/phone
- Monitor if servers are asking for codes
- Track potential "lost" points

**Filters:**
- Last 24 hours, 7 days, 30 days, 90 days
- Search by check number, email, or phone

---

### **5. Toast Sync Monitoring** 🔄 [UPDATED]

**What Was Fixed:**
- ❌ **Old info:** "Weekdays 11am-10:15pm, Weekends 9:30am-10:15pm"
- ✅ **Correct:** "Every day 11am-11pm (*/5 11-23 * * *)"

- ❌ **Old function:** `loyalty-sync-orders` (doesn't exist)
- ✅ **Correct:** `scheduled-toast-sync` (v3)

**New Features:**
- ✅ **Cron Job Status** - Real-time view of cron (Job ID 7)
- ✅ **Next Sync Prediction** - Shows when next sync will run
- ✅ **Two Sync Options:**
  - Scheduled Sync (recommended) - Yesterday + today
  - Manual Sync - Specific business date
- ✅ **Accurate "How It Works"** - 6 steps with correct info
- ✅ **v3 Feature Callout** - Smart reward matching explained

**How Sync Actually Works:**
1. Cron runs every 5 min (11am-11pm)
2. Fetches orders from Toast POS
3. Checks for duplicates (skips if exists)
4. Extracts loyalty code from memo
5. Awards points (1 pt/$1, Cellar = 1.5x)
6. **Auto-detects rewards by discount amount!**

---

### **6. Users & Points Management** 👥 [TO BE ENHANCED]

**Current Features:**
- Search by name, email, loyalty code
- View user point balances
- Manual point adjustments
- Recalculate tier
- Transaction history

**Planned Enhancements:**
- Tier filters (Blend, Barrel, Cellar, Vintage)
- Point range filters
- Enrollment date filters
- Show user's Toast orders inline
- Export user data

---

## 🎯 **Complete Feature List**

### **Pages Available:**

| Page | Path | Status | Description |
|------|------|--------|-------------|
| **Loyalty Overview** | `/loyalty` | Base | Main dashboard with stats |
| **Users** | `/loyalty/users` | Existing | Search & manage users |
| **Rewards** | `/loyalty/rewards` | ✨ Improved | Image upload, templates, preview |
| **Redemptions** | `/loyalty/redemptions` | ✨ Enhanced | Usage analytics, insights |
| **Receipt Claims** | `/loyalty/claims` | 🆕 New | Approve/reject claims |
| **Claimable Orders** | `/loyalty/claimable-orders` | 🆕 New | Unlinked orders dashboard |
| **Sync Monitoring** | `/loyalty/sync` | ✨ Updated | Accurate info, cron status |
| **Settings** | `/loyalty/settings` | Existing | System configuration |
| **Analytics** | `/loyalty/analytics` | Existing | Performance metrics |

---

## 📚 **How the System Works (For Admins)**

### **Customer Journey:**

1. **Enrollment**
   - Customer opens app → Loyalty tab
   - Clicks "Join Tucci's Loyalty Club"
   - Gets unique 4-digit code (e.g., `1234`)
   - Receives $15 Welcome Reward (expires in 14 days)
   - Starts at Blend tier

2. **Earning Points**
   - Customer shows code to server
   - Server applies "$0 Loyalty Program" discount in Toast
   - Server enters 4-digit code in memo field (e.g., `1234`)
   - Within 5 minutes: Points auto-awarded!
   - Cellar tier customers get 1.5x multiplier
   - System tracks favorite dishes (entrees, sandwiches, salads, etc.)

3. **Redeeming Rewards**
   - Customer browses rewards in app
   - Redeems reward (points deducted)
   - Gets 4-hour token
   - Shows code to server at payment
   - Server enters code + applies discount
   - **System auto-detects discount amount and marks reward as spent!**

4. **Receipt Claiming** (If forgot code)
   - Order syncs without code
   - Goes to "Claimable Orders"
   - Customer manually claims via app
   - System matches order number + amount
   - Points awarded after verification

5. **Favorite Dishes Tracking** (Automatic)
   - System tracks dishes ordered by each customer
   - Automatically excludes drinks, alcohol, and side dishes
   - Focuses on entrees, sandwiches, salads, and main courses
   - Displays top dishes in the Loyalty tab
   - Helps customers remember their favorites

---

## 🔒 **Duplicate Prevention (4 Layers)**

The system prevents customers from being rewarded twice:

1. **Order GUID Check** - Orders only processed once
2. **Identity Link Check** - Auto-rewarded orders can't be manually claimed
3. **Receipt Claim Check** - Same receipt can't be claimed twice
4. **Reward Token Check** - Rewards can only be marked as spent once

**Result:** Users CANNOT double-dip. Guaranteed.

---

## 🎨 **Creating Great Rewards**

### **Best Practices:**

✅ **Use images** - Rewards with images get redeemed 3x more  
✅ **Clear names** - "$10 Off Your Order" not "Discount Reward"  
✅ **Descriptive text** - "Save $10 on any order at Tucci's"  
✅ **Strategic pricing** - 1000 points = $10 is easy mental math  
✅ **Preview before saving** - Use mobile preview to check appearance  

### **Common Rewards:**

| Reward | Points | Value | When to Use |
|--------|--------|-------|-------------|
| **$5 Off** | 500 | $5 | Entry-level reward |
| **$10 Off** | 1000 | $10 | Most popular |
| **$15 Off** | 1500 | $15 | Mid-tier incentive |
| **$20 Off** | 2000 | $20 | Premium reward |
| **Free Appetizer** | 750 | $15 | Non-monetary incentive |
| **Free Dessert** | 500 | $10 | Low-barrier reward |

---

## 📊 **Monitoring Best Practices**

### **Daily Checks:**

**Morning (11:30 AM):**
- ✅ Check cron ran at 11am (Sync Monitoring page)
- ✅ Review yesterday's sync stats
- ✅ Check for any errors

**During Service:**
- ✅ Monitor pending receipt claims
- ✅ Check claimable orders count (should be low)
- ✅ Look for expiring soon rewards

**End of Day:**
- ✅ Review total orders synced
- ✅ Check redemption success rate
- ✅ Note any patterns or issues

### **Weekly Reviews:**

- 📊 Redemption analytics - Which rewards are popular?
- 📊 Expired unused rewards - Too high? Extend expiration?
- 📊 Claimable orders - Servers not asking for codes?
- 📊 Tier distribution - Customers progressing?

---

## 🚨 **Troubleshooting**

### **Issue: Orders Not Syncing**

**Check:**
1. Sync Monitoring → Cron Job Status (should be green/active)
2. Sync History → Recent entries (should be within 5 min if 11am-11pm)
3. Toast POS → Verify orders exist for today
4. Edge Function logs → Look for errors

**Common Causes:**
- Outside business hours (before 11am or after 11pm)
- Toast API credentials issue
- Network connectivity

### **Issue: Rewards Not Marking as "Spent"**

**Check:**
1. Server entered loyalty code in memo
2. Discount amount matches reward value exactly
3. Customer has active reward with that value
4. Sync has run (wait 5-10 minutes)

**Example:**
- Customer has $10 reward
- Server applies $10.00 discount
- System matches $10 = $10 reward
- Marks as spent ✅

### **Issue: High "Expired Unused" Count**

**Solutions:**
- Consider extending reward expiration to 6 hours
- Add reminder in app about 4-hour limit
- Educate customers to redeem when dining, not in advance

---

## 💡 **Pro Tips**

### **For Managing Rewards:**

1. **Start simple** - Use templates for common rewards
2. **Add images gradually** - Start with your most popular rewards
3. **Monitor redemption rate** - Remove rewards nobody uses
4. **Test in mobile** - Always preview before publishing
5. **Seasonal rewards** - Create special occasion rewards (holidays, events)

### **For Monitoring Sync:**

1. **Check daily** - Quick morning check of sync status
2. **Watch claimable orders** - High count = servers aren't asking for codes
3. **Review receipt claims** - Most should auto-approve
4. **Monitor errors** - Address sync failures quickly

### **For Optimizing Program:**

1. **Track tier progression** - Are customers moving up tiers?
2. **Analyze redemption patterns** - What time/day are redemptions highest?
3. **Monitor point velocity** - Are points being earned and redeemed?
4. **Customer feedback** - Ask about reward expiration timing

---

## 🎯 **Key Differences: Admin Guesses vs Reality**

| Topic | Admin Guessed | **Reality** |
|-------|---------------|-------------|
| **Cron Schedule** | Complex weekday/weekend hours | **Every day 11am-11pm** |
| **Reward Tokens** | Required by servers | **Not needed! Auto-matched by discount amount** |
| **Phone Verification** | Key feature | **Old feature, not currently used** |
| **Code Assignment** | First order assigns code | **Enrollment assigns code** |
| **Point Multiplier** | Not mentioned | **Cellar tier = 1.5x points!** |
| **Sync Function** | loyalty-sync-orders | **scheduled-toast-sync (v3)** |

---

## 📱 **Mobile App Integration**

### **What Happens in the App:**

**Loyalty Screen:**
- Shows customer's 4-digit code
- Shows current points (loyalty_points = redeemable)
- Shows tier and progress
- Links to claim receipt feature
- Displays favorite dishes based on order history

**Redeem Rewards Screen:**
- Shows rewards from `reward_catalog` table
- Filters by active = true
- Shows images if available
- Deducts points on redemption
- Creates 4-hour token

**My Rewards Screen:**
- Shows active rewards (not spent, not expired)
- Shows countdown timer
- Moves to "Past Rewards" when spent
- Status: Active / Redeemed / Expired

**Claim Receipt Screen:**
- Customer enters order number + amount
- System matches against `toast_orders`
- Checks not already linked
- Awards points if match found

---

## 🔧 **Database Tables (Reference)**

### **Created by Toast Integration:**

- `toast_orders` - All orders synced from Toast POS
- `identity_links` - Links orders to user accounts
- `points_ledger` - All point transactions
- `receipt_claims` - Manual receipt claims
- `toast_sync_history` - Sync operation logs

### **Loyalty Program Tables:**

- `reward_catalog` - Available rewards (you manage here!)
- `reward_tokens` - Redeemed rewards with expiration (includes welcome rewards)
- `profiles` - User data (loyalty_code, points, tier)
- `customer_favorite_dishes` - Tracks each customer's favorite dishes

---

## 🎁 **Welcome Rewards System**

### **How Welcome Rewards Work:**

**What's Different from Regular Rewards:**
- Automatically granted upon enrollment (no points cost)
- $15 value for new members
- 14-day expiration (instead of 4 hours)
- Cannot be redeemed for points back
- Shows as "Welcome Reward" in app

**When They're Created:**
1. Customer verifies email address
2. Customer enrolls in loyalty program
3. System checks if user already has a welcome reward
4. If not, creates $15 Welcome Reward
5. Reward appears immediately in "My Rewards"

**Important Notes:**
- Each user can only receive ONE welcome reward
- Welcome rewards are stored in `reward_tokens` table with `reward_type = 'welcome_bonus'`
- They work exactly like regular rewards for redemption (server enters loyalty code, applies $15 discount)
- Welcome rewards DO NOT appear in the "Redeem Rewards" section (they're automatically active)

---

## 🎊 **Summary of Improvements**

**Admin Website Now Has:**

✅ **Accurate Information** - No guesses, all correct  
✅ **Image Upload** - Make rewards appealing  
✅ **Mobile Preview** - See what customers see  
✅ **Reward Templates** - Fast reward creation  
✅ **Usage Analytics** - Understand redemption patterns  
✅ **Receipt Claims** - Manage customer claims  
✅ **Claimable Orders** - Monitor unlinked orders  
✅ **Cron Monitoring** - Real-time sync status  
✅ **Smart Navigation** - NEW/IMPROVED badges  
✅ **Welcome Rewards** - Automatic $15 reward for new members  
✅ **Favorite Dishes** - Personalized tracking of customer preferences  
✅ **4-Digit Codes** - Simpler loyalty code system  

**Result:** Admins can now effectively manage the entire loyalty program with confidence!

---

## 📞 **Quick Reference**

**Cron Schedule:** `*/5 11-23 * * *` (Every 5 min, 11am-11pm)  
**Restaurant GUID:** `679c0b43-458c-47f7-a509-fa0c4b68e447`  
**Store ID:** `151691`  
**Sync Version:** v3 (Simplified - ONE CODE ONLY!)  
**Reward Expiration:** 4 hours  
**Point Rate:** $1 = 1 point (Cellar = 1.5x)  

---

**Last Updated:** October 28, 2025  
**System Version:** Toast Integration v3  
**Admin Improvements:** Complete ✅  
**Loyalty Code Format:** 4-digit codes  
**Welcome Rewards:** Active ($15, 14-day expiration)  
**Favorite Dishes:** Tracking enabled


