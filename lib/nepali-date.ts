// Nepali Date Utilities
// Conversion between English (Gregorian) and Nepali (Bikram Sambat) dates

export interface NepaliDate {
  year: number
  month: number
  day: number
  monthName: string
  dayName: string
}

// Nepali month names
export const nepaliMonths = [
  'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
]

// Nepali day names
export const nepaliDays = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
]

// English to Nepali number conversion
export const englishToNepali = (num: string | number): string => {
  const englishDigits = '0123456789'
  const nepaliDigits = '०१२३४५६७८९'
  
  return String(num).split('').map(digit => {
    const index = englishDigits.indexOf(digit)
    return index !== -1 ? nepaliDigits[index] : digit
  }).join('')
}

// Nepali to English number conversion
export const nepaliToEnglish = (num: string): string => {
  const nepaliDigits = '०१२३४५६७८९'
  const englishDigits = '0123456789'
  
  return num.split('').map(digit => {
    const index = nepaliDigits.indexOf(digit)
    return index !== -1 ? englishDigits[index] : digit
  }).join('')
}

// Simple approximate conversion from English to Nepali date
// Note: This is a simplified conversion. For production use, consider using libraries like nepali-date
export const englishToNepaliDate = (englishDate: Date): NepaliDate => {
  // Add approximately 56 years, 8 months, 15 days to convert to Nepali date
  // This is a rough approximation - actual conversion requires complex calculations
  const year = englishDate.getFullYear() + 57
  const month = ((englishDate.getMonth() + 8) % 12) + 1
  const day = englishDate.getDate()
  
  return {
    year,
    month,
    day,
    monthName: nepaliMonths[month - 1],
    dayName: nepaliDays[englishDate.getDay()]
  }
}

// Convert Nepali date to approximate English date
export const nepaliToEnglishDate = (nepaliYear: number, nepaliMonth: number, nepaliDay: number): Date => {
  // Subtract approximately 56 years, 8 months, 15 days
  const englishYear = nepaliYear - 57
  const englishMonth = ((nepaliMonth - 8 + 12) % 12)
  
  return new Date(englishYear, englishMonth, nepaliDay)
}

// Format date for display in both calendars
export const formatBilingualDate = (date: Date): string => {
  const englishFormat = date.toLocaleDateString('en-GB') // DD/MM/YYYY
  const nepaliDate = englishToNepaliDate(date)
  const nepaliFormat = `${englishToNepali(nepaliDate.year)}/${englishToNepali(nepaliDate.month)}/${englishToNepali(nepaliDate.day)}`
  
  return `${englishFormat} (${nepaliFormat} बि.स.)`
}

// Get current Nepali date
export const getCurrentNepaliDate = (): NepaliDate => {
  return englishToNepaliDate(new Date())
}

// Format Nepali date for input display
export const formatNepaliDateForInput = (nepaliDate: NepaliDate): string => {
  const year = String(nepaliDate.year).padStart(4, '0')
  const month = String(nepaliDate.month).padStart(2, '0')
  const day = String(nepaliDate.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse Nepali date from input
export const parseNepaliDateInput = (dateString: string): NepaliDate | null => {
  const parts = dateString.split('-')
  if (parts.length !== 3) return null
  
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  
  if (year < 2000 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 32) {
    return null
  }
  
  return {
    year,
    month,
    day,
    monthName: nepaliMonths[month - 1],
    dayName: nepaliDays[0] // Default to Sunday, would need proper calculation
  }
}

// Validate Nepali date
export const isValidNepaliDate = (year: number, month: number, day: number): boolean => {
  if (year < 2000 || year > 2200) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 32) return false
  
  // Simplified validation - in reality, different months have different day counts
  // and it varies by year in Nepali calendar
  return true
}

// Get default Nepali date for forms (current date)
export const getDefaultNepaliDate = (): string => {
  const nepaliDate = getCurrentNepaliDate()
  return formatNepaliDateForInput(nepaliDate)
}