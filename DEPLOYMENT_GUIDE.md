# 🚀 GlobeTrotter Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Environment Variables Ready**
- [ ] `.env` file created with production values
- [ ] MongoDB Atlas connection string configured
- [ ] Cloudinary credentials set up
- [ ] SendGrid API key configured
- [ ] Google Maps API key ready

### ✅ **Code Ready**
- [ ] All API endpoints working locally
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts without errors
- [ ] Database connections tested

## 🌐 **Option 1: Vercel + Railway (Recommended)**

### **Frontend Deployment (Vercel)**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from frontend directory:**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `REACT_APP_API_URL` = Your Railway backend URL

### **Backend Deployment (Railway)**

1. **Sign up at [railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Deploy backend folder**
4. **Set environment variables in Railway dashboard**
5. **Get your backend URL**

### **Update Configuration**
- Update `vercel.json` with your actual backend URL
- Update `frontend/package.json` homepage field

---

## 🌐 **Option 2: Netlify + Render**

### **Frontend Deployment (Netlify)**

1. **Sign up at [netlify.com](https://netlify.com)**
2. **Connect GitHub repository**
3. **Build command:** `npm run build`
4. **Publish directory:** `build`
5. **Set environment variables**

### **Backend Deployment (Render)**

1. **Sign up at [render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Build command:** `npm install`
5. **Start command:** `npm start`

---

## 🌐 **Option 3: AWS/GCP/Azure (Professional)**

### **AWS Setup**
- **Frontend:** S3 + CloudFront
- **Backend:** EC2 or ECS
- **Database:** MongoDB Atlas (keep current)

### **GCP Setup**
- **Frontend:** Firebase Hosting
- **Backend:** App Engine
- **Database:** MongoDB Atlas

---

## 🔧 **Production Environment Variables**

### **Required Variables:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=your_email
GOOGLE_MAPS_API_KEY=your_google_maps_key
CLIENT_URL=https://your-frontend-domain.com
```

### **Optional Variables:**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=20
DISABLE_RATE_LIMIT=false
```

---

## 📱 **Domain & SSL Setup**

### **Custom Domain:**
1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS** to point to your hosting provider
3. **Enable SSL/HTTPS** (automatic with Vercel/Netlify/Railway)

### **SSL Certificate:**
- **Vercel/Netlify:** Automatic HTTPS
- **Railway:** Automatic HTTPS
- **Custom servers:** Let's Encrypt (free)

---

## 🚀 **Deployment Commands**

### **Local Testing:**
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm start
```

### **Production Deploy:**
```bash
# Frontend (Vercel)
cd frontend
vercel --prod

# Backend (Railway)
# Deploy via Railway dashboard or CLI
```

---

## 🔍 **Post-Deployment Checklist**

- [ ] Frontend loads without errors
- [ ] Backend API endpoints responding
- [ ] Database connections working
- [ ] Image uploads functioning
- [ ] Email functionality working
- [ ] Google Maps displaying
- [ ] User authentication working
- [ ] SSL certificate active
- [ ] Performance monitoring set up

---

## 💰 **Cost Estimates**

### **Free Tier (Recommended for MVP):**
- **Vercel:** Free (100GB bandwidth/month)
- **Railway:** Free (500 hours/month)
- **MongoDB Atlas:** Free (512MB storage)
- **Cloudinary:** Free (25GB storage/month)
- **SendGrid:** Free (100 emails/day)

### **Paid Tier (Production):**
- **Vercel:** $20/month (unlimited)
- **Railway:** $5/month (unlimited)
- **MongoDB Atlas:** $9/month (2GB storage)
- **Cloudinary:** $89/month (25GB storage)
- **SendGrid:** $15/month (100k emails/month)

---

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **CORS errors:** Check CLIENT_URL in backend
2. **Build failures:** Check Node.js version compatibility
3. **Database connection:** Verify MongoDB Atlas IP whitelist
4. **Environment variables:** Ensure all required vars are set

### **Support Resources:**
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)

---

## 🎯 **Next Steps**

1. **Choose hosting platform** (Vercel + Railway recommended)
2. **Set up accounts** and connect GitHub
3. **Deploy backend first** to get API URL
4. **Update frontend configuration** with backend URL
5. **Deploy frontend** and test functionality
6. **Set up custom domain** (optional)
7. **Monitor performance** and scale as needed

**Good luck with your deployment! 🚀**
