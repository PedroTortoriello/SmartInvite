// Pricing local (cliente) — mesmo critério do backend
function getPlanForGuests(guests) {
  const n = Number(guests) || 0

  if (n <= 25) {
    return { tier: 'free', label: 'Gratuito até 25 convidados', unit_amount: 0, requiresPayment: false, limit: 25 }
  }
  if (n <= 50) {
    return { tier: 'up_to_50', label: 'Mais de 25 até 50 convidados', unit_amount: 790, requiresPayment: true, limit: 50 }
  }
  if (n <= 100) {
    return { tier: 'up_to_100', label: 'Mais de 50 até 100 convidados', unit_amount: 1790, requiresPayment: true, limit: 100 }
  }
  if (n <= 150) {
    return { tier: 'up_to_150', label: 'Mais de 100 até 150 convidados', unit_amount: 2790, requiresPayment: true, limit: 150 }
  }
  if (n <= 200) {
    return { tier: 'up_to_200', label: 'Mais de 150 até 200 convidados', unit_amount: 3790, requiresPayment: true, limit: 200 }
  }
  return { tier: '200_plus', label: 'Mais de 200 convidados', unit_amount: 4790, requiresPayment: true, limit: null }
}3

function formatBRLFromCents(cents) {
  return (cents / 100).toFixed(2).replace('.', ',')
}
export { getPlanForGuests, formatBRLFromCents }