
console.log("MAPA.JS CARREGADO");

// ========================================
// MAPA
// ========================================

const mapa = L.map("mapa", {
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
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
// FUNÇÕES AUXILIARES
// ========================================

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================
// PINOS PERSONALIZADOS
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
// IDENTIFICAR TIPO DE ROTA
// ========================================

function descobrirTipo(rota) {
    const texto = normalizarTexto([
        rota.nome,
        rota.origem,
        rota.destino,
        rota.contexto,
        rota.causas,
        rota.dificuldades
    ].join(" "));

    const termosRefugio = [
        "refugio",
        "refugiado",
        "refugiados",
        "asilo",
        "rohingya",
        "sudao-chade",
        "deslocamento forcado"
    ];

    return termosRefugio.some(termo => texto.includes(termo))
        ? "refugiados"
        : "migracao";
}

// ========================================
// IDENTIFICAR REGIÃO
// ========================================

function descobrirRegiao(rota) {
    const texto = normalizarTexto([
        rota.nome,
        rota.origem,
        rota.destino,
        rota.contexto
    ].join(" "));

    if (
        texto.includes("america") ||
        texto.includes("colombia") ||
        texto.includes("venezuela") ||
        texto.includes("panama") ||
        texto.includes("mexico") ||
        texto.includes("darien") ||
        texto.includes("canarias")
    ) {
        // As Canárias ficam geograficamente próximas da África.
        // Para evitar classificar essa rota como americana,
        // verificamos o nome da rota primeiro.
        if (
            texto.includes("mediterraneo") ||
            texto.includes("norte da africa") ||
            texto.includes("africa ocidental") ||
            texto.includes("africa oriental") ||
            texto.includes("sudao") ||
            texto.includes("chade")
        ) {
            return "africa";
        }

        if (texto.includes("canarias")) return "africa";

        return "america";
    }

    if (
        texto.includes("africa") ||
        texto.includes("sudao") ||
        texto.includes("chade") ||
        texto.includes("etiopia") ||
        texto.includes("somalia") ||
        texto.includes("mediterraneo central") ||
        texto.includes("mediterraneo ocidental")
    ) {
        return "africa";
    }

    if (
        texto.includes("asia") ||
        texto.includes("mianmar") ||
        texto.includes("myanmar") ||
        texto.includes("bangladesh") ||
        texto.includes("rohingya") ||
        texto.includes("tailandia") ||
        texto.includes("oriente medio") ||
        texto.includes("afeganistao")
    ) {
        return "asia";
    }

    if (
        texto.includes("europa") ||
        texto.includes("italia") ||
        texto.includes("espanha") ||
        texto.includes("grecia") ||
        texto.includes("bala") ||
        texto.includes("balcas")
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

    const coordenadasInvalidas =
        rota.lat_origem === "" ||
        rota.lng_origem === "" ||
        rota.lat_destino === "" ||
        rota.lng_destino === "" ||
        rota.lat_origem == null ||
        rota.lng_origem == null ||
        rota.lat_destino == null ||
        rota.lng_destino == null ||
        !Number.isFinite(latOrigem) ||
        !Number.isFinite(lngOrigem) ||
        !Number.isFinite(latDestino) ||
        !Number.isFinite(lngDestino) ||
        Math.abs(latOrigem) > 90 ||
        Math.abs(latDestino) > 90 ||
        Math.abs(lngOrigem) > 180 ||
        Math.abs(lngDestino) > 180;

    if (coordenadasInvalidas) {
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

    linha.bindTooltip(escaparHTML(rota.nome), {
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
            <strong>${escaparHTML(rota.nome)}</strong>
            <br><br>
            <b>Origem:</b> ${escaparHTML(rota.origem)}
        </div>
    `);

    marcadorDestino.bindPopup(`
        <div class="popup-rota">
            <strong>${escaparHTML(rota.nome)}</strong>
            <br><br>
            <b>Destino:</b> ${escaparHTML(rota.destino)}
        </div>
    `);

    linha.bindPopup(`
        <div class="popup-rota">
            <strong>${escaparHTML(rota.nome)}</strong>
            <br><br>
            ${escaparHTML(rota.origem)} → ${escaparHTML(rota.destino)}
        </div>
    `);

    function selecionarRota() {
        mostrarInformacoes(rota);
        destacarRota(rota.id);
    }

    linha.on("click", function () {
        selecionarRota();

        mapa.fitBounds(linha.getBounds(), {
            padding: [60, 60],
            maxZoom: 6
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
            throw new Error(
                "Erro ao carregar rotas: " + response.status
            );
        }

        return response.json();
    })
    .then(rotas => {
        if (!Array.isArray(rotas)) {
            throw new Error("A API não retornou uma lista de rotas.");
        }

        console.log("ROTAS RECEBIDAS:", rotas);

        rotasOriginais = rotas;

        rotas.forEach(rota => {
            const elemento = criarElementoRota(rota);

            if (elemento) {
                elementosRotas.push(elemento);
            }
        });

        preencherFiltroRotas(rotas);
        preencherFiltroAnos(rotas);
        aplicarFiltros();

        mostrarPainelVazio(
            "Selecione uma rota",
            "Clique em uma linha ou pino do mapa para visualizar os detalhes."
        );
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

function preencherFiltroRotas(rotas) {
    const filtro = document.getElementById("filtro-rota");

    if (!filtro) return;

    filtro.innerHTML =
        '<option value="todas">Todas as rotas</option>';

    rotas.forEach(rota => {
        const opcao = document.createElement("option");

        opcao.value = String(rota.id);
        opcao.textContent = rota.nome || `Rota ${rota.id}`;

        filtro.appendChild(opcao);
    });
}

// ========================================
// PREENCHER FILTRO DE ANOS
// ========================================

function preencherFiltroAnos(rotas) {
    const filtro = document.getElementById("filtro-ano");

    if (!filtro) return;

    // Mantém as opções já definidas no HTML.
    // A opção "todos" será adicionada se ainda não existir.
    const jaExisteTodos = Array.from(filtro.options).some(
        opcao => opcao.value === "todos"
    );

    if (!jaExisteTodos) {
        const opcaoTodos = document.createElement("option");
        opcaoTodos.value = "todos";
        opcaoTodos.textContent = "Todos os anos";
        filtro.insertBefore(opcaoTodos, filtro.firstChild);
    }

    const anosCSV = [...new Set(
        rotas
            .map(rota => String(rota.ano || "").trim())
            .filter(ano => /^\d{4}$/.test(ano))
    )].sort((a, b) => Number(b) - Number(a));

    anosCSV.forEach(ano => {
        const existe = Array.from(filtro.options).some(
            opcao => opcao.value === ano
        );

        if (!existe) {
            const opcao = document.createElement("option");
            opcao.value = ano;
            opcao.textContent = ano;
            filtro.appendChild(opcao);
        }
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

        if (ano !== "todos") {
            // Sem coluna ano no CSV, não é possível
            // confirmar o ano de uma rota.
            if (
                rota.ano == null ||
                String(rota.ano).trim() !== ano
            ) {
                return false;
            }
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
            "Não existem rotas cadastradas para os filtros selecionados. Confira os filtros e os dados do CSV."
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

    painel.innerHTML = `
        <div class="painel-topo">
            <span class="painel-label">ROTA MIGRATÓRIA</span>
            <h2>${escaparHTML(rota.nome || "Rota sem nome")}</h2>
        </div>

        <div class="painel-trajeto">
            <div class="ponto-trajeto">
                <span>ORIGEM</span>
                <strong>📍 ${escaparHTML(rota.origem || "Não informada")}</strong>
            </div>

            <div class="linha-trajeto">→</div>

            <div class="ponto-trajeto">
                <span>DESTINO</span>
                <strong>🎯 ${escaparHTML(rota.destino || "Não informado")}</strong>
            </div>
        </div>

        <div class="informacoes-grid">
            <div class="card-info">
                <div class="icone-info">📖</div>
                <div>
                    <span>CONTEXTO</span>
                    <p>${escaparHTML(rota.contexto || "Informação não cadastrada.")}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">⚠️</div>
                <div>
                    <span>FATORES RELACIONADOS</span>
                    <p>${escaparHTML(rota.causas || "Informação não cadastrada.")}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">🚧</div>
                <div>
                    <span>DIFICULDADES</span>
                    <p>${escaparHTML(rota.dificuldades || "Informação não cadastrada.")}</p>
                </div>
            </div>

            <div class="card-info">
                <div class="icone-info">📚</div>
                <div>
                    <span>FONTE</span>
                    <p>${escaparHTML(rota.fonte || "Fonte não cadastrada.")}</p>
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
            <h3>${escaparHTML(titulo)}</h3>
            <p>${escaparHTML(texto)}</p>
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
// ESCONDER TODAS AS ROTAS
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
            fonte: "OIM — informações sobre migração"
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
                <span>${escaparHTML(noticia.tipo)}</span>
            </div>

            <h4>${escaparHTML(noticia.titulo)}</h4>
            <p>${escaparHTML(noticia.texto)}</p>

            <div class="fonte">
                Fonte: ${escaparHTML(noticia.fonte)}
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
        padding: [80, 80],
        maxZoom: 6
    });
}