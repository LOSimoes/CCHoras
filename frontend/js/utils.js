// Retorna a data de hoje no formato YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

// Formata um total de minutos para o formato "HH:mm"
export const formatMinutes = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
};

// Converte uma string de tempo (ex: "2:30", "2h30", "2.5h") em minutos. Retorna null se o formato for inválido.
export const parseTimeToMinutes = (str) => {
  str = str.trim().toLowerCase().replace(',', '.');
  if (!str) return 0;

  // Formato: 8 ou 8.5 (assume que são horas)
  if (!isNaN(parseFloat(str)) && isFinite(str)) {
    return Math.round(parseFloat(str) * 60);
  }

  // Formato: 1:45 ou 1h45
  if (str.includes(':') || str.includes('h')) {
    const separator = str.includes(':') ? ':' : 'h';
    const parts = str.split(separator);
    if (parts.length === 2) {
        const h = parseFloat(parts[0]);
        // remove 'm' se existir
        const m = parseInt(parts[1].replace('m', ''), 10) || 0;
        if (!isNaN(h)) {
            return Math.round(h * 60) + m;
        }
    }
  }

  // Formato: 45m
  if (str.endsWith('m')) {
      const minutes = parseInt(str, 10);
      if (!isNaN(minutes)) {
          return minutes;
      }
  }

  return null; // Retorna null se nenhum formato for reconhecido
};

export const formatLeaveStatus = (status) => {
    const statusMap = { pending: 'Pendente', approved: 'Aprovado', denied: 'Negado' };
    return statusMap[status] || 'Desconhecido';
};

export const formatDateToBR = (isoDateString) => {
  if (!isoDateString || !/^\d{4}-\d{2}-\d{2}$/.test(isoDateString)) {
    return 'Data inválida';
  }
  const [year, month, day] = isoDateString.split('-');
  return `${day}/${month}/${year}`;
};