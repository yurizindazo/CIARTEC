from flask import Flask, render_template, jsonify
import pandas as pd

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/migracao")
def migracao():
    return render_template("paginas/migracao.html")


@app.route("/refugiados")
def refugiados():
    return render_template("paginas/refugiados.html")


@app.route("/direitos")
def direitos():
    return render_template("paginas/direitos.html")


@app.route("/protestos")
def protestos():
    return render_template("paginas/protestos.html")


@app.route("/api/rotas")
def api_rotas():
    dados = pd.read_csv("dados/rotas.csv")

    return jsonify(
        dados.to_dict(orient="records")
    )


@app.route("/api/resumo")
def api_resumo():
    dados = pd.read_csv("dados/rotas.csv")

    total_rotas = len(dados)
    total_origens = dados["origem"].nunique()
    total_destinos = dados["destino"].nunique()

    resumo_destinos = (
        dados["destino"]
        .value_counts()
        .reset_index()
    )
    resumo_destinos.columns = ["destino", "quantidade"]

    resumo_origens = (
        dados["origem"]
        .value_counts()
        .reset_index()
    )
    resumo_origens.columns = ["origem", "quantidade"]

    return jsonify({
        "total_rotas": int(total_rotas),
        "total_origens": int(total_origens),
        "total_destinos": int(total_destinos),
        "destinos": resumo_destinos.to_dict(orient="records"),
        "origens": resumo_origens.to_dict(orient="records")
    })


if __name__ == "__main__":
    app.run(debug=True)