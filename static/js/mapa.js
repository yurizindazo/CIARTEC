
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
    maxBoundsViscosity: 1,
    minZoom: 2
}).setView([20, 0], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
    noWrap: true
}).addTo(mapa);

// ========================================
// VARIÁVEIS
// ========================================

const elementosRotas = [];
let rotasOriginais = [];
let modoRotasAtivo = true;

// ========================================
// CAMADA DE FRONTEIRAS E MUROS
// ========================================

let modoFronteirasAtivo = false;

const camadaFronteiras = L.layerGroup();

const fronteirasMuros = [
    {
        nome: "Barreira entre Polônia e Belarus",
        paises: "Polônia e Belarus",
        local: "Fronteira oriental da Polônia",
        coordenadas: [53.1, 23.5],
        contexto: "Barreira fronteiriça reforçada pela Polônia em meio à crise migratória na fronteira a partir de 2021.",
        impacto: "Pode dificultar a travessia e alterar os trajetos de pessoas que buscam entrar na União Europeia."
    },
    {
        nome: "Cerca de Ceuta",
        paises: "Espanha e Marrocos",
        local: "Ceuta, norte da África",
        coordenadas: [35.9, -5.35],
        contexto: "Sistema de cercas na fronteira terrestre entre o território espanhol de Ceuta e Marrocos.",
        impacto: "É uma barreira relevante para compreender as tentativas de entrada no território espanhol."
    },
    {
        nome: "Cerca de Melilla",
        paises: "Espanha e Marrocos",
        local: "Melilla, norte da África",
        coordenadas: [35.29, -2.94],
        contexto: "Sistema de cercas na fronteira terrestre entre o território espanhol de Melilla e Marrocos.",
        impacto: "A barreira influencia as possibilidades de travessia para o território espanhol."
    },
    {
        nome: "Cerca da fronteira Grécia–Turquia",
        paises: "Grécia e Turquia",
        local: "Região de Evros",
        coordenadas: [41.35, 26.25],
        contexto: "Trecho da fronteira terrestre onde a Grécia construiu e ampliou barreiras de segurança.",
        impacto: "As medidas de controle fronteiriço afetam os caminhos usados por pessoas que tentam chegar à Grécia."
    }, 

    {
        nome: "Barreira entre Estados Unidos e México",
        paises: "Estados Unidos e México",
        local: "Região de San Diego e Tijuana",
        coordenadas: [32.54, -117.03],
        contexto: "Barreiras físicas instaladas em diferentes trechos da fronteira entre os dois países para controlar a circulação.",
        impacto: "Dificultam algumas travessias e podem levar migrantes a buscar caminhos mais perigosos."
    },
    {
        nome: "Cerca entre Índia e Bangladesh",
        paises: "Índia e Bangladesh",
        local: "Fronteira entre os dois países",
        coordenadas: [25.0, 88.0],
        contexto: "A Índia construiu cercas em extensos trechos da fronteira com Bangladesh.",
        impacto: "A barreira está relacionada ao controle fronteiriço e à prevenção de travessias irregulares."
    },
    {
        nome: "Barreira entre Turquia e Síria",
        paises: "Turquia e Síria",
        local: "Trecho próximo a Kilis",
        coordenadas: [36.72, 37.12],
        contexto: "A Turquia construiu uma barreira ao longo de partes da fronteira durante o conflito sírio.",
        impacto: "Afeta a circulação na fronteira e as possibilidades de deslocamento de pessoas que fogem de conflitos."
    },
    {
        nome: "Cerca entre Hungria e Sérvia",
        paises: "Hungria e Sérvia",
        local: "Região de Röszke",
        coordenadas: [46.18, 19.85],
        contexto: "A Hungria construiu uma cerca fronteiriça em 2015, durante o aumento das chegadas de refugiados à Europa.",
        impacto: "Redirecionou trajetos migratórios e tornou mais difícil a travessia irregular nessa fronteira."
    }


];

