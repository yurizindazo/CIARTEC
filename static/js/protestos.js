const mapaProtestos = L.map("mapa-protestos").setView([20, 0], 2);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(mapaProtestos);


// EXEMPLO DE PONTO
L.marker([48.8566, 2.3522])
    .addTo(mapaProtestos)
    .bindPopup(`
        <strong>Exemplo de acontecimento</strong><br>
        Paris, França<br>
        Informações serão adicionadas depois.
    `);