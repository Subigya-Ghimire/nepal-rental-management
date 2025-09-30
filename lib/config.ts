// Production configuration
export const PRODUCTION_CONFIG = {
  // Set to false to use real Supabase database instead of localStorage demo mode
  DEMO_MODE: false,
  
  // Google Sheets backup configuration
  ENABLE_SHEETS_BACKUP: true,
  
  // App settings
  APP_NAME: "Nepal Rental Management",
  VERSION: "1.0.0",
  
  // Feature flags
  FEATURES: {
    AUTO_BACKUP: true,
    OFFLINE_MODE: true,
    REAL_TIME_SYNC: true,
    EXCEL_EXPORT: true
  }
}

// Environment detection
export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

// Demo mode detection - now checks production config
export const isDemoMode = () => {
  // Force demo mode off in production unless explicitly enabled
  if (isProduction()) {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  }
  // Development mode uses localStorage demo by default
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || PRODUCTION_CONFIG.DEMO_MODE
}

// Database connection validation
export const validateDatabaseConnection = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found, falling back to demo mode')
    return false
  }
  
  return true
}