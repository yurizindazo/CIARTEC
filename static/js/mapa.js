// ========================================
// CRIANDO O MAPA
// ========================================

const mapa = L.map("mapa").setView([20, 0], 2);

// ========================================
// MAPA BASE
// ========================================

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(mapa);


// ========================================
// GUARDAR TODAS AS ROTAS
// ========================================

const elementosRotas = [];


// ========================================
// BUSCAR AS ROTAS NO FLASK
// ========================================

fetch("/api/rotas")


    .then(resposta => resposta.json())

    .then(rotas => {

    console.log("ROTAS RECEBIDAS:", rotas);

    const filtro = document.getElementById("filtro-rota");

    rotas.forEach(rota => {
        const opcao = document.createElement("option");

        opcao.value = rota.id;
        opcao.textContent = rota.nome;

        filtro.appendChild(opcao);
    });

    rotas.forEach(rota => {


            // ------------------------------------
            // COORDENADAS DA ORIGEM
            // ------------------------------------

            const origem = [
                Number(rota.lat_origem),
                Number(rota.lng_origem)
            ];


            // ------------------------------------
            // COORDENADAS DO DESTINO
            // ------------------------------------

            const destino = [
                Number(rota.lat_destino),
                Number(rota.lng_destino)
            ];


            // ========================================
            // LINHA DA ROTA
            // ========================================

// COR DA ROTA
const coresRotas = {
    1: "#2563eb",
    2: "#f59e0b",
    3: "#8b5cf6",
    4: "#10b981"
};

const corRota = coresRotas[rota.id] || "#3388ff";

// LINHA DA ROTA
const linha = L.polyline(
    [origem, destino],
    {
        color: corRota,
        weight: 5,
        opacity: 0.8,
        dashArray: "10, 8"
    }
).addTo(mapa);


linha.on("mouseover", function () {
    linha.setStyle({
        weight: 8,
        opacity: 1
    });

});


linha.on("mouseout", function () {

    linha.setStyle({
        weight: 5,
        opacity: 0.8
    });

});


            // ========================================
            // MARCADOR DA ORIGEM
            // ========================================

const marcadorOrigem = L.marker(origem, {
    icon: L.divIcon({
        className: "",
html: `
    <div style="
        width: 20px;
        height: 20px;
        background: #22c55e;
        border: 3px solid #15803d;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>


        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })
})
    .addTo(mapa)
    .bindPopup(`
        <h3>Origem</h3>
        <p>${rota.origem}</p>
    `);


            // Clique na origem
           marcadorOrigem.on("click", function () {

    mostrarInformacoes(rota);
                filtro.value = rota.id;
    mapa.fitBounds(
        linha.getBounds(),
        {
            padding: [50, 50]
        }
    );

});

            // ========================================
            // MARCADOR DO DESTINO
            // ========================================

const marcadorDestino = L.marker(destino, {
    icon: L.divIcon({
        className: "",
html: `
    <div style="
        width: 20px;
        height: 20px;
        background: #ef4444;
        border: 3px solid #b91c1c;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>
`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })
})
    .addTo(mapa)
    .bindPopup(`
        <h3>Destino</h3>
        <p>${rota.destino}</p>
    `);


            // Clique no destino
           marcadorDestino.on("click", function () {

    mostrarInformacoes(rota);
        filtro.value = rota.id;
    mapa.fitBounds(
        linha.getBounds(),
        {
            padding: [50, 50]
        }
    );

});

            // ========================================
            // POPUP DA LINHA
            // ========================================

            linha.bindPopup(`

                <h3>${rota.nome}</h3>

                <p>
                    ${rota.contexto}
                </p>

                <br>

                <strong>Origem:</strong>
                ${rota.origem}

                <br>

                <strong>Destino:</strong>
                ${rota.destino}

                <br><br>

                <strong>Dificuldades:</strong>

                <p>
                    ${rota.dificuldades}
                </p>

                <strong>Fonte:</strong>
                ${rota.fonte}

            `);


            // ========================================
            // CLIQUE NA LINHA
            // ========================================

         linha.on("click", function () {

    mostrarInformacoes(rota);
    filtro.value = rota.id;
    destacarRota(linha);


    mapa.fitBounds(
        linha.getBounds(),
        {
            padding: [50, 50]
        }
    );

});


            // ========================================
            // GUARDAR ELEMENTOS DA ROTA
            // ========================================

            elementosRotas.push({
    rota: rota,
    linha: linha,
    marcadorOrigem: marcadorOrigem,
    marcadorDestino: marcadorDestino
});

const todasAsLinhas = elementosRotas.map(
    elemento => elemento.linha
);

if (todasAsLinhas.length > 0) {
    const grupoRotas = L.featureGroup(todasAsLinhas);

    mapa.fitBounds(
        grupoRotas.getBounds(),
        {
            padding: [40, 40]
        }
    );
}

        });


// ========================================
// FILTRO DAS ROTAS
// ========================================

filtro.addEventListener("change", function () {

    const rotaEscolhida = this.value;


    // ------------------------------------
    // MOSTRAR / ESCONDER ROTAS
    // ------------------------------------

    elementosRotas.forEach(elemento => {

        const identificador = String(elemento.rota.id);


        if (rotaEscolhida === "todas") {

            elemento.linha.addTo(mapa);

            elemento.marcadorOrigem.addTo(mapa);

            elemento.marcadorDestino.addTo(mapa);

        }

        else if (identificador === rotaEscolhida) {

            elemento.linha.addTo(mapa);

            elemento.marcadorOrigem.addTo(mapa);

            elemento.marcadorDestino.addTo(mapa);

        }

        else {

            mapa.removeLayer(elemento.linha);

            mapa.removeLayer(elemento.marcadorOrigem);

            mapa.removeLayer(elemento.marcadorDestino);

        }

    });


    // ------------------------------------
    // PAINEL
    // ------------------------------------

    if (rotaEscolhida === "todas") {

        const painel = document.getElementById("painel-rota");

        painel.innerHTML = `
            <h2>Rotas migratórias</h2>

            <p>
                Selecione uma rota no filtro ou clique
                em uma rota no mapa para visualizar
                informações detalhadas.
            </p>
        `;


        elementosRotas.forEach(elemento => {

            elemento.linha.setStyle({
                weight: 5,
                opacity: 0.8
            });

        });


        mapa.setView([20, 0], 2);

    }

    else {

        const rotaSelecionada = elementosRotas.find(
            elemento =>
                String(elemento.rota.id) === rotaEscolhida
        );


        if (rotaSelecionada) {

            mostrarInformacoes(
                rotaSelecionada.rota
            );


            destacarRota(
                rotaSelecionada.linha
            );


            mapa.fitBounds(
                rotaSelecionada.linha.getBounds(),
                {
                    padding: [50, 50]
                }
            );

        }

    }

});


    })


    // ========================================
    // ERRO
    // ========================================

    .catch(erro => {

        console.error(
            "Erro ao carregar as rotas:",
            erro
        );

    });


// ========================================
// FUNÇÃO PARA MOSTRAR INFORMAÇÕES
// ========================================

function mostrarInformacoes(rota) {
const painel =
    document.getElementById("painel-rota");


const filtro =
    document.getElementById("filtro-rota");


// Volta o painel para o topo
painel.scrollTop = 0;


// Atualiza o filtro
filtro.value = String(rota.id);


    // Atualiza o painel
painel.innerHTML = `
    <h2>${rota.nome}</h2>

    <div class="info-rota">
        <h3>📍 Origem</h3>
        <p>${rota.origem}</p>
    </div>

    <div class="info-rota">
        <h3>🎯 Destino</h3>
        <p>${rota.destino}</p>
    </div>

   
    <div class="info-rota">
    <h3>📖 Contexto</h3>
    <p>${rota.contexto || "Não informado."}</p>
</div>

<div class="info-rota">
    <h3>🔎 Causas e fatores relacionados</h3>
    <p>${rota.causas || "Não informado."}</p>
</div>

<div class="info-rota">
    <h3>⚠️ Dificuldades</h3>
    <p>${rota.dificuldades || "Não informado."}</p>
</div>
    <div class="info-rota">
        <h3>📚 Fonte</h3>
        <p>${rota.fonte || "Não informado."}</p>
    </div>
`;

}

function destacarRota(linhaSelecionada) {

    elementosRotas.forEach(elemento => {

        const rota = elemento.rota;

        const coresRotas = {
            1: "#2563eb",
            2: "#f59e0b",
            3: "#8b5cf6",
            4: "#10b981"
        };

        const corOriginal =
            coresRotas[rota.id] || "#3388ff";

        elemento.linha.setStyle({
            color: corOriginal,
            weight: 5,
            opacity: 0.35
        });
    });

    linhaSelecionada.setStyle({
        weight: 9,
        opacity: 1
    });
}