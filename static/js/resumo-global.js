
/* =========================================
   CIARTEC — RESUMO GLOBAL POR ANO
   Dados oficiais do ACNUR / UNHCR
========================================= */

const dadosResumoGlobal = {
    "2024": {
        refugiados: "42,7 milhões",
        asilo: "8,4 milhões",
        deslocados: "73,5 milhões",
        forcados: "123,2 milhões",
        periodo: "Final de 2024"
    },

    "2025": {
        refugiados: "41,6 milhões",
        asilo: "9,0 milhões",
        deslocados: "68,7 milhões",
        forcados: "117,8 milhões",
        periodo: "Final de 2025"
    },

    "2026": {
        refugiados: null,
        asilo: null,
        deslocados: null,
        forcados: null,
        periodo: "Dados anuais ainda não publicados"
    }
};

function atualizarResumoGlobal(ano) {
    const dados = dadosResumoGlobal[ano];

    if (!dados) return;

    const titulo = document.getElementById("titulo-resumo-global");
    const fonte = document.getElementById("periodo-fonte");

    if (titulo) {
        titulo.textContent = `Resumo Global (${ano})`;
    }

    const indicadores = [
        ["total-refugiados", "periodo-refugiados", dados.refugiados],
        ["total-asilo", "periodo-asilo", dados.asilo],
        ["total-deslocados", "periodo-deslocados", dados.deslocados],
        ["total-forcados", "periodo-forcados", dados.forcados]
    ];

    indicadores.forEach(([idValor, idPeriodo, valor]) => {
        const elementoValor = document.getElementById(idValor);
        const elementoPeriodo = document.getElementById(idPeriodo);

        if (elementoValor) {
            elementoValor.textContent = valor ?? "Não disponível";
        }

        if (elementoPeriodo) {
            elementoPeriodo.textContent = valor
                ? dados.periodo
                : "Sem dados globais confirmados para este ano";
        }
    });

    if (fonte) {
        fonte.textContent = ano;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const filtroAno = document.getElementById("filtro-ano");

    if (!filtroAno) return;

    filtroAno.addEventListener("change", () => {
        atualizarResumoGlobal(filtroAno.value);
    });

    atualizarResumoGlobal(filtroAno.value);
});
