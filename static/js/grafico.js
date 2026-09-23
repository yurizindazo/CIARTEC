console.log("GRAFICO.JS CARREGADO");

fetch("/api/rotas")
    .then(resposta => {
        if (!resposta.ok) {
            throw new Error("Erro ao acessar /api/rotas");
        }

        return resposta.json();
    })
    .then(rotas => {
        console.log("ROTAS RECEBIDAS PELO GRAFICO:", rotas);

        criarGraficoRotas(rotas);
        criarGraficoDados(rotas);
        criarListaOrigens(rotas);
    })
    .catch(erro => {
        console.error("ERRO NO GRAFICO:", erro);
    });


function criarGraficoRotas(rotas) {

    const canvas = document.getElementById("grafico-rotas");

    if (!canvas) {
        console.error("Canvas grafico-rotas não encontrado.");
        return;
    }

    const destinos = {};

    rotas.forEach(rota => {

        const destino = rota.destino;

        if (!destinos[destino]) {
            destinos[destino] = 0;
        }

        destinos[destino]++;
    });

    new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: Object.keys(destinos),

            datasets: [{
                data: Object.values(destinos)
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });

    console.log("GRAFICO DE ROTAS CRIADO");
}


function criarGraficoDados(rotas) {

    const canvas = document.getElementById("grafico-evolucao");

    if (!canvas) {
        console.error("Canvas grafico-evolucao não encontrado.");
        return;
    }

    const totalRotas = rotas.length;

    const origens = new Set(
        rotas.map(rota => rota.origem)
    ).size;

    const destinos = new Set(
        rotas.map(rota => rota.destino)
    ).size;

    new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "Rotas",
                "Origens",
                "Destinos"
            ],

            datasets: [{
                label: "Quantidade",

                data: [
                    totalRotas,
                    origens,
                    destinos
                ]
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    console.log("GRAFICO DE DADOS CRIADO");
}


function criarListaOrigens(rotas) {

    const lista = document.getElementById("lista-origens");

    if (!lista) {
        console.error("Elemento lista-origens não encontrado.");
        return;
    }

    const contagem = {};

    rotas.forEach(rota => {

        const origem = rota.origem;

        if (!contagem[origem]) {
            contagem[origem] = 0;
        }

        contagem[origem]++;
    });

    lista.innerHTML = "";

    Object.entries(contagem).forEach(([origem, quantidade]) => {

        const item = document.createElement("div");

        item.innerHTML = `
            <strong>${origem}</strong>
            <span>${quantidade} rota(s)</span>
        `;

        lista.appendChild(item);
    });

    console.log("LISTA DE ORIGENS CRIADA");
}