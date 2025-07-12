// Retorna a data de hoje no formato YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

// Formata um total de minutos para o formato "Xh Ym"
export const formatMinutes = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '0h 0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// Converte uma string de tempo (ex: "2h30m") em minutos. Retorna null se o formato for inválido.
export const parseTimeToMinutes = (str) => {
  str = str.trim().toLowerCase().replace(',', '.');
  if (!str) return 0;

  // Formato: 8 ou 8.5 (assume que são horas)
  if (!isNaN(parseFloat(str)) && isFinite(str)) {
    return Math.round(parseFloat(str) * 60);
  }

  // Formato: 1:45
  if (str.includes(':')) {
    const [h, m] = str.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }

  // Formato: 2h30m, 2.5h, 45m
  let totalMinutes = 0;
  const hourMatch = str.match(/(\d+(\.\d+)?)h/);
  const minuteMatch = str.match(/(\d+)m/);

  if (hourMatch) totalMinutes += parseFloat(hourMatch[1]) * 60;
  if (minuteMatch) totalMinutes += parseInt(minuteMatch[1], 10);

  if (hourMatch || minuteMatch) return Math.round(totalMinutes);

  return null; // Retorna null se nenhum formato for reconhecido
};

export const formatLeaveStatus = (status) => {
    const statusMap = { pending: 'Pendente', approved: 'Aprovado', denied: 'Negado' };
    return statusMap[status] || 'Desconhecido';
};