let myChart;

function abrirAba(e, aba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(aba).classList.add('active');
    if(e && e.currentTarget) e.currentTarget.classList.add('active');
    
    if (aba === 'extrato') carregarDados();
    if (aba === 'metas') calcularMetas();
}

function salvarInteligente() {
    const descOriginal = document.getElementById("desc").value;
    const desc = descOriginal.toLowerCase();
    const valor = parseFloat(document.getElementById("valor").value);
    const catSelecionada = document.getElementById("cat").value;
    const data = new Date().toISOString().substring(0, 10);

    if (!desc || isNaN(valor)) return alert("Preencha descrição e valor!");

    let tipo = "despesa";
    let categoria = catSelecionada;

    // Automação: Se detectar palavras de entrada ou categoria Receita
    if (desc.includes("salario") || desc.includes("pix") || desc.includes("recebi") || catSelecionada === "Receita") {
        tipo = "receita";
        categoria = "Entrada";
    }

    const item = { desc: descOriginal, valor, data, tipo, categoria, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem("db_v5") || "[]");
    banco.push(item);
    localStorage.setItem("db_v5", JSON.stringify(banco));

    alert("Registrado como: " + tipo.toUpperCase());
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("db_v5") || "[]");
    const filtro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    let r = 0, d = 0, c = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(filtro)).reverse().forEach(t => {
        if (t.tipo === 'receita') r += t.valor;
        else { 
            d += t.valor; 
            if(c.hasOwnProperty(t.categoria)) c[t.categoria] += t.valor;
        }

        lista.innerHTML += `
            <div class="list-item">
                <div class="info">
                    <strong>${t.desc}</strong>
                    <small>${t.categoria} • ${t.data.split('-').reverse().join('/')}</small>
                </div>
                <div class="action-price">
                    <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                        R$ ${t.valor.toFixed(2)}
                    </span>
                    <button onclick="excluirItem(${t.id})" class="btn-del">✕</button>
                </div>
            </div>`;
    });

    document.getElementById("receita").innerText = `R$ ${r.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${d.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(r - d).toFixed(2)}`;
    
    gerarGrafico(c);
}

function calcularMetas() {
    const banco = JSON.parse(localStorage.getItem("db_v5") || "[]");
    let receita = 0;
    let gastos = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.forEach(t => {
        if (t.tipo === 'receita') receita += t.valor;
        else if (gastos.hasOwnProperty(t.categoria)) gastos[t.categoria] += t.valor;
    });

    const painel = document.getElementById("painelMetas");
    const criarBarra = (nome, atual, meta, cor) => {
        const perc = meta > 0 ? Math.min((atual/meta)*100, 100) : 0;
        const status = atual > meta && meta > 0 ? "🔴 Estourou" : "🟢 OK";
        return `
            <div style="margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; font-size:12px">
                    <span>${nome} (Meta: R$ ${meta.toFixed(0)})</span>
                    <span>${status}</span>
                </div>
                <div style="background:#333; height:10px; border-radius:5px; margin-top:5px">
                    <div style="background:${cor}; width:${perc}%; height:100%; border-radius:5px"></div>
                </div>
                <small>Gasto: R$ ${atual.toFixed(2)}</small>
            </div>`;
    };

    painel.innerHTML = receita > 0 ? 
        criarBarra("Essencial (50%)", gastos.Essencial, receita * 0.5, "#0A84FF") +
        criarBarra("Lazer (30%)", gastos.Lazer, receita * 0.3, "#BF5AF2") +
        criarBarra("Investimento (20%)", gastos.Investimento, receita * 0.2, "#32D74B")
        : "<p>Adicione uma receita para ver as metas.</p>";
}

function excluirItem(id) {
    if(confirm("Apagar registro?")) {
        let banco = JSON.parse(localStorage.getItem("db_v5") || "[]");
        banco = banco.filter(t => t.id !== id);
        localStorage.setItem("db_v5", JSON.stringify(banco));
        carregarDados();
    }
}

function gerarGrafico(dados) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investir'],
            datasets: [{
                data: [dados.Essencial, dados.Lazer, dados.Investimento],
                backgroundColor: ['#0A84FF', '#BF5AF2', '#32D74B'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff', boxWidth: 12 } } },
            cutout: '75%'
        }
    });
}

function init() {
    const s = document.getElementById("filtroMes");
    const agora = new Date();
    for(let i=0; i<12; i++) {
        let m = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        let v = m.toISOString().substring(0, 7);
        s.innerHTML += `<option value="${v}">${m.toLocaleDateString('pt-BR', {month:'short', year:'numeric'})}</option>`;
    }
    carregarDados();
}
window.onload = init;
