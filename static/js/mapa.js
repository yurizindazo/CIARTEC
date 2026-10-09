
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

    const intensidade = Math.min(distancia * 0.25, 15);

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
    const tipo = String(rota.tipo || "").toLowerCase();

    if (tipo.includes("refugi")) {
        return "refugiados";
    }

    if (tipo.includes("migr")) {
        return "migracao";
    }

    const texto = [
        rota.nome,
        rota.origem,
        rota.destino,
        rota.contexto,
        rota.causas,
        rota.dificuldades
    ].join(" ").toLowerCase();

    const termosRefugio = [
        "refúgio",
        "refugio",
        "refugi",
        "asilo",
        "rohingya",
        "sudão–chade",
        "sudao-chade"
    ];

    return termosRefugio.some(termo => texto.includes(termo))
        ? "refugiados"
        : "migracao";
}
// ========================================
// IDENTIFICAR REGIÃO
// ========================================

function descobrirRegiao(rota) {
    function normalizar(texto) {
        return String(texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    const origem = normalizar(rota.origem);

    if (
        origem.includes("africa") ||
        origem.includes("sudao") ||
        origem.includes("chade") ||
        origem.includes("etiopia") ||
        origem.includes("somalia")
    ) {
        return "africa";
    }

    if (
        origem.includes("america") ||
        origem.includes("colombia") ||
        origem.includes("panama") ||
        origem.includes("mexico")
    ) {
        return "america";
    }

    if (
        origem.includes("asia") ||
        origem.includes("mianmar") ||
        origem.includes("bangladesh") ||
        origem.includes("oriente medio") ||
        origem.includes("turquia")
    ) {
        return "asia";
    }

    if (
        origem.includes("europa") ||
        origem.includes("grecia") ||
        origem.includes("bala"
    )) {
        return "europa";
    }

    const texto = normalizar(
        `${rota.nome} ${rota.origem} ${rota.destino}`
    );

    if (texto.includes("africa")) return "africa";
    if (texto.includes("america")) return "america";

    if (
        texto.includes("asia") ||
        texto.includes("rohingya") ||
        texto.includes("mianmar")
    ) {
        return "asia";
    }

    if (
        texto.includes("europa") ||
        texto.includes("italia") ||
        texto.includes("espanha") ||
        texto.includes("grecia") ||
        texto.includes("canarias")
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
            dashArray: "10, 7",
            lineCap: "round",
            lineJoin: "round"
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

        preencherFiltroRotas(rotas);
        preencherFiltroAno(rotas);
        mostrarTodasRotas();

        mostrarPainelVazio(
            "Selecione uma rota",
            "Clique em uma linha ou pino do mapa para visualizar os detalhes."
        );
    })
    .catch(erro => {
        console.error("ERRO AO CARREGAR ROTAS:", erro);

        mostrarPainelVazio(
            "Não foi possível carregar as rotas",
            "Confira se o Flask está rodando e se a rota /api/rotas está funcionando."
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
// APLICAR FILTROS
// ========================================

// ========================================
// APLICAR FILTROS
// ========================================

function aplicarFiltros() {
    const tipo =
        document.getElementById("filtro-tipo")?.value || "todas";

    const regiao =
        document.getElementById("filtro-regiao")?.value || "todas";

    const rotaSelecionada =
        document.getElementById("filtro-rota")?.value || "todas";

    const ano =
        document.getElementById("filtro-ano")?.value || "todos";

    const resultado = rotasOriginais.filter(rota => {
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
            String(rota.id) !== String(rotaSelecionada)
        ) {
            return false;
        }

        if (
            ano !== "todos" &&
            String(rota.ano) !== ano
        ) {
            return false;
        }

        return true;
    });

    const painel = document.getElementById("painel-rotas-migracao");
    const botao = document.getElementById("botao-rotas");

    painel?.classList.remove("ativo");
    botao?.classList.remove("ativo-rotas");

    modoRotasAtivo = true;

    atualizarMapa(resultado);
}

// ========================================
// ATUALIZAR MAPA
// ========================================

function atualizarMapa(rotas) {
    elementosRotas.forEach(elemento => {
        mapa.removeLayer(elemento.linha);
        mapa.removeLayer(elemento.marcadorOrigem);
        mapa.removeLayer(elemento.marcadorDestino);
    });

    if (rotas.length === 0) {
        mostrarPainelVazio(
            "Nenhuma rota encontrada",
            "Não existem rotas cadastradas para os filtros selecionados."
        );

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
            weight: selecionado ? 7 : 3,
            opacity: selecionado ? 1 : 0.2
        });

        elemento.marcadorOrigem.setIcon(
            criarIconePino("origem", selecionado)
        );

        elemento.marcadorDestino.setIcon(
            criarIconePino("destino", selecionado)
        );

        elemento.marcadorOrigem.setZIndexOffset(selecionado ? 1000 : 0);
        elemento.marcadorDestino.setZIndexOffset(selecionado ? 1000 : 0);
    });
}

// ========================================
// MOSTRAR INFORMAÇÕES DA ROTA
// ========================================

function mostrarInformacoes(rota) {
    const painel = document.getElementById("painel-rota");

    if (!painel) return;

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
                <div class="icone-info">📖</div>
                <div>
                    <span>CONTEXTO</span>
                    <p>${rota.contexto || "Informação não cadastrada."}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">⚠️</div>
                <div>
                    <span>FATORES RELACIONADOS</span>
                    <p>${rota.causas || "Informação não cadastrada."}</p>
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
                <div class="icone-info">📚</div>
                <div>
                    <span>FONTE</span>
                    <p>${rota.fonte || "Fonte não cadastrada."}</p>
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
    const painel = document.getElementById("painel-rotas-migracao");
    const botao = document.getElementById("botao-rotas");

    if (!painel) {
        console.error("Painel de rotas não encontrado.");
        return;
    }

    const abrir = !painel.classList.contains("ativo");

    painel.classList.toggle("ativo", abrir);
    botao?.classList.toggle("ativo-rotas", abrir);

    if (abrir) {
        criarPainelRotas();
    }
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