"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isDemoMode } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Database, Cloud, Smartphone } from 'lucide-react'

export default function StatusPage() {
  const [isDemo, setIsDemo] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsDemo(isDemoMode())
    
    if (!isDemoMode()) {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('count')
          .limit(1)
        
        setDbConnected(!error)
      } catch (error) {
        setDbConnected(false)
      }
    }
    
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">नेपाल भाडा व्यवस्थापन</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Mode:</span>
              <Badge variant={isDemo ? "secondary" : "default"}>
                {isDemo ? "Demo Mode" : "Production"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Database:</span>
              <div className="flex items-center gap-2">
                {isDemo ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">LocalStorage</span>
                  </>
                ) : dbConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Supabase Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Connection Failed</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Environment:</span>
              <Badge variant="outline">
                {process.env.NODE_ENV}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Tenant Management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Meter Readings</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Bill Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Payment Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              {isDemo ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">Auto Backup</span>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Responsive Design</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Touch Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">PWA Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Offline Capable</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isDemo ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You're running in demo mode. To use real data:
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Setup Supabase database</li>
                  <li>Add environment variables</li>
                  <li>Deploy to production</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  ✅ Production ready! Your data is being saved to the real database.
                </p>
                <p className="text-sm text-muted-foreground">
                  Add this app to your phone's home screen for easy access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}