const cores = {
    1: "#315ee8",
    2: "#f59e0b",
    3: "#8057ed",
    4: "#10a879"
};

// ========================================
// CRIAR PINOS PERSONALIZADOS
// ========================================

function criarIconePino(tipo, selecionado = false) {
    const cor = tipo === "origem" ? "#315ee8" : "#f59e0b";
    const tamanho = selecionado ? 40 : 32;

    return L.divIcon({
        className: "marcador-personalizado",
        html: `
            <div style="
                width:${tamanho}px;
                height:${tamanho}px;
                filter:drop-shadow(0 3px 4px rgba(15,23,42,.3));
                transition:all .2s ease;
            ">
                <svg
                    width="${tamanho}px"
                    height="${tamanho}px"
                    viewBox="0 0 32 42"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M16 1C7.7 1 1 7.7 1 16c0 11 15 25 15 25s15-14 15-25C31 7.7 24.3 1 16 1Z"
                        fill="${cor}"
                        stroke="#ffffff"
                        stroke-width="2"
                    />
                    <circle cx="16" cy="16" r="5" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [tamanho, tamanho],
        iconAnchor: [tamanho / 2, tamanho],
        popupAnchor: [0, -tamanho]
    });
}

// ========================================
// CRIAR CURVA DA ROTA
// ========================================


function criarCurva(origem, destino) {
    const [lat1, lng1] = origem;
    const [lat2, lng2] = destino;

    const distancia = Math.hypot(lat2 - lat1, lng2 - lng1);

    // Direção perpendicular ao trajeto
    const desvio = Math.min(distancia * 0.18, 12);
    const controle = [
        (lat1 + lat2) / 2 + desvio * Math.sign(lng2 - lng1 || 1),
        (lng1 + lng2) / 2 - desvio * Math.sign(lat2 - lat1 || 1)
    ];

    const pontos = [];

    for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const inverso = 1 - t;

        const lat =
            inverso * inverso * lat1 +
            2 * inverso * t * controle[0] +
            t * t * lat2;

        const lng =
            inverso * inverso * lng1 +
            2 * inverso * t * controle[1] +
            t * t * lng2;

        pontos.push([lat, lng]);
    }

    return pontos;
}


// ========================================
// IDENTIFICAR TIPO
// ========================================
function descobrirTipo(rota) {
    const tipo = String(rota.tipo || "").toLowerCase();

    if (tipo.includes("refúgio") || tipo.includes("refugio")) {
        return "refugiados";
    }

    if (tipo.includes("migração") || tipo.includes("migracao")) {
        return "migracao";
    }

    return "migracao";
}
// ========================================
// IDENTIFICAR REGIÃO
// ========================================

function descobrirRegiao(rota) {
    const texto = [
        rota.nome,
        rota.origem,
        rota.destino
    ].join(" ").toLowerCase();

    const normalizado = texto.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
        normalizado.includes("africa") ||
        normalizado.includes("sudao") ||
        normalizado.includes("chade") ||
        normalizado.includes("etiopia") ||
        normalizado.includes("somalia")
    ) {
        return "africa";
    }

    if (
        normalizado.includes("america") ||
        normalizado.includes("colombia") ||
        normalizado.includes("panama") ||
        normalizado.includes("mexico")
    ) {
        return "america";
    }

    if (
        normalizado.includes("asia") ||
        normalizado.includes("mianmar") ||
        normalizado.includes("bangladesh") ||
        normalizado.includes("malasia") ||
        normalizado.includes("indonesia") ||
        normalizado.includes("rohingya")
    ) {
        return "asia";
    }

    if (
        normalizado.includes("europa") ||
        normalizado.includes("italia") ||
        normalizado.includes("espanha") ||
        normalizado.includes("polonia") ||
        normalizado.includes("ucrania") ||
        normalizado.includes("mediterraneo")
    ) {
        return "europa";
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

    if (
        rota.lat_origem === "" ||
        rota.lng_origem === "" ||
        rota.lat_destino === "" ||
        rota.lng_destino === "" ||
        !Number.isFinite(latOrigem) ||
        !Number.isFinite(lngOrigem) ||
        !Number.isFinite(latDestino) ||
        !Number.isFinite(lngDestino) ||
        Math.abs(latOrigem) > 90 ||
        Math.abs(latDestino) > 90 ||
        Math.abs(lngOrigem) > 180 ||
        Math.abs(lngDestino) > 180
    ) {
        console.error("Rota com coordenadas inválidas:", rota);
        return null;
    }

    const origem = [latOrigem, lngOrigem];
    const destino = [latDestino, lngDestino];
    const cor = cores[rota.id] || "#315ee8";

   
    const linha = L.polyline(
        criarCurva(origem, destino),
        {
            color: cor,
            weight: 4,
            opacity: 0.9,
            dashArray: "10 8",
            lineCap: "round",
            lineJoin: "round",
            className: "rota-animada"
        }
    );


    linha.bindTooltip(rota.nome, {
        sticky: true,
        direction: "top"
    });

    const marcadorOrigem = L.marker(origem, {
        icon: criarIconePino("origem")
    });

    const marcadorDestino = L.marker(destino, {
        icon: criarIconePino("destino")
    });

    marcadorOrigem.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br><br>
            <b>Origem:</b> ${rota.origem}
        </div>
    `);

    marcadorDestino.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br><br>
            <b>Destino:</b> ${rota.destino}
        </div>
    `);

    linha.bindPopup(`
        <div class="popup-rota">
            <strong>${rota.nome}</strong>
            <br><br>
            ${rota.origem} → ${rota.destino}
        </div>
    `);

    function selecionarRota() {
        mostrarInformacoes(rota);
        destacarRota(rota.id);
    }

    linha.on("click", function () {
        selecionarRota();

        mapa.fitBounds(linha.getBounds(), {
            padding: [60, 60]
        });
    });

    marcadorOrigem.on("click", selecionarRota);
    marcadorDestino.on("click", selecionarRota);

    return {
        rota,
        linha,
        marcadorOrigem,
        marcadorDestino
    };
}

// ========================================
// CARREGAR ROTAS DA API
// ========================================


fetch("/api/rotas")
    .then(response => {
        if (!response.ok) {
            throw new Error("Erro ao carregar rotas: " + response.status);
        }

        return response.json();
    })
    .then(rotas => {
        console.log("ROTAS RECEBIDAS:", rotas);

        rotasOriginais = rotas;

        rotas.forEach(rota => {
            const elemento = criarElementoRota(rota);

            if (elemento) {
                elementosRotas.push(elemento);
            }
        });

        preencherFiltroAno(rotas);
        preencherFiltroRotas(rotas);

        const filtroAno = document.getElementById("filtro-ano");

        if (filtroAno) {
            filtroAno.addEventListener("change", () => {
                preencherFiltroRotas(rotasOriginais);
                aplicarFiltros();
            });
        }

        ["filtro-tipo", "filtro-regiao", "filtro-rota"].forEach(id => {
            const filtro = document.getElementById(id);

            if (filtro) {
                filtro.addEventListener("change", aplicarFiltros);
            }
        });

        aplicarFiltros();
    })
    .catch(erro => {
        console.error("ERRO AO CARREGAR ROTAS:", erro);

        mostrarPainelVazio(
            "Não foi possível carregar as rotas",
            "Confira se o Flask está rodando e se /api/rotas está funcionando."
        );
    });

// ========================================
// PREENCHER FILTRO DE ROTAS
// ========================================

// ========================================
// FILTRO DE ANO
// ========================================

function preencherFiltroAno(rotas) {
    const filtroRota = document.getElementById("filtro-rota");

    if (!filtroRota) return;

    if (document.getElementById("filtro-ano")) return;

    const grupo = document.createElement("div");
    grupo.className = "grupo-filtro";

    const label = document.createElement("label");
    label.htmlFor = "filtro-ano";
    label.textContent = "Ano";

    const select = document.createElement("select");
    select.id = "filtro-ano";

    select.innerHTML = `
        <option value="todos">Todos os anos</option>
    `;

    const anos = [...new Set(
        rotas
            .map(rota => String(rota.ano || "").trim())
            .filter(ano => /^\d{4}$/.test(ano))
    )].sort((a, b) => Number(b) - Number(a));

    anos.forEach(ano => {
        const opcao = document.createElement("option");
        opcao.value = ano;
        opcao.textContent = ano === "2026"
            ? "2026 (período parcial)"
            : ano;

        select.appendChild(opcao);
    });

    grupo.appendChild(label);
    grupo.appendChild(select);

    filtroRota.parentElement.insertBefore(grupo, filtroRota);

    select.addEventListener("change", aplicarFiltros);
}

// ========================================
// PREENCHER FILTRO DE ROTAS
// ========================================

function preencherFiltroRotas(rotas) {
    const filtroRota = document.getElementById("filtro-rota");
    const filtroAno = document.getElementById("filtro-ano");

    if (!filtroRota) return;

    const anoSelecionado = filtroAno ? filtroAno.value : "todos";

    const rotasFiltradas = rotas.filter(rota => {
        return anoSelecionado === "todos" ||
               String(rota.ano) === anoSelecionado;
    });

    filtroRota.innerHTML = '<option value="todas">Todas as rotas</option>';

    rotasFiltradas.forEach(rota => {
        const opcao = document.createElement("option");

        opcao.value = String(rota.id);
        opcao.textContent = rota.nome;

        filtroRota.appendChild(opcao);
    });

    filtroRota.value = "todas";
}

// ========================================
// APLICAR FILTROS
// ========================================

function aplicarFiltros() {
        if (modoFronteirasAtivo) {
        return;
    }
    const tipo =
        document.getElementById("filtro-tipo")?.value || "todas";

    const regiao =
        document.getElementById("filtro-regiao")?.value || "todas";

    const filtroAno = document.getElementById("filtro-ano");
    const filtroRota = document.getElementById("filtro-rota");

    const ano = filtroAno?.value || "todos";
    const rotaSelecionada = filtroRota?.value || "todas";

    const resultado = rotasOriginais.filter(rota => {
        if (
            ano !== "todos" &&
            String(rota.ano).trim() !== ano
        ) {
            return false;
        }

        if (
            tipo !== "todas" &&
            descobrirTipo(rota) !== tipo
        ) {
            return false;
        }

        if (
            regiao !== "todas" &&
            descobrirRegiao(rota) !== regiao
        ) {
            return false;
        }

        if (
            rotaSelecionada !== "todas" &&
            String(rota.id) !== rotaSelecionada
        ) {
            return false;
        }

        return true;
    });

    console.log("ANO APLICADO:", ano);
    console.log("ROTAS EXIBIDAS:", resultado.length);

    document
        .getElementById("painel-rotas-migracao")
        ?.classList.remove("ativo");

    document
        .getElementById("botao-rotas")
        ?.classList.remove("ativo-rotas");

    modoRotasAtivo = true;

    atualizarMapa(resultado);
}
// ========================================
// ATUALIZAR MAPA
// ========================================

function atualizarMapa(rotas) {
    console.log("ATUALIZAR MAPA RECEBEU:", rotas.length, "rotas");
    elementosRotas.forEach(elemento => {
        mapa.removeLayer(elemento.linha);
        mapa.removeLayer(elemento.marcadorOrigem);
        mapa.removeLayer(elemento.marcadorDestino);
        console.log("REMOVENDO CAMADA:", elemento.rota.nome);
    });
    

    if (rotas.length === 0) {
        mapa.setView([20, 0], 2);
        return;
    }

    const ids = new Set(rotas.map(rota => String(rota.id)));

    const elementos = elementosRotas.filter(elemento =>
        ids.has(String(elemento.rota.id))
    );

    elementos.forEach(elemento => {
        elemento.linha.addTo(mapa);
        elemento.marcadorOrigem.addTo(mapa);
        elemento.marcadorDestino.addTo(mapa);

        elemento.linha.setStyle({
            weight: 4,
            opacity: 0.9
        });

        elemento.marcadorOrigem.setIcon(criarIconePino("origem"));
        elemento.marcadorDestino.setIcon(criarIconePino("destino"));
        elemento.marcadorOrigem.setZIndexOffset(0);
        elemento.marcadorDestino.setZIndexOffset(0);
    });

    if (elementos.length > 0) {
        const grupo = L.featureGroup(
            elementos.flatMap(elemento => [
                elemento.linha,
                elemento.marcadorOrigem,
                elemento.marcadorDestino
            ])
        );

        mapa.fitBounds(grupo.getBounds(), {
            padding: [50, 50],
            maxZoom: 5
        });
    }

    mostrarPainelVazio(
        elementos.length === 1 ? "Rota encontrada" : "Selecione uma rota",
        "Clique em uma linha ou pino do mapa para visualizar os detalhes."
    );
}

// ========================================
// MOSTRAR TODAS AS ROTAS
// ========================================

function mostrarTodasRotas() {
    atualizarMapa(rotasOriginais);
}

// ========================================
// DESTACAR ROTA
// ========================================



function destacarRota(id) {
    elementosRotas.forEach(elemento => {
        const selecionado =
            String(elemento.rota.id) === String(id);

        elemento.linha.setStyle({
            color: selecionado
                ? "#08c9e8"
                : (cores[elemento.rota.id] || "#315ee8"),
            weight: selecionado ? 7 : 3,
            opacity: selecionado ? 1 : 0.22
        });

        elemento.marcadorOrigem.setIcon(
            criarIconePino("origem", selecionado)
        );

        elemento.marcadorDestino.setIcon(
            criarIconePino("destino", selecionado)
        );

        elemento.marcadorOrigem.setZIndexOffset(
            selecionado ? 1000 : 0
        );

        elemento.marcadorDestino.setZIndexOffset(
            selecionado ? 1000 : 0
        );
    });
}


// ========================================
// MOSTRAR INFORMAÇÕES DA ROTA
// ========================================


function mostrarInformacoes(rota) {
    const painel = document.getElementById("painel-rota");

    if (!painel) return;

    const fonte = rota.fonte || "";
    const fonteSegura = /^https?:\/\/\S+$/i.test(fonte);

    painel.innerHTML = `
        <div class="painel-topo">
            <span class="painel-label">ROTA MIGRATÓRIA</span>
            <h2>${rota.nome || "Rota sem nome"}</h2>
        </div>

        <div class="painel-trajeto">
            <div class="ponto-trajeto">
                <span>ORIGEM</span>
                <strong>📍 ${rota.origem || "Não informada"}</strong>
            </div>

            <div class="linha-trajeto">→</div>

            <div class="ponto-trajeto">
                <span>DESTINO</span>
                <strong>🎯 ${rota.destino || "Não informado"}</strong>
            </div>
        </div>

        <div class="informacoes-grid">
            <div class="card-info">
                <div class="icone-info">📅</div>
                <div>
                    <span>ANO DOS DADOS</span>
                    <p>${rota.ano || "Não informado"}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">🏷️</div>
                <div>
                    <span>TIPO</span>
                    <p>${rota.tipo || "Não informado"}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">📖</div>
                <div>
                    <span>CONTEXTO</span>
                    <p>${rota.contexto || "Informação não cadastrada."}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">🚧</div>
                <div>
                    <span>DIFICULDADES</span>
                    <p>${rota.dificuldades || "Informação não cadastrada."}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">🗓️</div>
                <div>
                    <span>PERÍODO DE REFERÊNCIA</span>
                    <p>${rota.periodo_dados || "Período não informado."}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">📚</div>
                <div>
                    <span>FONTE</span>
                    ${
                        
                        fonteSegura
                        ? `<a href="${fonte}" target="_blank" rel="noopener noreferrer" title="Consultar fonte original">${/unhcr\.org|data\.unhcr\.org/i.test(fonte) ? "ACNUR" : /iom\.int/i.test(fonte) ? "OIM" : "Fonte original"} ↗</a>`
                        : "<p>Fonte não cadastrada.</p>"
}
                    
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

function mostrarPainelVazio(titulo, texto) {
    const painel = document.getElementById("painel-rota");

    if (!painel) return;

    painel.innerHTML = `
        <div class="painel-vazio">
            <span>🗺️</span>
            <h3>${titulo}</h3>
            <p>${texto}</p>
        </div>
    `;
}

// ========================================
// ALTERNAR PAINEL DE ROTAS
// ========================================


function alternarRotasMigracao() {
    const botao = document.getElementById("botao-rotas");

    // Se estiver no modo de fronteiras, não alternar as rotas.
    if (modoFronteirasAtivo) {
        return;
    }

    // Se as rotas estiverem visíveis, escondê-las.
    if (modoRotasAtivo) {
        esconderTodasRotas();
        modoRotasAtivo = false;

        botao?.classList.remove("ativo-rotas");
        botao?.setAttribute("aria-pressed", "false");

        mostrarPainelVazio(
            "Rotas ocultas",
            "Clique em Rotas de Migração novamente para exibir as rotas."
        );

        return;
    }

    // Se estiverem ocultas, aplicar os filtros e exibi-las.
    modoRotasAtivo = true;
    aplicarFiltros();

    botao?.classList.add("ativo-rotas");
    botao?.setAttribute("aria-pressed", "true");
}

// ========================================
// ESCONDER ROTAS
// ========================================

function esconderTodasRotas() {
    elementosRotas.forEach(elemento => {
        mapa.removeLayer(elemento.linha);
        mapa.removeLayer(elemento.marcadorOrigem);
        mapa.removeLayer(elemento.marcadorDestino);
    });
}

// ========================================
// CONTEÚDO DO PAINEL DE ROTAS
// ========================================

function criarPainelRotas() {
    const conteudo = document.getElementById("conteudo-noticias-rotas");

    if (!conteudo) {
        console.error("Elemento conteudo-noticias-rotas não encontrado.");
        return;
    }

    const noticias = [
        {
            icone: "🌍",
            tipo: "Panorama global",
            titulo: "Uma rota não é apenas uma linha no mapa",
            texto: "Os trajetos migratórios podem envolver países de origem, trânsito e destino. Os caminhos mudam conforme as condições de segurança, as fronteiras e as possibilidades de viagem.",
            fonte: "OIM — Global Overview of Migration Routes"
        },
        {
            icone: "🛟",
            tipo: "Segurança",
            titulo: "Travessias marítimas podem ser perigosas",
            texto: "Em rotas pelo Mediterrâneo e pelo Atlântico, pessoas podem enfrentar embarcações precárias, condições climáticas adversas e falta de assistência durante a viagem.",
            fonte: "OIM e ACNUR — informações sobre migração e proteção"
        },
        {
            icone: "🧭",
            tipo: "Você sabia?",
            titulo: "As rotas mudam com o tempo",
            texto: "Conflitos, políticas de fronteira e condições econômicas podem alterar os caminhos utilizados. As linhas do mapa representam trajetos de referência, não caminhos fixos para todas as pessoas.",
            fonte: "OIM — monitoramento de fluxos migratórios"
        },
        {
            icone: "🏠",
            tipo: "Refúgio",
            titulo: "Migrantes e refugiados não são sinônimos",
            texto: "Migração é um termo amplo para deslocamentos. Refugiados são pessoas que precisam de proteção internacional conforme os critérios do direito dos refugiados.",
            fonte: "ACNUR — informações sobre refugiados"
        },
        {
            icone: "⚖️",
            tipo: "Direitos humanos",
            titulo: "A proteção deve acompanhar o deslocamento",
            texto: "Durante uma jornada, pessoas podem precisar de proteção contra violência, exploração e discriminação, além de acesso à assistência humanitária.",
            fonte: "ACNUR — proteção internacional"
        },
        {
            icone: "📊",
            tipo: "Como ler o mapa",
            titulo: "Os pontos não representam cada pessoa",
            texto: "As linhas deste projeto simplificam trajetos complexos entre regiões. Elas não indicam o caminho exato de cada pessoa nem o volume atual de viajantes.",
            fonte: "Metodologia do projeto CIARTEC"
        }
    ];

    conteudo.innerHTML = noticias.map(noticia => `
        <article class="noticia-rota">
            <div class="noticia-rota-topo">
                <div class="noticia-icone">${noticia.icone}</div>
                <span>${noticia.tipo}</span>
            </div>

            <h4>${noticia.titulo}</h4>
            <p>${noticia.texto}</p>

            <div class="fonte">
                Fonte: ${noticia.fonte}
            </div>
        </article>
    `).join("");
}

// ========================================
// SELECIONAR ROTA PELO PAINEL
// ========================================

function selecionarRotaPainel(rota) {
    mostrarInformacoes(rota);
    destacarRota(rota.id);

    const elemento = elementosRotas.find(item =>
        String(item.rota.id) === String(rota.id)
    );

    if (!elemento) return;

    mapa.fitBounds(elemento.linha.getBounds(), {
        padding: [80, 80]
    });
}
document.getElementById("filtro-ano")?.addEventListener("change", function () {
    console.log("ANO SELECIONADO:", this.value);

    const rotasDoAno = rotasOriginais.filter(
        rota => String(rota.ano).trim() === this.value
    );

    console.log("ROTAS DESSE ANO:", rotasDoAno);
    console.log("TOTAL DEPOIS DO FILTRO:", rotasDoAno.length);
});

// ========================================
// ALTERNAR FRONTEIRAS E MUROS
// ========================================

function alternarFronteirasMuros() {
    const botao = document.getElementById("botao-fronteiras");

    if (modoFronteirasAtivo) {
        // Voltar para as rotas
        mapa.removeLayer(camadaFronteiras);

        modoFronteirasAtivo = false;

        if (botao) {
            botao.classList.remove("ativo");
            botao.setAttribute("aria-pressed", "false");
        }

        aplicarFiltros();
        return;
    }

    // Esconder as rotas temporariamente
    esconderTodasRotas();

    mostrarPainelVazio(
        "Fronteiras e Muros",
        "Clique em um marcador para conhecer a barreira e seu contexto migratório."
    );


    // Criar os marcadores informativos
    fronteirasMuros.forEach(fronteira => {
        const marcador = L.circleMarker(fronteira.coordenadas, {
            radius: 9,
            color: "#ffffff",
            weight: 2,
            fillColor: "#d97706",
            fillOpacity: 1
        });

        marcador.bindPopup(`
            <div class="popup-rota">
                <strong>${fronteira.nome}</strong>
                <br><br>
                <b>Países:</b> ${fronteira.paises}
                <br>
                <b>Local:</b> ${fronteira.local}
                <br><br>
                <b>Contexto:</b> ${fronteira.contexto}
                <br><br>
                <b>Impacto migratório:</b> ${fronteira.impacto}
            </div>
        `);

        marcador.addTo(camadaFronteiras);
    });

    camadaFronteiras.addTo(mapa);

    modoFronteirasAtivo = true;

    if (botao) {
        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");
    }

    const limites = L.latLngBounds(
        fronteirasMuros.map(fronteira => fronteira.coordenadas)
    );

    mapa.fitBounds(limites, {
        padding: [40, 40],
        maxZoom: 5
    });
}