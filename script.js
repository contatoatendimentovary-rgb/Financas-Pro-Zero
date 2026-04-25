let myChart;
document.getElementById('data').valueAsDate = new Date();

function abrirAba(e, aba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(aba).classList.add('active');
    if(e && e.currentTarget) e.currentTarget.classList.add('active');
    if (aba === 'extrato') carregarDados();
}

function salvarNovoDado() {
    const desc = document.getElementById("desc").value;
    const valorInput = document.getElementById("valor").value;
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || !valorInput || !data) return alert("Preencha tudo!");

    const item = { desc, valor: parseFloat(valorInput), data, tipo, cat, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem("db_v4") || "[]");
    banco.push(item);
    localStorage.setItem("db_v4", JSON.stringify(banco));

    alert("Salvo!");
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("db_v4") || "[]");
    const filtro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    let r = 0, d = 0, c = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(filtro)).reverse().forEach(t => {
        if (t.tipo === 'receita') r += t.valor;
        else { d += t.valor; c[t.cat] += t.valor; }

        lista.innerHTML += `
            <div class="list-item">
                <div class="info">
                    <strong>${t.desc}</strong>
                    <small>${t.cat} • ${t.data.split('-').reverse().join('/')}</small>
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
    
    analisar(r, c);
    gerarGrafico(c);
}

function excluirItem(id) {
    if(confirm("Deseja apagar este lançamento?")) {
        let banco = JSON.parse(localStorage.getItem("db_v4") || "[]");
        banco = banco.filter(t => t.id !== id);
        localStorage.setItem("db_v4", JSON.stringify(banco));
        carregarDados();
    }
}

function analisar(receita, gastos) {
    const st = document.getElementById("statusOrcamento");
    if (receita === 0) { st.innerText = "S/ RECEITA"; st.style.background = "#444"; return; }
    
    const estourou = (gastos.Essencial > receita * 0.5) || (gastos.Lazer > receita * 0.3);
    st.innerText = estourou ? "🔴 RUIM" : "🟢 BOM";
    st.style.background = estourou ? "#FF453A" : "#32D74B";
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
