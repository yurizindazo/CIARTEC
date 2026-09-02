// Criando o mapa
const mapa = L.map("mapa").setView([20, 0], 2);


// Mapa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

    attribution: "&copy; OpenStreetMap contributors"

}).addTo(mapa);


// Guardar todas as rotas desenhadas
const elementosRotas = [];


// Buscar as rotas no Flask
fetch("/api/rotas")
    .then(resposta => resposta.json())
    .then(rotas => {

        console.log(rotas);

        rotas.forEach(rota => {

            // Coordenadas da origem
            const origem = [
                rota.lat_origem,
                rota.lng_origem
            ];


            // Coordenadas do destino
            const destino = [
                rota.lat_destino,
                rota.lng_destino
            ];


            // Criando a linha da rota
            const linha = L.polyline(
                [origem, destino],
                {
                    weight: 5
                }
            ).addTo(mapa);


            // Marcador da origem
            const marcadorOrigem = L.marker(origem)
                .addTo(mapa)
                .bindPopup(`
                    <h3>Origem</h3>

                    <p>
                        ${rota.origem}
                    </p>
                `);


            // Marcador do destino
            const marcadorDestino = L.marker(destino)
                .addTo(mapa)
                .bindPopup(`
                    <h3>Destino</h3>

                    <p>
                        ${rota.destino}
                    </p>
                `);


            // Informações da rota
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


            // Guardar os elementos dessa rota
            elementosRotas.push({
                rota: rota,
                linha: linha,
                marcadorOrigem: marcadorOrigem,
                marcadorDestino: marcadorDestino
            });

        });


        // Filtro das rotas
        const filtro = document.getElementById("filtro-rota");


        filtro.addEventListener("change", function () {

            const rotaEscolhida = this.value;


            elementosRotas.forEach(elemento => {

            const identificador = String(elemento.rota.id);     
            
                if (rotaEscolhida === "todas") {

                elemento.linha.addTo(mapa);

                elemento.marcadorOrigem.addTo(mapa);

                elemento.marcadorDestino.addTo(mapa);

                mapa.fitBounds(
                elemento.linha.getBounds(),
                {
                padding: [50, 50]
            }
            );
        }

                // Mostrar somente a rota escolhida
                else if (identificador === rotaEscolhida) {

                    elemento.linha.addTo(mapa);
                    elemento.marcadorOrigem.addTo(mapa);
                    elemento.marcadorDestino.addTo(mapa);

                }
                // Mostr


                // Esconder as outras rotas
                else {

                    mapa.removeLayer(elemento.linha);
                    mapa.removeLayer(elemento.marcadorOrigem);
                    mapa.removeLayer(elemento.marcadorDestino);

                }

            });

        });

    })
    .catch(erro => {

        console.error("Erro ao carregar as rotas:", erro);

    });