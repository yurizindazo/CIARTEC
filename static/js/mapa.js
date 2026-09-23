console.log("MAPA.JS CARREGADO");

// ========================================
// MAPA
// ========================================

const mapa = L.map("mapa").setView([20, 0], 2);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(mapa);


// ========================================
// VARIÁVEIS
// ========================================

const elementosRotas = [];
let rotasOriginais = [];


// ========================================
// CORES
// ========================================

const cores = {
    1: "#315ee8",
    2: "#f59e0b",
    3: "#8057ed",
    4: "#10a879"
};


// ========================================
// CRIAR CURVA
// ========================================

function criarCurva(origem, destino) {

    const lat1 = origem[0];
    const lng1 = origem[1];

    const lat2 = destino[0];
    const lng2 = destino[1];

    const meioLat = (lat1 + lat2) / 2;
    const meioLng = (lng1 + lng2) / 2;

    const distancia = Math.sqrt(
        Math.pow(lat2 - lat1, 2) +
        Math.pow(lng2 - lng1, 2)
    );

    const intensidade = Math.min(
        distancia * 0.25,
        15
    );

    const pontoControle = [
        meioLat + intensidade,
        meioLng
    ];

    const pontos = [];

    for (let i = 0; i <= 30; i++) {

        const t = i / 30;

        const lat =
            Math.pow(1 - t, 2) * lat1 +
            2 * (1 - t) * t * pontoControle[0] +
            Math.pow(t, 2) * lat2;

        const lng =
            Math.pow(1 - t, 2) * lng1 +
            2 * (1 - t) * t * pontoControle[1] +
            Math.pow(t, 2) * lng2;

        pontos.push([lat, lng]);
    }

    return pontos;
}


// ========================================
// IDENTIFICAR TIPO
// ========================================

function descobrirTipo(rota) {

    if (
        rota.nome.includes("Mediterrâneo") ||
        rota.nome.includes("Atlântico")
    ) {
        return "migracao";
    }

    if (
        rota.nome.includes("Darién")
    ) {
        return "migracao";
    }

    return "migracao";
}


// ========================================
// IDENTIFICAR REGIÃO
// ========================================

function descobrirRegiao(rota) {

    const texto = (
        rota.origem +
        " " +
        rota.destino
    ).toLowerCase();


    // EUROPA

    if (
        texto.includes("itália") ||
        texto.includes("espanha") ||
        texto.includes("canárias") ||
        texto.includes("europa")
    ) {
        return "europa";
    }


    // ÁFRICA

    if (
        texto.includes("áfrica")
    ) {
        return "africa";
    }


    // AMÉRICAS

    if (
        texto.includes("américa")
    ) {
        return "america";
    }


    return "outra";
}


// ========================================
// CRIAR ELEMENTO
// ========================================

