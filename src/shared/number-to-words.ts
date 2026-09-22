// Vietnamese Currency Number-to-Words Converter

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function readThreeDigits(n: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(n / 100)
  const remainder = n % 100
  const ten = Math.floor(remainder / 10)
  const unit = remainder % 10

  let res = ''

  if (hundred > 0 || showZeroHundred) {
    res += `${DIGITS[hundred]} trăm `
  }

  if (ten > 1) {
    res += `${DIGITS[ten]} mươi `
    if (unit === 1) res += 'mốt'
    else if (unit === 4) res += 'tư'
    else if (unit === 5) res += 'lăm'
    else if (unit > 0) res += DIGITS[unit]
  } else if (ten === 1) {
    res += 'mười '
    if (unit === 1) res += 'một'
    else if (unit === 4) res += 'bốn'
    else if (unit === 5) res += 'lăm'
    else if (unit > 0) res += DIGITS[unit]
  } else {
    if (showZeroHundred && unit > 0) {
      res += 'lẻ '
    }
    if (unit > 0) {
      res += DIGITS[unit]
    }
  }

  return res.trim()
}

export function numberToVietnameseWords(numInput: number | string): string {
  const cleanStr = String(numInput).replace(/[^0-9]/g, '')
  if (!cleanStr) return 'Không'

  const num = BigInt(cleanStr)
  if (num === 0n) return 'Không'

  const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']
  let str = num.toString()
  const groups: number[] = []

  while (str.length > 0) {
    const chunk = str.slice(-3)
    str = str.slice(0, -3)
    groups.push(parseInt(chunk, 10))
  }

  let result = ''
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (g > 0) {
      const showZero = i < groups.length - 1
      const groupText = readThreeDigits(g, showZero)
      const unitText = UNITS[i] ? ` ${UNITS[i]}` : ''
      result += `${groupText}${unitText} `
    }
  }

  result = result.trim()
  if (!result) return 'Không'

  // Capitalize first character
  return result.charAt(0).toUpperCase() + result.slice(1)
}
