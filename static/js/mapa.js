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


        // ========================================
        // CRIAR CADA ROTA
        // ========================================

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

            const linha = L.polyline(
                [origem, destino],
                {
                    weight: 5
                }
            ).addTo(mapa);


            // ========================================
            // MARCADOR DA ORIGEM
            // ========================================

            const marcadorOrigem = L.marker(origem)
                .addTo(mapa)
                .bindPopup(`

                    <h3>Origem</h3>

                    <p>
                        ${rota.origem}
                    </p>

                `);


            // Clique na origem
            marcadorOrigem.on("click", function () {

                mostrarInformacoes(rota);

            });


            // ========================================
            // MARCADOR DO DESTINO
            // ========================================

            const marcadorDestino = L.marker(destino)
                .addTo(mapa)
                .bindPopup(`

                    <h3>Destino</h3>

                    <p>
                        ${rota.destino}
                    </p>

                `);


            // Clique no destino
            marcadorDestino.on("click", function () {

                mostrarInformacoes(rota);

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

        });


        // ========================================
        // FILTRO DAS ROTAS
        // ========================================

        const filtro = document.getElementById("filtro-rota");


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


    // Atualiza o filtro
    filtro.value = String(rota.id);


    // Atualiza o painel
    painel.innerHTML = `

        <h2>${rota.nome}</h2>


        <p>

            <strong>Origem:</strong>

            ${rota.origem}

        </p>


        <p>

            <strong>Destino:</strong>

            ${rota.destino}

        </p>


        <div class="info-rota">

            <h3>Contexto</h3>

            <p>
                ${rota.contexto || "Não informado."}
            </p>

        </div>


        <div class="info-rota">

            <h3>Dificuldades</h3>

            <p>
                ${rota.dificuldades || "Não informado."}
            </p>

        </div>


        <p>

            <strong>Fonte:</strong>

            ${rota.fonte}

        </p>

    `;

}