fetch("/api/resumo")
    .then(response => response.json())
    .then(dados => {

        document.getElementById("total-rotas").textContent = dados.total_rotas;
        document.getElementById("total-origens").textContent = dados.total_origens;
        document.getElementById("total-destinos").textContent = dados.total_destinos;

        // =========================
        // GRÁFICO DE DESTINOS
        // =========================

        const destinos = dados.destinos.map(item => item.destino);
        const quantidadesDestinos = dados.destinos.map(item => item.quantidade);

        new Chart(document.getElementById("grafico-destinos"), {
            type: "bar",

            data: {
                labels: destinos,

                datasets: [{
                    label: "Quantidade de rotas",
                    data: quantidadesDestinos
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });


        // =========================
        // GRÁFICO DE ORIGENS
        // =========================

        const origens = dados.origens.map(item => item.origem);
        const quantidadesOrigens = dados.origens.map(item => item.quantidade);

        new Chart(document.getElementById("grafico-origens"), {
            type: "bar",

            data: {
                labels: origens,

                datasets: [{
                    label: "Quantidade de rotas",
                    data: quantidadesOrigens
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

    })
    .catch(error => {
        console.error("Erro ao carregar dados dos gráficos:", error);
    });



    // =========================
// GRÁFICO HISTÓRICO
// =========================

const anosHistorico = [
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];

const deslocamentoHistorico = [
    39.47, 42.69, 41.98, 41.10, 41.06,
    38.54, 42.75, 51.23, 59.21, 65.03,
    64.17, 67.90, 72.56, 78.38, 81.49,
    88.23, 107.22, 116.36, 123.25, 117.83
];

new Chart(document.getElementById("grafico-historico"), {

    type: "line",

    data: {
        labels: anosHistorico,

        datasets: [{
            label: "Pessoas deslocadas (milhões)",
            data: deslocamentoHistorico,
            tension: 0.3,
            fill: false,

            // Aumenta visualmente as bolinhas
            pointRadius: 5,
            pointHoverRadius: 10,
            pointHitRadius: 20
        }]
    },

    options: {
        responsive: true,

        // Aumenta a área de detecção do mouse
        interaction: {
            mode: "nearest",
            intersect: false
        },

        plugins: {
            legend: {
                display: true
            },

            tooltip: {
                enabled: true
            }
        },

        scales: {
            y: {
                beginAtZero: false,

                title: {
                    display: true,
                    text: "Milhões de pessoas"
                }
            },

            x: {
                title: {
                    display: true,
                    text: "Ano"
                }
            }
        }
    }

});