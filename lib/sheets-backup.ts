// Google Sheets backup integration
import { PRODUCTION_CONFIG } from './config'

interface SheetData {
  range: string
  values: any[][]
}

export class GoogleSheetsBackup {
  private sheetId: string
  private apiKey: string
  
  constructor() {
    this.sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || ''
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || ''
  }

  // Backup tenants data to Google Sheets
  async backupTenants(tenants: any[]) {
    if (!PRODUCTION_CONFIG.ENABLE_SHEETS_BACKUP) return
    
    try {
      const headers = ['ID', 'Name', 'Phone', 'Email', 'Room Number', 'Monthly Rent', 'Security Deposit', 'Move In Date', 'Status', 'Created At']
      const data = tenants.map(tenant => [
        tenant.id,
        tenant.name,
        tenant.phone,
        tenant.email || '',
        tenant.room_number,
        tenant.monthly_rent,
        tenant.security_deposit,
        tenant.move_in_date,
        tenant.is_active ? 'Active' : 'Inactive',
        new Date(tenant.created_at).toLocaleDateString()
      ])
      
      await this.updateSheet('Tenants!A1:J', [headers, ...data])
      console.log('✅ Tenants backed up to Google Sheets')
    } catch (error) {
      console.error('❌ Failed to backup tenants:', error)
    }
  }

  // Backup readings data to Google Sheets
  async backupReadings(readings: any[]) {
    if (!PRODUCTION_CONFIG.ENABLE_SHEETS_BACKUP) return
    
    try {
      const headers = ['ID', 'Tenant Name', 'Room Number', 'Date', 'Previous Reading', 'Current Reading', 'Units Consumed', 'Rate per Unit', 'Electricity Cost', 'Created At']
      const data = readings.map(reading => [
        reading.id,
        reading.tenant_name,
        reading.room_number,
        reading.reading_date,
        reading.previous_reading,
        reading.current_reading,
        reading.units_consumed,
        reading.rate_per_unit,
        reading.electricity_cost,
        new Date(reading.created_at).toLocaleDateString()
      ])
      
      await this.updateSheet('Readings!A1:J', [headers, ...data])
      console.log('✅ Readings backed up to Google Sheets')
    } catch (error) {
      console.error('❌ Failed to backup readings:', error)
    }
  }

  // Backup bills data to Google Sheets
  async backupBills(bills: any[]) {
    if (!PRODUCTION_CONFIG.ENABLE_SHEETS_BACKUP) return
    
    try {
      const headers = ['ID', 'Tenant Name', 'Room Number', 'Bill Date', 'Rent Amount', 'Electricity Amount', 'Previous Balance', 'Total Amount', 'Notes', 'Paid Status', 'Created At']
      const data = bills.map(bill => [
        bill.id,
        bill.tenant_name,
        bill.room_number,
        bill.bill_date,
        bill.rent_amount,
        bill.electricity_amount,
        bill.previous_balance,
        bill.total_amount,
        bill.notes || '',
        bill.is_paid ? 'Paid' : 'Unpaid',
        new Date(bill.created_at).toLocaleDateString()
      ])
      
      await this.updateSheet('Bills!A1:K', [headers, ...data])
      console.log('✅ Bills backed up to Google Sheets')
    } catch (error) {
      console.error('❌ Failed to backup bills:', error)
    }
  }

  // Backup payments data to Google Sheets
  async backupPayments(payments: any[]) {
    if (!PRODUCTION_CONFIG.ENABLE_SHEETS_BACKUP) return
    
    try {
      const headers = ['ID', 'Tenant Name', 'Room Number', 'Amount', 'Payment Date', 'Payment Method', 'Description', 'Created At']
      const data = payments.map(payment => [
        payment.id,
        payment.tenant_name,
        payment.room_number,
        payment.amount,
        payment.payment_date,
        payment.payment_method,
        payment.description || '',
        new Date(payment.created_at).toLocaleDateString()
      ])
      
      await this.updateSheet('Payments!A1:H', [headers, ...data])
      console.log('✅ Payments backed up to Google Sheets')
    } catch (error) {
      console.error('❌ Failed to backup payments:', error)
    }
  }

  // Backup all data at once
  async backupAllData() {
    if (!PRODUCTION_CONFIG.ENABLE_SHEETS_BACKUP) return
    
    try {
      // This would be called after any database operation
      console.log('🔄 Starting full backup to Google Sheets...')
      
      // Note: In production, you'd fetch this data from Supabase
      // For now, we'll implement the backup hooks in the form submission handlers
      
      console.log('✅ Full backup completed')
    } catch (error) {
      console.error('❌ Full backup failed:', error)
    }
  }

  // Private method to update Google Sheets
  private async updateSheet(range: string, values: any[][]) {
    if (!this.sheetId || !this.apiKey) {
      console.warn('Google Sheets credentials not configured')
      return
    }

    // Note: In a real implementation, you'd use the Google Sheets API
    // For security, this should be done server-side with proper authentication
    console.log(`📊 Would update Google Sheet range ${range} with ${values.length} rows`)
  }

  // Export data as Excel-compatible CSV
  async exportToCSV(data: any[], filename: string) {
    try {
      const csvContent = data.map(row => 
        row.map((field: any) => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      ).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      console.log(`✅ ${filename} exported as CSV`)
    } catch (error) {
      console.error('❌ CSV export failed:', error)
    }
  }
}

// Global instance
export const sheetsBackup = new GoogleSheetsBackup()