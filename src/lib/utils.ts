export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return 'Zero';

  function helper(n: number, idx: number): string {
    if (n === 0) return '';
    let str = '';
    if (n >= 1000) {
      str += helper(Math.floor(n / 1000), idx + 1) + ' ' + thousands[idx];
      n %= 1000;
    }
    if (n >= 100) {
      str += ' ' + ones[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
    }
    if (n >= 20) {
      str += ' ' + tens[Math.floor(n / 10)];
      n %= 10;
    } else if (n >= 10) {
      str += ' ' + teens[n - 10];
      n = 0;
    }
    if (n > 0) {
      str += ' ' + ones[n];
    }
    return str.trim();
  }

  return helper(num, 1).trim() + ' Rupees Only';
}

