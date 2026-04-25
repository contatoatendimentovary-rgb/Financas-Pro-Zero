let myChart;
const DB_NAME = "FinancasPro_Definitivo";

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
    const valor = parseFloat(document.getElementById("valor").value);
    const catSelecionada = document.getElementById("cat").value;
    const data = document.getElementById("data").value;

    if (!descOriginal || isNaN(valor) || !data) return alert("Preencha tudo!");

    let tipo = "despesa";
    let categoria = catSelecionada;

    if (descOriginal.toLowerCase().includes("salario") || catSelecionada === "Receita") {
        tipo = "receita";
        categoria = "Entrada";
    }

    const item = { desc: descOriginal, valor, data, tipo, categoria, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem(DB_NAME) || "[]");
    banco.push(item);
    localStorage.setItem(DB_NAME, JSON.stringify(banco));

    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem(DB_NAME) || "[]");
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
                <div class="item-actions">
                    <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                        R$ ${t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                    <button class="btn-delete" onclick="apagarItem(${t.id})">✕</button>
                </div>
            </div>`;
    });

    document.getElementById("receita").innerText = `+ R$ ${r.toFixed(2)}`;
    document.getElementById("despesa").innerText = `- R$ ${d.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(r - d).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    gerarGrafico(c);
}

function apagarItem(id) {
    if (confirm("Deseja realmente apagar este lançamento?")) {
        let banco = JSON.parse(localStorage.getItem(DB_NAME) || "[]");
        banco = banco.filter(item => item.id !== id);
        localStorage.setItem(DB_NAME, JSON.stringify(banco));
        carregarDados(); // Atualiza a tela
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
            plugins: { legend: { position: 'bottom', labels: { color: '#8e8e93' } } },
            cutout: '80%'
        }
    });
}

function init() {
    document.getElementById('data').value = new Date().toISOString().substring(0, 10);
    const s = document.getElementById("filtroMes");
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth();
    s.innerHTML = "";
    for(let i = 0; i < 12; i++) {
        let m = new Date(anoAtual, i, 1);
        let v = m.toISOString().substring(0, 7);
        let nomeMes = m.toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
        nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1).replace(" de ", " ");
        let opt = document.createElement("option");
        opt.value = v;
        opt.innerText = nomeMes;
        if(i === mesAtual) opt.selected = true;
        s.appendChild(opt);
    }
    carregarDados();
}

function calcularMetas() {
    const banco = JSON.parse(localStorage.getItem(DB_NAME) || "[]");
    const filtro = document.getElementById("filtroMes").value;
    let receita = 0, gastos = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(filtro)).forEach(t => {
        if (t.tipo === 'receita') receita += t.valor;
        else if (gastos.hasOwnProperty(t.categoria)) gastos[t.categoria] += t.valor;
    });

    const painel = document.getElementById("painelMetas");
    const barra = (n, v, m, c) => {
        const perc = m > 0 ? Math.min((v/m)*100, 100) : 0;
        return `
            <div style="margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px">
                    <span>${n}</span><span>R$ ${v.toFixed(0)} / ${m.toFixed(0)}</span>
                </div>
                <div style="background:#2c2c2e; height:10px; border-radius:10px; overflow:hidden">
                    <div style="background:${c}; width:${perc}%; height:100%"></div>
                </div>
            </div>`;
    }

    painel.innerHTML = receita > 0 ? 
        barra("Essencial (50%)", gastos.Essencial, receita * 0.5, "#0A84FF") +
        barra("Lazer (30%)", gastos.Lazer, receita * 0.3, "#BF5AF2") +
        barra("Investimento (20%)", gastos.Investimento, receita * 0.2, "#32D74B") : "Sem receita.";
}

window.onload = init;