function criarElementoRota(rota) {

    const origem = [
        Number(rota.lat_origem),
        Number(rota.lng_origem)
    ];

    const destino = [
        Number(rota.lat_destino),
        Number(rota.lng_destino)
    ];

    const cor =
        cores[rota.id] ||
        "#315ee8";


    // LINHA

    const linha = L.polyline(
        criarCurva(origem, destino),
        {
            color: cor,
            weight: 4,
            opacity: 0.9,
            dashArray: "10, 7",
            lineCap: "round",
            lineJoin: "round"
        }
    );


    linha.bindTooltip(
        rota.nome,
        {
            sticky: true,
            direction: "top"
        }
    );


    // ORIGEM

    const marcadorOrigem =
        L.circleMarker(
            origem,
            {
                radius: 9,
                color: "#15803d",
                fillColor: "#4ade80",
                fillOpacity: 1,
                weight: 3
            }
        );


    // DESTINO

    const marcadorDestino =
        L.circleMarker(
            destino,
            {
                radius: 9,
                color: "#dc2626",
                fillColor: "#f87171",
                fillOpacity: 1,
                weight: 3
            }
        );


    // POPUP ORIGEM

    marcadorOrigem.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br><br>
            <b>Origem:</b>
            ${rota.origem}
        </div>
    `);


    // POPUP DESTINO

    marcadorDestino.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br><br>
            <b>Destino:</b>
            ${rota.destino}
        </div>
    `);


    // POPUP LINHA

    linha.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br>
            ${rota.origem}
            →
            ${rota.destino}
        </div>
    `);


    // CLIQUE NA LINHA

    linha.on("click", function () {

        mostrarInformacoes(rota);

        destacarRota(rota.id);

        mapa.fitBounds(
            linha.getBounds(),
            {
                padding: [60, 60]
            }
        );
    });


    // CLIQUE ORIGEM

    marcadorOrigem.on("click", function () {

        mostrarInformacoes(rota);

        destacarRota(rota.id);
    });


    // CLIQUE DESTINO

    marcadorDestino.on("click", function () {

        mostrarInformacoes(rota);

        destacarRota(rota.id);
    });


    return {
        rota: rota,
        linha: linha,
        marcadorOrigem: marcadorOrigem,
        marcadorDestino: marcadorDestino
    };
}


// ========================================
// CARREGAR ROTAS
// ========================================

fetch("/api/rotas")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar rotas"
            );
        }

        return response.json();
    })

    .then(rotas => {

        console.log(
            "Rotas recebidas:",
            rotas
        );

        rotasOriginais = rotas;


        // CRIAR ROTAS

        rotas.forEach(rota => {

            elementosRotas.push(
                criarElementoRota(rota)
            );

        });


        // PREENCHER SELECT

        preencherFiltroRotas(rotas);


        // MOSTRAR TODAS

        mostrarTodasRotas();

    })

    .catch(erro => {

        console.error(
            "ERRO:",
            erro
        );

    });


// ========================================
// PREENCHER FILTRO DE ROTAS
// ========================================

function preencherFiltroRotas(rotas) {

    const filtro =
        document.getElementById(
            "filtro-rota"
        );

    if (!filtro) {
        return;
    }


    filtro.innerHTML = `
        <option value="todas">
            Todas as rotas
        </option>
    `;


    rotas.forEach(rota => {

        const opcao =
            document.createElement(
                "option"
            );

        opcao.value = rota.id;

        opcao.textContent =
            rota.nome;

        filtro.appendChild(
            opcao
        );

    });
}


// ========================================
// APLICAR FILTROS
// ========================================

function aplicarFiltros() {

    const ano =
        document.getElementById(
            "filtro-ano"
        )?.value || "2024";


    const tipo =
        document.getElementById(
            "filtro-tipo"
        )?.value || "todas";


    const regiao =
        document.getElementById(
            "filtro-regiao"
        )?.value || "todas";


    const rota =
        document.getElementById(
            "filtro-rota"
        )?.value || "todas";


    console.log(
        "Filtros:",
        ano,
        tipo,
        regiao,
        rota
    );


    const resultado =
        rotasOriginais.filter(
            item => {


                // ANO

                if (
                    ano !== "2024"
                ) {
                    return false;
                }


                // TIPO

                if (
                    tipo !== "todas" &&
                    descobrirTipo(item)
                        !== tipo
                ) {
                    return false;
                }


                // REGIÃO

                if (
                    regiao !== "todas" &&
                    descobrirRegiao(item)
                        !== regiao
                ) {
                    return false;
                }


                // ROTA

                if (
                    rota !== "todas" &&
                    String(item.id)
                        !== String(rota)
                ) {
                    return false;
                }


                return true;
            }
        );


    console.log(
        "Rotas encontradas:",
        resultado
    );


    atualizarMapa(
        resultado
    );
}


// ========================================
// ATUALIZAR MAPA
// ========================================

function atualizarMapa(
    rotas
) {

    // REMOVER TODAS

    elementosRotas.forEach(
        elemento => {

            mapa.removeLayer(
                elemento.linha
            );

            mapa.removeLayer(
                elemento.marcadorOrigem
            );

            mapa.removeLayer(
                elemento.marcadorDestino
            );

        }
    );


    // NENHUMA

    if (
        rotas.length === 0
    ) {

        mostrarPainelVazio(
            "Nenhuma rota encontrada",
            "Altere os filtros e tente novamente."
        );

        return;
    }


    // ADICIONAR FILTRADAS

    const elementos =
        elementosRotas.filter(
            elemento =>
                rotas.some(
                    rota =>
                        String(
                            rota.id
                        ) === String(
                            elemento.rota.id
                        )
                )
        );


    elementos.forEach(
        elemento => {

            elemento.linha.addTo(
                mapa
            );

            elemento.marcadorOrigem.addTo(
                mapa
            );

            elemento.marcadorDestino.addTo(
                mapa
            );

        }
    );


    // AJUSTAR MAPA

    const grupo =
        L.featureGroup(
            elementos.map(
                elemento =>
                    elemento.linha
            )
        );


    mapa.fitBounds(
        grupo.getBounds(),
        {
            padding: [30, 30]
        }
    );


    // PAINEL

    if (
        elementos.length > 1
    ) {

        mostrarPainelVazio(
            "Selecione uma rota",
            "Clique em uma linha ou ponto do mapa para visualizar os detalhes."
        );

    }
}


// ========================================
// MOSTRAR TODAS
// ========================================

function mostrarTodasRotas() {

    atualizarMapa(
        rotasOriginais
    );
}


// ========================================
// DESTACAR
// ========================================

function destacarRota(id) {

    elementosRotas.forEach(
        elemento => {

            if (
                String(
                    elemento.rota.id
                ) === String(id)
            ) {

                elemento.linha.setStyle({
                    weight: 7,
                    opacity: 1
                });

                elemento.marcadorOrigem.setStyle({
                    radius: 11,
                    weight: 4
                });

                elemento.marcadorDestino.setStyle({
                    radius: 11,
                    weight: 4
                });

            } else {

                elemento.linha.setStyle({
                    weight: 3,
                    opacity: 0.18
                });

                elemento.marcadorOrigem.setStyle({
                    radius: 7,
                    weight: 2
                });

                elemento.marcadorDestino.setStyle({
                    radius: 7,
                    weight: 2
                });

            }
        }
    );
}


// ========================================
// INFORMAÇÕES DA ROTA
// ========================================

function mostrarInformacoes(rota) {

    const painel =
        document.getElementById(
            "painel-rota"
        );


    if (!painel) {
        return;
    }


    painel.innerHTML = `

        <div class="painel-topo">

            <span class="painel-label">
                ROTA MIGRATÓRIA
            </span>

            <h2>
                ${rota.nome}
            </h2>

        </div>


        <div class="painel-trajeto">

            <div class="ponto-trajeto">

                <span>
                    ORIGEM
                </span>

                <strong>
                    📍 ${rota.origem}
                </strong>

            </div>


            <div class="linha-trajeto">
                →
            </div>


            <div class="ponto-trajeto">

                <span>
                    DESTINO
                </span>

                <strong>
                    🎯 ${rota.destino}
                </strong>

            </div>

        </div>


        <div class="informacoes-grid">


            <div class="card-info">

                <div class="icone-info">
                    📖
                </div>

                <div>

                    <span>
                        CONTEXTO
                    </span>

                    <p>
                        ${rota.contexto}
                    </p>

                </div>

            </div>


            <div class="card-info">

                <div class="icone-info">
                    ⚠️
                </div>

                <div>

                    <span>
                        FATORES RELACIONADOS
                    </span>

                    <p>
                        ${rota.causas}
                    </p>

                </div>

            </div>


            <div class="card-info">

                <div class="icone-info">
                    🚧
                </div>

                <div>

                    <span>
                        DIFICULDADES
                    </span>

                    <p>
                        ${rota.dificuldades}
                    </p>

                </div>

            </div>


            <div class="card-info">

                <div class="icone-info">
                    📚
                </div>

                <div>

                    <span>
                        FONTE
                    </span>

                    <p>
                        ${rota.fonte}
                    </p>

                </div>

            </div>

        </div>
    `;


    painel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


// ========================================
// PAINEL VAZIO
// ========================================

function mostrarPainelVazio(
    titulo,
    texto
) {

    const painel =
        document.getElementById(
            "painel-rota"
        );


    if (!painel) {
        return;
    }


    painel.innerHTML = `

        <div class="painel-vazio">

            <span>
                🗺️
            </span>

            <h3>
                ${titulo}
            </h3>

            <p>
                ${texto}
            </p>

        </div>

    `;
}