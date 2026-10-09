console.log("MAPA.JS CARREGADO");

// ========================================
// MAPA
// ========================================

const mapa = L.map("mapa", {
    worldCopyJump: false,
    maxBounds: [
        [-85, -180],
        [85, 180]
    ],
    maxBoundsViscosity: 1.0,
    minZoom: 2
}).setView([20, 0], 2);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        noWrap: true
    }
).addTo(mapa);

// ========================================
// VARIÁVEIS
// ========================================

const elementosRotas = [];
let rotasOriginais = [];

let modoRotasAtivo = true;


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

    return "migracao";
}


// ========================================
// IDENTIFICAR REGIÃO
// ========================================

function descobrirRegiao(rota) {

    const texto = (
        rota.origem + " " +
        rota.destino
    ).toLowerCase();

    if (
        texto.includes("itália") ||
        texto.includes("espanha") ||
        texto.includes("canárias") ||
        texto.includes("europa")
    ) {
        return "europa";
    }

    if (
        texto.includes("áfrica")
    ) {
        return "africa";
    }

    if (
        texto.includes("américa")
    ) {
        return "america";
    }

    if (
        texto.includes("ásia") ||
        texto.includes("asia")
    ) {
        return "asia";
    }

    return "outra";
}


// ========================================
// CRIAR ELEMENTO DA ROTA
// ========================================

function criarElementoRota(rota) {

    const latOrigem = Number(rota.lat_origem);
    const lngOrigem = Number(rota.lng_origem);

    const latDestino = Number(rota.lat_destino);
    const lngDestino = Number(rota.lng_destino);


    // ========================================
    // VERIFICAR COORDENADAS
    // ========================================

    if (
        !Number.isFinite(latOrigem) ||
        !Number.isFinite(lngOrigem) ||
        !Number.isFinite(latDestino) ||
        !Number.isFinite(lngDestino)
    ) {

        console.error(
            "ROTA COM COORDENADAS INVÁLIDAS:",
            rota
        );

        return null;
    }


    const origem = [
        latOrigem,
        lngOrigem
    ];

    const destino = [
        latDestino,
        lngDestino
    ];


    const cor =
        cores[rota.id] ||
        "#315ee8";


    // ========================================
    // LINHA
    // ========================================

    const linha = L.polyline(
        criarCurva(
            origem,
            destino
        ),
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


    // ========================================
    // MARCADOR DE ORIGEM
    // ========================================

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


    // ========================================
    // MARCADOR DE DESTINO
    // ========================================

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


    // ========================================
    // POPUP ORIGEM
    // ========================================

    marcadorOrigem.bindPopup(`
        <div class="popup-rota">

            <strong>
                ${rota.nome}
            </strong>

            <br><br>

            <b>Origem:</b>
            ${rota.origem}

        </div>
    `);


    // ========================================
    // POPUP DESTINO
    // ========================================

    marcadorDestino.bindPopup(`
        <div class="popup-rota">

            <strong>
                ${rota.nome}
            </strong>

            <br><br>

            <b>Destino:</b>
            ${rota.destino}

        </div>
    `);


    // ========================================
    // POPUP LINHA
    // ========================================

    linha.bindPopup(`
        <div class="popup-rota">

            <strong>
                ${rota.nome}
            </strong>

            <br>

            ${rota.origem}
            →
            ${rota.destino}

        </div>
    `);


    // ========================================
    // CLIQUE NA LINHA
    // ========================================

    linha.on(
        "click",
        function () {

            mostrarInformacoes(
                rota
            );

            destacarRota(
                rota.id
            );

            mapa.fitBounds(
                linha.getBounds(),
                {
                    padding: [60, 60]
                }
            );

        }
    );


    // ========================================
    // CLIQUE ORIGEM
    // ========================================

    marcadorOrigem.on(
        "click",
        function () {

            mostrarInformacoes(
                rota
            );

            destacarRota(
                rota.id
            );

        }
    );


    // ========================================
    // CLIQUE DESTINO
    // ========================================

    marcadorDestino.on(
        "click",
        function () {

            mostrarInformacoes(
                rota
            );

            destacarRota(
                rota.id
            );

        }
    );


    return {

        rota: rota,

        linha: linha,

        marcadorOrigem:
            marcadorOrigem,

        marcadorDestino:
            marcadorDestino

    };
}

// ========================================
// CARREGAR ROTAS
// ========================================

fetch("/api/rotas")

    .then(response => {

        if (!response.ok) {
            throw new Error("Erro ao carregar rotas");
        }

        return response.json();
    })

    .then(rotas => {

        console.log("ROTAS RECEBIDAS:", rotas);

        rotasOriginais = rotas;


rotas.forEach(rota => {

    const elemento =
        criarElementoRota(rota);

    if (elemento) {

        elementosRotas.push(
            elemento
        );

    }

});

preencherFiltroRotas(rotas);

// Mostrar as rotas automaticamente
mostrarTodasRotas();

        mostrarPainelVazio(
            "Mapa interativo",
            'Clique em "Rotas de Migração" para visualizar as rotas.'
        );

    })

    .catch(erro => {

        console.error(
            "ERRO AO CARREGAR ROTAS:",
            erro
        );

    });


// ========================================
// PREENCHER FILTRO DE ROTAS
// ========================================

function preencherFiltroRotas(rotas) {

    const filtro =
        document.getElementById("filtro-rota");

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
            document.createElement("option");

        opcao.value = rota.id;

        opcao.textContent =
            rota.nome;

        filtro.appendChild(opcao);

    });
}


