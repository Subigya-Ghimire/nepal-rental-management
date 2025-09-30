# 🏠 Nepal Rental Management System

A comprehensive rental property management system built specifically for Nepali rental businesses. Features bilingual interface (Nepali/English), mobile-first design, and production-ready deployment.

## ✨ Features

### 🏢 **Core Management**
- **Tenant Management**: Add, track, and manage tenants with room assignments
- **Room Management**: Monitor room occupancy, rates, and availability
- **Meter Readings**: Record electricity consumption with automatic calculations
- **Bill Generation**: Simplified billing (rent + electricity + previous balance + notes)
- **Payment Tracking**: Record and track payment history

### 📱 **Mobile Ready**
- **Responsive Design**: Works perfectly on phones and tablets
- **PWA Support**: Install as native app on mobile devices
- **Touch Friendly**: Optimized for mobile interaction
- **Offline Capable**: Core functions work without internet

### 🔄 **Data Management**
- **Real Database**: Supabase integration for production data
- **Auto Backup**: Google Sheets integration for Excel compatibility
- **CSV Export**: Download data anytime
- **20+ Year Capacity**: Free tier handles decades of data

## 🚀 Quick Deploy

### 1. Setup Database (2 minutes)
```bash
1. Create Supabase account at supabase.com
2. Create new project: "nepal-rental-system"
3. Run SQL from database/production-schema.sql
4. Copy URL and API key
```

### 2. Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEMO_MODE=false
```

### 3. Deploy to Vercel (1 minute)
```bash
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!
```

## 💰 Cost: FREE Forever
- Supabase Database: $0 (500MB free)
- Vercel Hosting: $0 (unlimited)
- Google Sheets Backup: $0
- **Total: $0/month for 20+ years**

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS, Radix UI

## 🔧 Development

```bash
npm install    # Install dependencies
npm run dev    # Start development server
npm run build  # Build for production
```

## 📚 Documentation
- [`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md) - 5-minute deployment guide
- [`PRODUCTION_READY.md`](./PRODUCTION_READY.md) - Features overview

**Built with ❤️ for Nepali rental businesses** 🇳🇵
