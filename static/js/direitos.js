// CIARTEC — Interatividade da página Direitos

// 1. CARTÕES DE PRINCÍPIOS
const cartoes = document.querySelectorAll(".card-principio");
const tituloPrincipio = document.getElementById("principio-titulo");
const textoPrincipio = document.getElementById("principio-texto");

cartoes.forEach((cartao) => {
    cartao.addEventListener("click", () => {
        cartoes.forEach((item) => {
            item.classList.remove("selecionado");
        });

        cartao.classList.add("selecionado");

        tituloPrincipio.textContent = cartao.dataset.titulo;
        textoPrincipio.textContent = cartao.dataset.texto;
    });
});


// 2. LINHA DO TEMPO
const marcos = document.querySelectorAll(".marco");
const anoMarco = document.getElementById("marco-ano");
const tituloMarco = document.getElementById("marco-titulo");
const textoMarco = document.getElementById("marco-texto");

marcos.forEach((marco) => {
    marco.addEventListener("click", () => {
        marcos.forEach((item) => {
            item.classList.remove("ativo");
        });

        marco.classList.add("ativo");

        anoMarco.textContent = marco.dataset.ano;
        tituloMarco.textContent = marco.dataset.titulo;
        textoMarco.textContent = marco.dataset.texto;
    });
});


// 3. GRÁFICO HISTÓRICO
const canvas = document.getElementById("grafico-direitos");
const seletor = document.getElementById("tipo-grafico");

if (canvas && typeof Chart !== "undefined") {
    const anos = [
        "2016", "2017", "2018", "2019", "2020",
        "2021", "2022", "2023", "2024", "2025"
    ];

    // Milhões de pessoas deslocadas à força.
    // Série do ACNUR; valores arredondados para duas casas.
    const valores = [
        64.17, 67.90, 72.56, 78.38, 81.49,
        88.23, 107.22, 116.36, 123.25, 117.83
    ];

    const grafico = new Chart(canvas, {
        type: "line",

        data: {
            labels: anos,
            datasets: [{
                label: "Pessoas deslocadas à força",
                data: valores,
                borderColor: "#168b70",
                backgroundColor: "rgba(22, 139, 112, 0.12)",
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: (context) =>
                            `${context.parsed.y.toFixed(2)} milhões de pessoas`
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Pessoas (milhões)"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    seletor.addEventListener("change", () => {
        grafico.config.type = seletor.value;
        grafico.update();
    });
}