// ========================================
// APLICAR FILTROS
// ========================================

function aplicarFiltros() {

    const tipo =
        document.getElementById("filtro-tipo")?.value || "todas";

    const regiao =
        document.getElementById("filtro-regiao")?.value || "todas";

    const rota =
        document.getElementById("filtro-rota")?.value || "todas";


    console.log(
        "FILTROS:",
        tipo,
        regiao,
        rota
    );


    const resultado =
        rotasOriginais.filter(item => {

            if (
                tipo !== "todas" &&
                descobrirTipo(item) !== tipo
            ) {
                return false;
            }


            if (
                regiao !== "todas" &&
                descobrirRegiao(item) !== regiao
            ) {
                return false;
            }


            if (
                rota !== "todas" &&
                String(item.id) !== String(rota)
            ) {
                return false;
            }


            return true;
        });


    console.log(
        "ROTAS ENCONTRADAS:",
        resultado
    );


    // Se o modo de rotas estiver desligado,
    // não mostra nada.

    if (!modoRotasAtivo) {
        return;
    }


    atualizarMapa(resultado);
}


// ========================================
// ATUALIZAR MAPA
// ========================================

function atualizarMapa(rotas) {

    // Remove todas as rotas atuais

    elementosRotas.forEach(elemento => {

        mapa.removeLayer(elemento.linha);

        mapa.removeLayer(
            elemento.marcadorOrigem
        );

        mapa.removeLayer(
            elemento.marcadorDestino
        );

    });


    // Nenhuma rota

    if (rotas.length === 0) {

        mostrarPainelVazio(
            "Nenhuma rota encontrada",
            "Não existem rotas cadastradas para os filtros selecionados."
        );

        mapa.setView(
            [20, 0],
            2
        );

        return;
    }


    // Encontrar elementos correspondentes

    const elementos =
        elementosRotas.filter(elemento => {

            return rotas.some(rota => {

                return String(rota.id) ===
                    String(elemento.rota.id);

            });

        });


    // Mostrar rotas

    elementos.forEach(elemento => {

        elemento.linha.addTo(mapa);

        elemento.marcadorOrigem.addTo(mapa);

        elemento.marcadorDestino.addTo(mapa);

    });


    // Ajustar mapa

    if (elementos.length > 0) {

        const grupo =
            L.featureGroup(
                elementos.map(
                    elemento => elemento.linha
                )
            );


        mapa.fitBounds(
            grupo.getBounds(),
            {
                padding: [50, 50]
            }
        );

    }


    // Atualizar painel

    if (elementos.length > 1) {

        mostrarPainelVazio(
            "Selecione uma rota",
            "Clique em uma linha ou ponto do mapa para visualizar os detalhes."
        );

    }

}


// ========================================
// MOSTRAR TODAS AS ROTAS
// ========================================

function mostrarTodasRotas() {

    if (!modoRotasAtivo) {
        return;
    }

    atualizarMapa(
        rotasOriginais
    );
}


// ========================================
// DESTACAR ROTA
// ========================================

