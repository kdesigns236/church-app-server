# 🚀 GitHub Actions Keep-Alive Setup

## ✅ What We Just Created

A GitHub Action that:
- ✅ Pings your server every 5 minutes
- ✅ Keeps Render server awake 24/7
- ✅ Runs on GitHub's servers (100% FREE!)
- ✅ No signup needed (you already have GitHub)
- ✅ Works forever automatically

---

## 📋 How to Enable It

### Step 1: Go to GitHub Repository

1. Open: https://github.com/kdesigns236/church-app-server
2. Click: **"Actions"** tab (top menu)

### Step 2: Enable GitHub Actions

If you see a message like:
```
Workflows aren't being run on this repository
```

**Click:** "I understand my workflows, go ahead and enable them"

### Step 3: Verify Workflow is Running

You should see:
```
✅ Keep Server Awake
   Last run: Just now
   Status: Success
```

### Step 4: Test It Manually (Optional)

1. Click on **"Keep Server Awake"** workflow
2. Click **"Run workflow"** button (right side)
3. Click **"Run workflow"** (green button)
4. Wait 10 seconds
5. Should show: ✅ Success

---

## 🎯 What Happens Now

### Every 5 Minutes:
```
GitHub Actions (free server)
    ↓
Pings: https://church-app-server.onrender.com/api/health
    ↓
Render server stays awake ⚡
    ↓
Video uploads work anytime! 🎉
```

### You Can See Logs:
1. Go to **Actions** tab
2. Click on any workflow run
3. Click **"Ping Church App Server"**
4. See logs:
   ```
   🔔 Pinging server to keep it awake...
   ✅ Server is awake! Response: 200
   Ping completed at Mon Nov 4 21:35:00 UTC 2025
   ```

---

## 📊 Monitoring

### Check Workflow Status:
- **Green checkmark** ✅ = Server is up
- **Red X** ❌ = Server is down (you'll get email notification)
- **Yellow dot** 🟡 = Workflow is running

### Email Notifications:
GitHub will email you if:
- ❌ Workflow fails (server is down)
- ❌ Workflow is disabled
- ✅ You can configure more alerts in Settings

---

## 💰 Cost

**100% FREE!**

GitHub Actions free tier includes:
- ✅ 2,000 minutes/month (you'll use ~150 minutes)
- ✅ Unlimited public repositories
- ✅ Unlimited workflows

**Your usage:**
- 5-minute intervals = 12 pings/hour
- 24 hours = 288 pings/day
- Each ping takes ~5 seconds
- **Total: ~24 minutes/day = ~720 minutes/month**

**Well within the 2,000 minute free limit!** ✅

---

## 🔧 Customization

### Change Ping Interval:

Edit `.github/workflows/keep-alive.yml`:

**Every 3 minutes:**
```yaml
- cron: '*/3 * * * *'
```

**Every 10 minutes:**
```yaml
- cron: '*/10 * * * *'
```

**Every 1 minute (max):**
```yaml
- cron: '* * * * *'
```

### Add More Health Checks:

```yaml
- name: Ping Multiple Endpoints
  run: |
    curl https://church-app-server.onrender.com/api/health
    curl https://church-app-server.onrender.com/api/sermons
    curl https://church-app-server.onrender.com/api/announcements
```

---

## 🎯 Expected Results

### Before Keep-Alive:
- Server sleeps after 15 minutes
- First request takes 30-60 seconds
- Video uploads might timeout
- Users experience delays

### After Keep-Alive:
- Server stays awake 24/7 ⚡
- Instant response times
- Video uploads work reliably
- Happy users! 🎉

---

## 🐛 Troubleshooting

### Workflow Not Running?

**Check:**
1. GitHub Actions is enabled (Actions tab)
2. Workflow file is in correct location: `.github/workflows/keep-alive.yml`
3. Repository is not archived
4. You have GitHub Actions minutes remaining

**Solution:**
- Go to Actions tab
- Click "Enable workflows"
- Run workflow manually to test

### Workflow Failing?

**Possible causes:**
1. Server is actually down (check Render)
2. URL is incorrect
3. Server is deploying

**Check logs:**
1. Go to Actions tab
2. Click failed workflow
3. Read error message
4. Fix issue and re-run

### Server Still Sleeping?

**Possible causes:**
1. Workflow not running yet (wait 5 minutes)
2. Render server has issues
3. Workflow is disabled

**Solution:**
- Check Actions tab for recent runs
- Manually trigger workflow
- Check Render logs

---

## 📈 Monitoring Dashboard

### View All Runs:
1. Go to: https://github.com/kdesigns236/church-app-server/actions
2. See all workflow runs
3. Filter by status (success/failure)
4. Download logs

### Set Up Notifications:
1. Go to: https://github.com/settings/notifications
2. Enable: "Actions" notifications
3. Get email when workflow fails

---

## 🎉 Success Indicators

You'll know it's working when:

✅ **Actions tab shows:**
```
Keep Server Awake
✓ Latest run: 2 minutes ago
✓ Status: Success
✓ Duration: 5s
```

✅ **Render logs show:**
```
GET /api/health 200 - 45ms (every 5 minutes)
```

✅ **Video uploads:**
- Work immediately (no delay)
- Complete successfully
- No timeout errors

---

## 🚀 Next Steps

1. ✅ Enable GitHub Actions (if not already)
2. ✅ Wait 5 minutes for first ping
3. ✅ Check Actions tab - should show success
4. ✅ Try uploading a video on live app
5. ✅ Enjoy reliable uploads 24/7! 🎊

---

## 💡 Pro Tips

### Reduce GitHub Actions Usage:
- Use 10-minute intervals instead of 5
- Only run during business hours (if acceptable)
- Disable on weekends (if acceptable)

### Monitor Multiple Services:
- Add more steps to ping other services
- Monitor database, CDN, etc.
- All in one workflow!

### Advanced Monitoring:
- Add Slack/Discord notifications
- Send metrics to analytics
- Create custom dashboards

---

## 📞 Support

If you have issues:
1. Check Actions tab for errors
2. Check Render logs
3. Verify workflow file syntax
4. GitHub Actions docs: https://docs.github.com/en/actions

---

## 🔗 Useful Links

- **GitHub Actions:** https://github.com/kdesigns236/church-app-server/actions
- **Render Dashboard:** https://dashboard.render.com/
- **Server Health:** https://church-app-server.onrender.com/api/health
- **Workflow File:** https://github.com/kdesigns236/church-app-server/blob/main/.github/workflows/keep-alive.yml

---

## ✅ Summary

**What You Have Now:**
- ✅ Free keep-alive service (GitHub Actions)
- ✅ Server stays awake 24/7
- ✅ Automatic monitoring
- ✅ Email notifications if server goes down
- ✅ No signup or external service needed
- ✅ 100% FREE forever!

**Your server will NEVER SLEEP AGAIN!** 🎉🚀

---

**Setup complete! Enable GitHub Actions and your server will stay awake 24/7!** ✅
