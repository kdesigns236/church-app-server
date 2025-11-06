# 🚀 Backblaze B2 + CloudFlare Setup Guide

## Complete Step-by-Step Instructions

---

## **Part 1: Backblaze B2 Setup** (10 minutes)

### **Step 1: Create Account**
1. Go to: https://www.backblaze.com/b2/sign-up.html
2. Sign up with your email
3. Verify email
4. Add payment method (required but won't charge for free tier)

### **Step 2: Create a Bucket**
1. Log in to B2 dashboard
2. Click **"Buckets"** in left sidebar
3. Click **"Create a Bucket"**
4. Settings:
   - **Bucket Name:** `church-sermons` (must be globally unique, try `church-sermons-yourname` if taken)
   - **Files in Bucket:** Public
   - **Encryption:** Disable (for public access)
   - **Object Lock:** Disable
5. Click **"Create a Bucket"**

### **Step 3: Get API Credentials**
1. Click **"App Keys"** in left sidebar
2. Click **"Add a New Application Key"**
3. Settings:
   - **Name:** `church-app`
   - **Allow access to Bucket:** Select your `church-sermons` bucket
   - **Type of Access:** Read and Write
   - **Allow List All Bucket Names:** Yes
4. Click **"Create New Key"**
5. **IMPORTANT:** Copy and save these (you'll only see them once!):
   - **keyID:** (like: `0051234567890abcdef`)
   - **applicationKey:** (like: `K0051234567890abcdefghijklmnopqrstuvwxyz`)
   - **Bucket ID:** (like: `abc123def456`)

---

## **Part 2: CloudFlare Setup** (15 minutes)

### **Step 1: Create CloudFlare Account**
1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up (free plan is fine!)
3. Verify email

### **Step 2: Create CloudFlare Worker**

Since CloudFlare's free tier TOS limits video serving, we'll use a Worker ($5/month for unlimited requests).

1. Go to **Workers & Pages** in CloudFlare dashboard
2. Click **"Create Application"**
3. Click **"Create Worker"**
4. Name it: `b2-video-proxy`
5. Click **"Deploy"**

### **Step 3: Configure Worker Code**

1. Click **"Edit Code"**
2. Replace all code with this:

```javascript
// CloudFlare Worker to proxy Backblaze B2 videos
// This enables free bandwidth via Bandwidth Alliance

const B2_BUCKET_NAME = 'church-sermons'; // Your bucket name
const B2_ENDPOINT = 'f002.backblazeb2.com'; // Your B2 endpoint (check in B2 dashboard)

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Construct B2 URL
    const b2Url = `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}${path}`;
    
    // Fetch from B2
    const response = await fetch(b2Url, {
      cf: {
        cacheEverything: true,
        cacheTtl: 86400, // Cache for 24 hours
      },
    });
    
    // Add CORS headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    newResponse.headers.set('Cache-Control', 'public, max-age=86400');
    
    return newResponse;
  },
};
```

3. Click **"Save and Deploy"**
4. Copy your Worker URL (like: `https://b2-video-proxy.yourname.workers.dev`)

---

## **Part 3: Test the Setup** (5 minutes)

### **Upload a Test File to B2**

1. In B2 dashboard, go to **"Buckets"**
2. Click your `church-sermons` bucket
3. Click **"Upload/Download"**
4. Upload a small test video
5. Note the file name (like: `test-video.mp4`)

### **Test CloudFlare Worker**

1. Open your browser
2. Go to: `https://b2-video-proxy.yourname.workers.dev/test-video.mp4`
3. Video should play! ✅

If it works, you're all set!

---

## **Part 4: Integration Details**

### **What You'll Need for the App:**

From Backblaze B2:
- ✅ **keyID:** `0051234567890abcdef`
- ✅ **applicationKey:** `K0051234567890abcdefghijklmnopqrstuvwxyz`
- ✅ **Bucket Name:** `church-sermons`
- ✅ **Bucket ID:** `abc123def456`

From CloudFlare:
- ✅ **Worker URL:** `https://b2-video-proxy.yourname.workers.dev`

### **How It Will Work:**

```
1. User uploads video in app
2. App uploads directly to B2 bucket
3. App saves video URL: https://b2-video-proxy.yourname.workers.dev/video123.mp4
4. When members watch, video loads via CloudFlare Worker
5. CloudFlare caches video → FREE bandwidth!
```

---

## **💰 Cost Breakdown**

### **Backblaze B2:**
- First 10GB storage: FREE
- After 10GB: $0.006/GB/month
- Downloads via CloudFlare: FREE (Bandwidth Alliance)

### **CloudFlare:**
- Worker: $5/month (100,000 requests/day included)
- OR Free tier (limited, check TOS)

### **Total for 50GB:**
- B2 Storage: 40GB × $0.006 = $0.24/month
- CloudFlare Worker: $5/month
- **Total: $5.24/month**

Still cheaper than most alternatives and NO file size limits!

---

## **🎯 Next Steps**

Once you have:
1. ✅ B2 account created
2. ✅ Bucket created
3. ✅ API keys saved
4. ✅ CloudFlare Worker deployed
5. ✅ Worker URL copied

**Paste them here and I'll update the app code!**

---

## **📝 Checklist**

- [ ] Backblaze B2 account created
- [ ] `church-sermons` bucket created (public)
- [ ] App Key created and saved
- [ ] CloudFlare account created
- [ ] CloudFlare Worker created and deployed
- [ ] Worker code updated with B2 details
- [ ] Test video uploaded and accessible via Worker
- [ ] All credentials ready for app integration

**Let me know when you're ready with the credentials!** 🚀
