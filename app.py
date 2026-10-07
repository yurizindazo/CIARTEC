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

    return jsonify(dados.to_dict(orient="records"))


if __name__ == "__main__":
    app.run(debug=True)