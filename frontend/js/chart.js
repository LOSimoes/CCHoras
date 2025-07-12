// Este módulo isola toda a lógica de criação e atualização do gráfico (Chart.js).

import { formatMinutes } from './utils.js';

let chartInstance = null;

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                // Formata a dica de ferramenta para mostrar "Xh Ym"
                label: (context) => formatMinutes(Math.round(context.raw * 60))
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            title: { display: true, text: 'Horas', color: '#e0e0e0' },
            ticks: { color: '#e0e0e0' },
            grid: { color: '#555' }
        },
        x: {
            ticks: { color: '#e0e0e0' },
            grid: { display: false }
        }
    }
};

/**
 * Inicializa o gráfico no elemento canvas fornecido.
 * @param {HTMLCanvasElement} canvasElement O elemento canvas onde o gráfico será renderizado.
 */
export function initChart(canvasElement) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    chartInstance = new Chart(canvasElement, {
        type: 'bar',
        data: {
            labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            datasets: [{
                label: 'Horas Trabalhadas',
                data: [], // Começa com dados vazios
                backgroundColor: 'rgba(229, 57, 53, 0.6)',
                borderColor: 'rgba(229, 57, 53, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: chartOptions
    });
}

/**
 * Atualiza os dados e a aparência do gráfico.
 * @param {Array<number>} weekHoursData Array com as horas de cada dia da semana.
 * @param {number} selectedDayIndex O índice do dia selecionado (0=Dom, 1=Seg, ...).
 */
export function updateChart(weekHoursData, selectedDayIndex) {
    if (!chartInstance) return;

    const backgroundColors = weekHoursData.map((_, i) => i === selectedDayIndex ? 'rgba(229, 57, 53, 0.9)' : 'rgba(229, 57, 53, 0.6)');

    chartInstance.data.datasets[0].data = weekHoursData;
    chartInstance.data.datasets[0].backgroundColor = backgroundColors;
    chartInstance.update();
}