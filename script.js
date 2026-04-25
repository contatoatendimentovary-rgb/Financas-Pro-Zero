let myChart;

function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
    if (nomeAba === 'extrato') carregarDados();
}

function salvarManual() {
    const desc = document.getElementById("desc").value;
    const valor = document.getElementById("valor").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || !valor) return alert("Preencha todos os campos!");

    const novoGasto = {
        descricao: desc,
        valor: parseFloat(valor),
        tipo: tipo,
        categoria: cat
    };

    let historico = JSON.parse(localStorage.getItem("transacoes") || "[]");
    historico.push(novoGasto);
    localStorage.setItem("transacoes", JSON.stringify(historico));

    // Limpar campos e voltar para o extrato
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    alert("✅ Lançamento realizado!");
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const dados = JSON.parse(localStorage.getItem("transacoes") || "[]");
    let rec = 0, des = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };
    const lista = document.getElementById("lista");
    if(!lista) return;
    lista.innerHTML = "";

    dados.forEach(d => {
        const v = parseFloat(d.valor) || 0;
        if (d.tipo === "receita") { 
            rec += v; 
        } else { 
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
