let myChart;

// Inicia com a data atual
document.getElementById('data').valueAsDate = new Date();

function abrirAba(e, aba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(aba).classList.add('active');
    e.currentTarget.classList.add('active');
    if (aba === 'extrato') carregarDados();
}

function salvarDado() {
    const desc = document.getElementById("desc").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || isNaN(valor)) return alert("Dados inválidos!");

    const transacao = { desc, valor, data, tipo, cat, id: Date.now() };
    const banco = JSON.parse(localStorage.getItem("financas_black") || "[]");
    banco.push(transacao);
    localStorage.setItem("financas_black", JSON.stringify(banco));

    alert("Lançado!");
    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    abrirAba({ currentTarget: document.querySelector('.nav-item') }, 'extrato');
}

function carregarDados() {
    const banco = JSON.parse(localStorage.getItem("financas_black") || "[]");
    const mesFiltro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    let r = 0, d = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(mesFiltro)).reverse().forEach(t => {
        if (t.tipo === 'receita') {
            r += t.valor;
        } else {
            d += t.valor;
            cats[t.cat] += t.valor;
        }

        lista.innerHTML += `
            <div class="list-item">
                <div class="info">
                    <strong>${t.desc}</strong>
                    <small>${t.data.split('-').reverse().join('/')} • ${t.cat}</small>
                </div>
                <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                    ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
                </span>
            </div>`;
    });

    document.getElementById("receita").innerText = `R$ ${r.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${d.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(r - d).toFixed(2)}`;
    
    atualizarGrafico(cats);
}

function atualizarGrafico(c) {
    const ctx = document.getElementById('grafico').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investimento'],
            datasets: [{
                data: [c.Essencial, c.Lazer, c.Investimento],
                backgroundColor: ['#3b82f6', '#a855f7', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } },
            cutout: '70%'
        }
    });
}

function montarMeses() {
    const s = document.getElementById("filtroMes");
    const agora = new Date();
    for(let i=0; i<6; i++) {
        let mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        let val = mes.toISOString().substring(0, 7);
        let label = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        s.innerHTML += `<option value="${val}">${label}</option>`;
    }
}

function limparBanco() { if(confirm("Apagar tudo?")) { localStorage.clear(); location.reload(); } }

window.onload = () => { montarMeses(); carregarDados(); };