function destacarRota(id) {

    elementosRotas.forEach(elemento => {

        if (
            String(elemento.rota.id) ===
            String(id)
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

    });
}


// ========================================
// MOSTRAR INFORMAÇÕES DA ROTA
// ========================================

function mostrarInformacoes(rota) {

    const painel =
        document.getElementById("painel-rota");

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
        document.getElementById("painel-rota");

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


// ========================================
// ALTERNAR ROTAS DE MIGRAÇÃO
// ========================================

function alternarRotasMigracao() {

    modoRotasAtivo =
        !modoRotasAtivo;


    const painel =
        document.getElementById(
            "painel-rotas-migracao"
        );


    const botao =
        document.getElementById(
            "botao-rotas"
        );


    if (modoRotasAtivo) {

        // ================================
        // ATIVAR
        // ================================

        if (painel) {

            painel.classList.add(
                "ativo"
            );

        }


        if (botao) {

            botao.classList.add(
                "ativo-rotas"
            );

        }


        atualizarMapa(
            rotasOriginais
        );


        criarPainelRotas();


    } else {

        // ================================
        // DESATIVAR
        // ================================

        if (painel) {

            painel.classList.remove(
                "ativo"
            );

        }


        if (botao) {

            botao.classList.remove(
                "ativo-rotas"
            );

        }


        esconderTodasRotas();


        mostrarPainelVazio(
            "Mapa interativo",
            'Clique em "Rotas de Migração" para visualizar as rotas.'
        );

    }

}


// ========================================
// ESCONDER TODAS AS ROTAS
// ========================================

function esconderTodasRotas() {

    elementosRotas.forEach(elemento => {

        mapa.removeLayer(
            elemento.linha
        );

        mapa.removeLayer(
            elemento.marcadorOrigem
        );

        mapa.removeLayer(
            elemento.marcadorDestino
        );

    });

}


// ========================================
// CRIAR PAINEL DE ROTAS
// ========================================

function criarPainelRotas() {

    const conteudo =
        document.getElementById(
            "conteudo-noticias-rotas"
        );


    if (!conteudo) {
        return;
    }


    conteudo.innerHTML = "";


    const noticias = [

        {
            icone: "🌍",

            tipo: "Panorama global",

            titulo:
                "As rotas de migração estão em constante mudança",

            texto:
                "A OIM acompanha diferentes rotas ao redor do mundo e atualiza seus dados periodicamente. O panorama global de janeiro a abril de 2026 reúne informações sobre sete grandes rotas migratórias.",

            fonte:
                "OIM — Global Overview of Migration Routes, 2026"
        },


        {
            icone: "🌊",

            tipo: "Curiosidade",

            titulo:
                "Algumas rotas atravessam longas áreas marítimas",

            texto:
                "A rota do Atlântico Ocidental conecta áreas de partida no oeste e norte da África às Ilhas Canárias. A travessia marítima é uma das características de maior risco dessa rota.",

            fonte:
                "OIM — Western African Atlantic Route"
        },


        {
            icone: "📊",

            tipo: "Dados recentes",

            titulo:
                "O cenário das rotas mudou em 2025",

            texto:
                "A OIM registrou mudanças importantes nos principais corredores migratórios em 2025, incluindo alterações nos países de partida, destinos e características dos fluxos.",

            fonte:
                "OIM — Global Overview of Migration Routes 2025"
        },


        {
            icone: "🧭",

            tipo: "Curiosidade",

            titulo:
                "Uma rota pode atravessar vários países",

            texto:
                "As rotas migratórias não são necessariamente um único caminho. Uma mesma trajetória pode envolver diferentes países de origem, trânsito e destino.",

            fonte:
                "OIM — Global Overview of Migration Routes"
        }

    ];


    noticias.forEach(noticia => {

        const card =
            document.createElement("article");


        card.className =
            "noticia-rota";


        card.innerHTML = `

            <div class="noticia-rota-topo">

                <div class="noticia-icone">
                    ${noticia.icone}
                </div>

                <span>
                    ${noticia.tipo}
                </span>

            </div>


            <h4>
                ${noticia.titulo}
            </h4>


            <p>
                ${noticia.texto}
            </p>


            <div class="fonte">

                Fonte:
                ${noticia.fonte}

            </div>

        `;


        conteudo.appendChild(
            card
        );

    });

}


// ========================================
// SELECIONAR ROTA PELO PAINEL
// ========================================

function selecionarRotaPainel(rota) {

    if (!modoRotasAtivo) {
        return;
    }


    document
        .querySelectorAll(
            ".card-rota-painel"
        )
        .forEach(card => {

            card.classList.remove(
                "ativo"
            );

        });


    const cardSelecionado =
        document.querySelector(
            `.card-rota-painel[data-rota-id="${rota.id}"]`
        );


    if (cardSelecionado) {

        cardSelecionado.classList.add(
            "ativo"
        );

    }


    mostrarInformacoes(
        rota
    );


    destacarRota(
        rota.id
    );


    const elemento =
        elementosRotas.find(item =>
            String(item.rota.id) ===
            String(rota.id)
        );


    if (!elemento) {
        return;
    }


    mapa.fitBounds(
        elemento.linha.getBounds(),
        {
            padding: [80, 80]
        }
    );

}