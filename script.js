let myChart;

function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    event.currentTarget.classList.add('active');
    if (nomeAba === 'extrato' || nomeAba === 'saude') carregarDados();
}

async function enviarGasto() {
    const input = document.getElementById("inputGasto");
    const status = document.getElementById("iaStatus");
    if (!input.value) return;

    status.innerText = "🤖 Analisando...";
    try {
        const resIA = await fetch("/api/server", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: input.value })
        });
        const dado = await resIA.json();
        
        // Simulação de salvamento local (substitua por sua API se tiver banco)
        let storage = JSON.parse(localStorage.getItem("transacoes") || "[]");
        storage.push({ ...dado, data: new Date() });
        localStorage.setItem("transacoes", JSON.stringify(storage));

        status.innerText = "✅ Salvo!";
        setTimeout(() => { abrirAba({currentTarget: document.querySelector('.tab-btn')}, 'extrato'); }, 1000);
        input.value = "";
        setTimeout(() => carregarDados(), 1000);
    } catch (e) { status.innerText = "❌ Erro na IA"; }
}

function carregarDados() {
    const dados = JSON.parse(localStorage.getItem("transacoes") || "[]");
    let rec = 0, des = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    dados.forEach(d => {
        if (d.tipo === "receita") rec += d.valor;
        else {
            des += d.valor;
            cats[d.categoria] = (cats[d.categoria] || 0) + d.valor;
        }
        lista.innerHTML += `<div class="item"><span>${d.descricao}</span><span class="${d.tipo}">R$ ${d.valor.toFixed(2)}</span></div>`;
    });

    document.getElementById("receita").innerText = `R$ ${rec.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${des.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(rec - des).toFixed(2)}`;

    atualizarGrafico(cats);
    renderizarSaude(rec, cats);
}

function atualizarGrafico(cats) {
    const ctx = document.getElementById('grafico').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ data: Object.values(cats), backgroundColor: ['#3b82f6', '#a855f7', '#22c55e'] }]
        },
        options: { plugins: { legend: { labels: { color: 'white' } } } }
    });
}

function renderizarSaude(receita, cats) {
    const metas = { fixo: receita * 0.5, lazer: receita * 0.3, invest: receita * 0.2 };
    atualizarBarra("bar-fixo", "txt-fixo", cats.Essencial, metas.fixo);
    atualizarBarra("bar-lazer", "txt-lazer", cats.Lazer, metas.lazer);
    atualizarBarra("bar-invest", "txt-invest", cats.Investimento, metas.invest);
}

function atualizarBarra(idBar, idTxt, atual, meta) {
    const porc = Math.min((atual / meta) * 100, 100) || 0;
    document.getElementById(idBar).style.width = porc + "%";
    document.getElementById(idTxt).innerText = `R$ ${atual.toFixed(2)} / R$ ${meta.toFixed(2)}`;
}

window.onload = carregarDados;
