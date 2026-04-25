let myChart;

function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    if (nomeAba === 'extrato') carregarDados();
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

        if (dado.erro) {
            status.innerText = "❌ " + dado.erro;
            return;
        }
        
        let storage = JSON.parse(localStorage.getItem("transacoes") || "[]");
        storage.push({ ...dado, data: new Date() });
        localStorage.setItem("transacoes", JSON.stringify(storage));

        status.innerText = "✅ Salvo!";
        input.value = "";
        setTimeout(() => { abrirAba(null, 'extrato'); }, 1500);

    } catch (e) { 
        status.innerText = "❌ Erro de rede ou servidor."; 
    }
}

function carregarDados() {
    const dados = JSON.parse(localStorage.getItem("transacoes") || "[]");
    let rec = 0, des = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };
    const lista = document.getElementById("lista");
    if(!lista) return;
    lista.innerHTML = "";

    dados.forEach(d => {
        const v = parseFloat(d.valor) || 0;
        if (d.tipo === "receita") { rec += v; } 
        else { 
            des += v; 
            if(cats[d.categoria] !== undefined) cats[d.categoria] += v;
        }
        lista.innerHTML += `<div class="item"><span>${d.descricao}</span><span class="${d.tipo}">R$ ${v.toFixed(2)}</span></div>`;
    });

    document.getElementById("receita").innerText = `R$ ${rec.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${des.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(rec - des).toFixed(2)}`;
    atualizarGrafico(cats);
}

function atualizarGrafico(cats) {
    const canvas = document.getElementById('grafico');
    if (!canvas) return;
    if (myChart) myChart.destroy();
    myChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ data: Object.values(cats), backgroundColor: ['#3b82f6', '#a855f7', '#22c55e'] }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: 'white' } } } }
    });
}

window.onload = carregarDados;
