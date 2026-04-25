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
    let dataSelecionada = document.getElementById("data").value;

    if (!desc || isNaN(valor)) return alert("Preencha descrição e valor!");

    let tipo = "despesa";
    let categoria = catSelecionada;

    if (desc.includes("salario") || desc.includes("pix") || desc.includes("recebi") || catSelecionada === "Receita") {
        tipo = "receita";
        categoria = "Entrada";
    }

    const item = { desc: descOriginal, valor, data: dataSelecionada, tipo, categoria, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem("db_final_v7") || "[]");
    banco.push(item);
    localStorage.setItem("db_final_v7", JSON.stringify(banco));

    alert("Salvo com sucesso!");
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    document.getElementById('data').value = new Date().toISOString().substring(0, 10);
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("db_final_v7") || "[]");
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
                        ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                    <button onclick="excluirItem(${t.id})" class="btn-del">✕</button>
                </div>
            </div>`;
    });

    document.getElementById("receita").innerText = `+ R$ ${r.toFixed(2)}`;
    document.getElementById("despesa").innerText = `- R$ ${d.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(r - d).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    gerarGrafico(c);
}

function calcularMetas() {
    const banco = JSON.parse(localStorage.getItem("db_final_v7") || "[]");
    let receita = 0;
    let gastos = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.forEach(t => {
        if (t.tipo === 'receita') receita += t.valor;
        else if (gastos.hasOwnProperty(t.categoria)) gastos[t.categoria] += t.valor;
    });

    const painel = document.getElementById("painelMetas");
    const criarBarra = (nome, atual, meta, cor) => {
        const perc = meta > 0 ? Math.min((atual/meta)*100, 100) : 0;
        const corBarra = atual > meta ? "#FF453A" : cor;
        return `
            <div class="meta-row">
                <div class="meta-info">
                    <span>${nome}</span>
                    <span>${perc.toFixed(0)}%</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width:${perc}%; background:${corBarra}; box-shadow: 0 0 10px ${corBarra}55"></div>
                </div>
                <div class="meta-footer">
                    <span>Gasto: R$ ${atual.toFixed(0)}</span>
                    <span>Limite: R$ ${meta.toFixed(0)}</span>
                </div>
            </div>`;
    };

    painel.innerHTML = receita > 0 ? 
        criarBarra("Essencial (50%)", gastos.Essencial, receita * 0.5, "#0A84FF") +
        criarBarra("Lazer (30%)", gastos.Lazer, receita * 0.3, "#BF5AF2") +
        criarBarra("Investimento (20%)", gastos.Investimento, receita * 0.2, "#32D74B")
        : "<p style='text-align:center; color:#666; padding:20px'>Lance uma receita para calcular.</p>";
}

function excluirItem(id) {
    if(confirm("Deseja apagar este registro?")) {
        let banco = JSON.parse(localStorage.getItem("db_final_v7") || "[]");
        banco = banco.filter(t => t.id !== id);
        localStorage.setItem("db_final_v7", JSON.stringify(banco));
        carregarDados();
    }
}

function gerarGrafico(dados) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (myChart) myChart.destroy();
    
    // Se não houver dados, exibe gráfico cinza vazio
    const semDados = dados.Essencial === 0 && dados.Lazer === 0 && dados.Investimento === 0;
    const finalData = semDados ? [1, 0, 0] : [dados.Essencial, dados.Lazer, dados.Investimento];
    const finalColors = semDados ? ['#2c2c2e'] : ['#0A84FF', '#BF5AF2', '#32D74B'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investir'],
            datasets: [{
                data: finalData,
                backgroundColor: finalColors,
                hoverOffset: 4,
                borderWidth: 0,
                borderRadius: 5
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom', labels: { color: '#8e8e93', font: { size: 12 }, padding: 20 } } 
            },
            cutout: '80%'
        }
    });
}

function init() {
    document.getElementById('data').value = new Date().toISOString().substring(0, 10);
    const s = document.getElementById("filtroMes");
    const agora = new Date();
    for(let i=0; i<12; i++) {
        let m = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        let v = m.toISOString().substring(0, 7);
        let nomeMes = m.toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
        nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1).replace(" de ", " ");
        s.innerHTML += `<option value="${v}">${nomeMes}</option>`;
    }
    carregarDados();
}
window.onload = init;
