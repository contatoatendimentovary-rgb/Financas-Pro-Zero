let myChart;

document.getElementById('data').valueAsDate = new Date();

function abrirAba(e, aba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(aba).classList.add('active');
    if(e) e.currentTarget.classList.add('active');
    if (aba === 'extrato') carregarDados();
}

function salvarNovoDado() {
    const desc = document.getElementById("desc").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || isNaN(valor)) return alert("Preencha os campos corretamente!");

    const item = { desc, valor, data, tipo, cat, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem("db_financas") || "[]");
    banco.push(item);
    localStorage.setItem("db_financas", JSON.stringify(banco));

    // Limpa campos
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    alert("Registrado!");
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("db_financas") || "[]");
    const filtro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    let r = 0, d = 0, c = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(filtro)).reverse().forEach(t => {
        if (t.tipo === 'receita') r += t.valor;
        else {
            d += t.valor;
            c[t.cat] += t.valor;
        }

        lista.innerHTML += `
            <div class="list-item">
                <div><strong>${t.desc}</strong><br><small>${t.cat}</small></div>
                <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                    R$ ${t.valor.toFixed(2)}
                </span>
            </div>`;
    });

    document.getElementById("receita").innerText = `R$ ${r.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${d.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(r - d).toFixed(2)}`;
    
    analisarOrcamento(r, c);
    gerarGrafico(c);
}

function analisarOrcamento(receitaTotal, gastos) {
    const status = document.getElementById("statusOrcamento");
    if (receitaTotal === 0) {
        status.innerText = "Aguardando Receitas";
        status.style.background = "#666";
        return;
    }

    // Regra 50/30/20
    const limiteEssencial = receitaTotal * 0.5;
    const limiteLazer = receitaTotal * 0.3;
    
    let mensagem = "✅ Orçamento Saudável";
    status.style.background = "#10b981";

    if (gastos.Essencial > limiteEssencial || gastos.Lazer > limiteLazer) {
        mensagem = "⚠️ Alerta: Gastos Excessivos!";
        status.style.background = "#ef4444";
    }

    status.innerText = mensagem;
}

function gerarGrafico(dados) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Essencial', 'Lazer', 'Investir'],
            datasets: [{
                data: [dados.Essencial, dados.Lazer, dados.Investimento],
                backgroundColor: ['#3b82f6', '#a855f7', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

function init() {
    const s = document.getElementById("filtroMes");
    const agora = new Date();
    for(let i=0; i<6; i++) {
        let m = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        let v = m.toISOString().substring(0, 7);
        s.innerHTML += `<option value="${v}">${m.toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</option>`;
    }
    carregarDados();
}

window.onload = init;
