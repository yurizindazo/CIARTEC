from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

CAMINHO_CSV = os.path.join(
    os.path.dirname(__file__),
    "dados",
    "rotas.csv"
)


# ========================================
# FUNÇÃO PARA CARREGAR OS DADOS
# ========================================

def carregar_rotas():

    dados = pd.read_csv(CAMINHO_CSV)

    # Troca valores vazios/NaN por None
    # para o JSON ficar válido
    dados = dados.astype(object).where(
        pd.notna(dados),
        None
    )

    return dados


# ========================================
# PÁGINA INICIAL
# ========================================

@app.route("/")
def inicio():
    return render_template("index.html")


# ========================================
# PÁGINA MIGRAÇÃO
# ========================================

@app.route("/migracao")
def migracao():
    return render_template("paginas/migracao.html")


# ========================================
# PÁGINA REFUGIADOS
# ========================================

@app.route("/refugiados")
def refugiados():
    return render_template("paginas/refugiados.html")


# ========================================
# PÁGINA DIREITOS
# ========================================

@app.route("/direitos")
def direitos():
    return render_template("paginas/direitos.html")


# ========================================
# PÁGINA PROTESTOS
# ========================================

@app.route("/protestos")
def protestos():
    return render_template("paginas/protestos.html")


# ========================================
# API DAS ROTAS
# ========================================

@app.route("/api/rotas")
def api_rotas():

    dados = carregar_rotas()

    return jsonify(
        dados.to_dict(orient="records")
    )


# ========================================
# API DO RESUMO
# ========================================

@app.route("/api/resumo")
def api_resumo():

    dados = carregar_rotas()

    total_rotas = len(dados)

    total_origens = dados["origem"].nunique()

    total_destinos = dados["destino"].nunique()


    resumo_destinos = (
        dados["destino"]
        .value_counts()
        .reset_index()
    )

    resumo_destinos.columns = [
        "destino",
        "quantidade"
    ]


    resumo_origens = (
        dados["origem"]
        .value_counts()
        .reset_index()
    )

    resumo_origens.columns = [
        "origem",
        "quantidade"
    ]


    return jsonify({

        "total_rotas": int(total_rotas),

        "total_origens": int(total_origens),

        "total_destinos": int(total_destinos),

        "destinos":
            resumo_destinos.to_dict(
                orient="records"
            ),

        "origens":
            resumo_origens.to_dict(
                orient="records"
            )

    })


# ========================================
# INICIAR SERVIDOR
# ========================================

if __name__ == "__main__":

    app.run(
        debug=True
    )