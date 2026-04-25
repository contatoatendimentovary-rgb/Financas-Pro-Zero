let myChart;

// Define a data de hoje automaticamente
document.getElementById('data').valueAsDate = new Date();

function abrirAba(e, aba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(aba).classList.add('active');
    if(e && e.currentTarget) e.currentTarget.classList.add('active');
    if (aba === 'extrato') carregarDados();
}

// ESTA É A FUNÇÃO QUE O BOTÃO CHAMA - NOME CORRIGIDO
function salvarNovoDado() {
    const desc = document.getElementById("desc").value;
    const valorInput = document.getElementById("valor").value;
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || !valorInput || !data) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const valor = parseFloat(valorInput);

    const item = { 
        desc, 
        valor, 
        data, 
        tipo, 
        cat, 
        id: Date.now() 
    };

    // Salva no Banco Local
    const banco = JSON.parse(localStorage.getItem("db_financas_v3") || "[]");
    banco.push(item);
    localStorage.setItem("db_financas_v3", JSON.stringify(banco));

    // Feedback e Limpeza
    alert("Lançamento realizado com sucesso!");
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    
    // Volta para o Dashboard automaticamente
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("db_financas_v3") || "[]");
    const filtro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    
    if(!lista) return;
    lista.innerHTML = "";

    let r = 0, d = 0, c = { Essencial: 0, Lazer: 0, Investimento: 0 };

    const dadosFiltrados = banco.filter(t => t.data.startsWith(filtro));

    dadosFiltrados.reverse().forEach(t => {
        if (t.tipo === 'receita') {
            r += t.valor;
        } else {
            d += t.valor;
            c[t.cat] += t.valor;
        }

        lista.innerHTML += `
            <div class="list-item">
                <div><strong>${t.desc}</strong><br><small>${t.cat}</small></div>
                <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                    ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
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
    if (!status) return;

    if (receitaTotal === 0) {
        status.innerText = "Aguardando Receitas";
        status.style.background = "#444";
        return;
    }

    const limiteEssencial = receitaTotal * 0.5;
    const limiteLazer = receitaTotal * 0.3;
    
    if (gastos.Essencial > limiteEssencial || gastos.Lazer > limiteLazer) {
        status.innerText = "⚠️ Orçamento Estourado";
        status.style.background = "#FF453A";
    } else {
        status.innerText = "✅ Orçamento em Dia";
        status.style.background = "#32D74B";
    }
}

function gerarGrafico(dados) {
    const canvas = document.getElementById('graficoPizza');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Essencial', 'Lazer', 'Investir'],
            datasets: [{
                data: [dados.Essencial, dados.Lazer, dados.Investimento],
                backgroundColor: ['#0A84FF', '#BF5AF2', '#32D74B'],
                borderWidth: 2,
                borderColor: '#1c1c1e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom', labels: { color: '#fff', padding: 20 } } 
            }
        }
    });
}

function init() {
    const s = document.getElementById("filtroMes");
    if(!s) return;
    const agora = new Date();
    s.innerHTML = "";
    for(let i=0; i<6; i++) {
        let m = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        let v = m.toISOString().substring(0, 7);
        s.innerHTML += `<option value="${v}">${m.toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</option>`;
    }
    carregarDados();
}

window.onload = init;
