# Supabase Database Setup Instructions

## गृह भाडा व्यवस्थापन प्रणाली - Database Setup

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with your email (FREE account)

### Step 2: Create New Project
1. Click "New Project"
2. Choose your organization
3. Name: `home-rental-nepal`
4. Database Password: (create a strong password)
5. Region: Choose closest to Nepal (Asia-South)
6. Pricing Plan: **FREE** (500MB database, 2GB bandwidth)

### Step 3: Get Connection Details
1. Go to Project Settings > API
2. Copy these values:
   - **Project URL** (starts with https://...)
   - **Project API Key** (anon, public key)

### Step 4: Update Environment Variables
Edit the `.env.local` file in your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 5: Run Database Schema
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents from `database/schema.sql`
3. Paste and run in SQL Editor
4. This will create all tables and sample data

### Step 6: Test Connection
1. Start your app: `npm run dev`
2. Go to http://localhost:3000/tenants
3. If you see sample data, connection is working!

## Database Tables Created:

### 🏠 **rooms** - कोठाहरू
- Room number, type, rent, occupancy status
- Sample: Room 101, 102, 201, 202, 301

### 👥 **tenants** - भाडावालाहरू  
- Tenant information, contact, room assignment
- Sample: राम प्रसाद शर्मा, सीता देवी गुरुङ

### 📊 **meter_readings** - मिटर रिडिङ
- Electricity and water meter readings
- Automatic unit calculation

### 💰 **bills** - बिलहरू
- Monthly rent and utility bills
- Automatic total calculation

### 💳 **payments** - भुक्तानीहरू
- Payment records and history
- Link to bills and tenants

## Security Settings:
- Row Level Security (RLS) enabled
- Only authenticated users can access data
- Perfect for single-user home management

## Sample Data Included:
- ✅ 5 rooms (101, 102, 201, 202, 301)
- ✅ 2 sample tenants
- ✅ Nepali language support
- ✅ Realistic rent amounts in NPR

## Next Steps:
1. Add your real rooms in `/rooms`
2. Add your tenants in `/tenants` 
3. Start managing your rental property!

---
**Free Tier Limits:**
- 500MB Database Storage
- 2GB Bandwidth/month  
- 50MB File Storage
- Perfect for home rental management!