// Charts for main page
let growthChart, distributionChart;

function initMarketCharts() {
    // Growth chart
    const growthCtx = document.getElementById('growthChart')?.getContext('2d');
    if (growthCtx) {
        growthChart = new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                datasets: [{
                    label: 'TVL (млн SOL)',
                    data: [1.2, 1.8, 2.5, 3.2, 4.1, 5.0, 6.2, 7.5, 8.8, 10.2, 11.8, 13.5],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    y: { ticks: { color: '#fff' } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }
    
    // Distribution chart
    const distCtx = document.getElementById('distributionChart')?.getContext('2d');
    if (distCtx) {
        distributionChart = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Недвижимость', 'Коммерция', 'Искусство', 'Энергия', 'Облигации'],
                datasets: [{
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                }
            }
        });
    }
}