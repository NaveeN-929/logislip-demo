// Utility function to convert numbers to words
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertHundreds(num) {
  let result = '';
  
  if (num > 99) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num > 19) {
    result += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  
  if (num > 0) {
    result += ones[num] + ' ';
  }
  
  return result;
}

export function numberToWords(number) {
  if (number === 0) return 'Zero';
  if (number < 0) return 'Minus ' + numberToWords(-number);
  
  // Handle decimal places
  const parts = number.toString().split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];
  
  let result = '';
  
  if (integerPart === 0) {
    result = 'Zero';
  } else {
    // Convert integer part using Indian numbering system
    const crores = Math.floor(integerPart / 10000000);
    const lakhs = Math.floor((integerPart % 10000000) / 100000);
    const thousands = Math.floor((integerPart % 100000) / 1000);
    const hundreds = integerPart % 1000;
    
    if (crores > 0) {
      result += convertHundreds(crores) + 'Crore ';
    }
    
    if (lakhs > 0) {
      result += convertHundreds(lakhs) + 'Lakh ';
    }
    
    if (thousands > 0) {
      result += convertHundreds(thousands) + 'Thousand ';
    }
    
    if (hundreds > 0) {
      result += convertHundreds(hundreds);
    }
  }
  
  // Add decimal part if exists
  if (decimalPart && parseInt(decimalPart) > 0) {
    result += 'and ' + convertHundreds(parseInt(decimalPart.padEnd(2, '0').substring(0, 2))) + 'Paise ';
  }
  
  return result.trim() + ' Only';
} 