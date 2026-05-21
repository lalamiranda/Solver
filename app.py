"""
API Flask — Solver Simplex Nutricional
Endpoint: POST /resolver
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend React


# ── Método Simplex Big-M ───────────────────────────────────────────────────

def simplex_minimization(c, A_ub, b_ub, var_names=None, constraint_names=None):
    """
    Minimizar:   c^T * x
    Sujeito a:   A_ub * x >= b_ub
                 x >= 0
    """
    nV = len(c)
    nC = len(b_ub)
    M  = 1_000_000.0

    if var_names is None:
        var_names = [f"x{i+1}" for i in range(nV)]
    if constraint_names is None:
        constraint_names = [f"R{i+1}" for i in range(nC)]

    nTotal = nV + nC + nC
    c_ext  = list(c) + [0.0] * nC + [M] * nC

    T = np.zeros((nC + 1, nTotal + 1))

    for i in range(nC):
        T[i, :nV]          = A_ub[i]
        T[i, nV + i]       = -1.0   # surplus
        T[i, nV + nC + i]  =  1.0   # artificial
        T[i, -1]           = b_ub[i]

    T[nC, :nTotal] = c_ext

    basis = list(range(nV + nC, nV + 2 * nC))

    for i in range(nC):
        T[nC] -= M * T[i]

    all_names = (
        var_names
        + [f"e{i+1}" for i in range(nC)]
        + [f"a{i+1}" for i in range(nC)]
    )

    iterations = []

    for it in range(200):
        pivot_col = int(np.argmin(T[nC, :-1]))
        if T[nC, pivot_col] >= -1e-8:
            break

        ratios = [
            (T[i, -1] / T[i, pivot_col], i)
            for i in range(nC) if T[i, pivot_col] > 1e-8
        ]
        if not ratios:
            return {"status": "ilimitado", "iteracoes": iterations}

        _, pivot_row = min(ratios)

        iterations.append({
            "iteracao":  it + 1,
            "entrando":  all_names[pivot_col],
            "saindo":    all_names[basis[pivot_row]],
            "base":      [all_names[b] for b in basis],
            "valor_z":   round(float(-T[nC, -1]), 4),
        })

        T[pivot_row] /= T[pivot_row, pivot_col]
        for i in range(nC + 1):
            if i != pivot_row:
                T[i] -= T[i, pivot_col] * T[pivot_row]

        basis[pivot_row] = pivot_col

    sol = np.zeros(nTotal)
    for i, b in enumerate(basis):
        sol[b] = T[i, -1]

    for i in range(nC):
        if sol[nV + nC + i] > 1e-6:
            return {"status": "inviável", "iteracoes": iterations}

    x    = sol[:nV]
    cost = float(np.dot(c, x))

    surplus = {
        constraint_names[i]: round(
            float(sum(A_ub[i][j] * x[j] for j in range(nV))) - b_ub[i], 4
        )
        for i in range(nC)
    }

    return {
        "status":        "ótimo",
        "solucao":       {var_names[j]: round(float(x[j]), 4) for j in range(nV)},
        "custo_otimo":   round(cost, 4),
        "surplus":       surplus,
        "iteracoes":     iterations,
        "num_iteracoes": len(iterations),
    }


# ── Endpoint ───────────────────────────────────────────────────────────────

@app.route("/resolver", methods=["POST"])
def resolver():
    """
    Body JSON esperado:
    {
        "proteina_min": 12, "ferro_min": 9, "tiamina_min": 15,
        "custo_a": 0.30,    "custo_b": 0.40,
        "proteina_a": 2, "proteina_b": 1,
        "ferro_a": 1,    "ferro_b": 1,
        "tiamina_a": 1,  "tiamina_b": 3
    }
    """
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "JSON inválido"}), 400

    campos = [
        "proteina_min","ferro_min","tiamina_min",
        "custo_a","custo_b",
        "proteina_a","proteina_b",
        "ferro_a","ferro_b",
        "tiamina_a","tiamina_b",
    ]
    faltando = [c for c in campos if c not in dados]
    if faltando:
        return jsonify({"erro": f"Campos ausentes: {faltando}"}), 400

    c     = [dados["custo_a"],    dados["custo_b"]]
    A_ub  = [
        [dados["proteina_a"], dados["proteina_b"]],
        [dados["ferro_a"],    dados["ferro_b"]],
        [dados["tiamina_a"],  dados["tiamina_b"]],
    ]
    b_ub  = [dados["proteina_min"], dados["ferro_min"], dados["tiamina_min"]]

    resultado = simplex_minimization(
        c=c, A_ub=A_ub, b_ub=b_ub,
        var_names=["A", "B"],
        constraint_names=["Proteína", "Ferro", "Tiamina"],
    )
    return jsonify(resultado)


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "servico": "Solver Simplex Nutricional"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
