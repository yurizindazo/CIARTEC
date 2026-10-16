
/* =========================================
   CIARTEC — GRÁFICOS E DADOS DAS ROTAS
   Arquivo: static/js/grafico.js
========================================= */

// Referências aos gráficos
let graficoRotas = null;
let graficoDados = null;


// =========================================
// CORES DOS GRÁFICOS
// =========================================

const coresGraficos = [
    "#315C9B",
    "#E07A5F",
    "#3D8B75",
    "#E9B44C",
    "#8766A8",
    "#55A6B8",
    "#D85C78",
    "#829399"
];


// =========================================
// CARREGAR DADOS DA API
// =========================================

document.addEventListener("DOMContentLoaded", carregarGraficos);

async function carregarGraficos() {
    const listaOrigens = document.getElementById("lista-origens");

    try {
        const resposta = await fetch("/api/rotas");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as rotas.");
        }

        const rotas = await resposta.json();

        if (!Array.isArray(rotas)) {
            throw new Error("A API não retornou uma lista válida de rotas.");
        }

        if (rotas.length === 0) {
            mostrarErroGraficos("Nenhuma rota cadastrada.");
            return;
        }

        console.log("Dados recebidos para os gráficos:", rotas);

        criarGraficoRotas(rotas);
        criarGraficoDados(rotas);
        criarListaOrigens(rotas);

    } catch (erro) {
        console.error("Erro ao carregar os gráficos:", erro);

        mostrarErroGraficos(
            "Não foi possível carregar os dados. Verifique a API /api/rotas."
        );
    }
}


// =========================================
// 1. GRÁFICO DE ROSCA — DISTRIBUIÇÃO DAS ROTAS
// =========================================

function criarGraficoRotas(rotas) {
    const canvas = document.getElementById("grafico-rotas");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Canvas grafico-rotas ou Chart.js não encontrado.");
        return;
    }

    // Contar quantas rotas existem para cada destino
    const contagemDestinos = {};

    rotas.forEach(rota => {
        const destino = rota.destino || "Destino não informado";

        contagemDestinos[destino] =
            (contagemDestinos[destino] || 0) + 1;
    });

    const destinos = Object.keys(contagemDestinos);
    const quantidades = Object.values(contagemDestinos);

    // Evitar duplicar o gráfico ao recarregar
    if (graficoRotas) {
        graficoRotas.destroy();
    }

    graficoRotas = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: destinos,

            datasets: [{
                data: quantidades,
                backgroundColor: destinos.map(
                    (_, indice) =>
                        coresGraficos[indice % coresGraficos.length]
                ),
                borderColor: "#FFFFFF",
                borderWidth: 2,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "62%",

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        padding: 3,
                        boxWidth: 6,
                        boxHeight: 6,

                        font: {
                            size: 8
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw} rota(s)`;
                        }
                    }
                }
            }
        }
    });
}


// =========================================
// 2. GRÁFICO DE BARRAS — DADOS DAS ROTAS
// =========================================

function criarGraficoDados(rotas) {
    const canvas = document.getElementById("grafico-evolucao");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Canvas grafico-evolucao ou Chart.js não encontrado.");
        return;
    }

    // Calcular os indicadores a partir das rotas cadastradas
    const totalRotas = rotas.length;

    const origensUnicas = new Set(
        rotas
            .map(rota => rota.origem)
            .filter(origem => origem && origem.trim() !== "")
    );

    const destinosUnicos = new Set(
        rotas
            .map(rota => rota.destino)
            .filter(destino => destino && destino.trim() !== "")
    );

    if (graficoDados) {
        graficoDados.destroy();
    }

    graficoDados = new Chart(canvas, {
        type: "bar",

        data: {
            labels: [
                "Total de rotas",
                "Regiões de origem",
                "Destinos"
            ],

            datasets: [{
                label: "Quantidade",

                data: [
                    totalRotas,
                    origensUnicas.size,
                    destinosUnicos.size
                ],

                backgroundColor: [
                    "#315C9B",
                    "#3D8B75",
                    "#E07A5F"
                ],

                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 48
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.raw}`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    },

                    grid: {
                        color: "rgba(100, 116, 139, 0.12)"
                    }
                },

                x: {
                    grid: {
                        display: false
                    },

                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}


// =========================================
// 3. LISTA — PRINCIPAIS REGIÕES DE ORIGEM
// =========================================

function criarListaOrigens(rotas) {
    const elemento = document.getElementById("lista-origens");

    if (!elemento) {
        console.error("Elemento lista-origens não encontrado.");
        return;
    }

    const contagemOrigens = {};

    rotas.forEach(rota => {
        const origem = rota.origem;

        if (!origem || origem.trim() === "") {
            return;
        }

        contagemOrigens[origem] =
            (contagemOrigens[origem] || 0) + 1;
    });

    const origensOrdenadas = Object.entries(contagemOrigens)
        .sort((a, b) => b[1] - a[1]);

    if (origensOrdenadas.length === 0) {
        elemento.innerHTML = "<p>Nenhuma região de origem cadastrada.</p>";
        return;
    }

    const maiorQuantidade = origensOrdenadas[0][1];

    elemento.innerHTML = "";

    origensOrdenadas.forEach(([origem, quantidade]) => {
        const linha = document.createElement("div");
        linha.className = "item-origem";

        const cabecalho = document.createElement("div");
        cabecalho.className = "origem-cabecalho";

        const nome = document.createElement("span");
        nome.className = "origem-nome";
        nome.textContent = origem;

        const total = document.createElement("strong");
        total.className = "origem-quantidade";
        total.textContent = "";

        cabecalho.appendChild(nome);
        cabecalho.appendChild(total);

        const barra = document.createElement("div");
        barra.className = "origem-barra";

        const preenchimento = document.createElement("div");
        preenchimento.className = "origem-barra-preenchimento";

        preenchimento.style.width =
            `${(quantidade / maiorQuantidade) * 100}%`;

        barra.appendChild(preenchimento);

        linha.appendChild(cabecalho);
        linha.appendChild(barra);

        elemento.appendChild(linha);
    });
}


// =========================================
// MENSAGENS DE ERRO
// =========================================

function mostrarErroGraficos(mensagem) {
    const listaOrigens = document.getElementById("lista-origens");

    if (listaOrigens) {
        listaOrigens.textContent = mensagem;
    }

    console.error(mensagem);
}
