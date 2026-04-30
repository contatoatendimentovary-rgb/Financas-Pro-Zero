// script.js - FinançasPRO Premium
let currentChart;

// Sistema de Abas (Sincronizado com o Index)
window.switchTab = (tabId, el) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    // Se mudar para aba que tem gráfico, ele renderiza novamente para evitar bugs de layout
    if (tabId === 'aba-dashboard' || tabId === 'aba-invest') window.carregarDados();
};

// Carregamento de Dados (Dashboard e Extrato)
window.carregarDados = async () => {
    const user = window.auth.currentUser; 
    if (!user) return;

    const mesSel = document.getElementById('filtroMes').value;
    
    // Feedback visual de carregamento
    const listaGeral = document.getElementById('lista-geral');
    if (listaGeral) listaGeral.innerHTML = '<div class="entry loading" style="height:80px"></div>';

    let r = 0, f = 0, l = 0, i = 0;
    let investMeses = Array(12).fill(0);
    let htmlGeral = "", htmlInvest = "";

    // Buscar dados de todos os meses para o gráfico de barras
    const promises = window.mesesNomes.map(m => window.f_getDoc(window.f_doc(window.db, "usuarios", user.uid, "meses", m)));
    const snaps = await Promise.all(promises);

    snaps.forEach((snap, index) => {
        const mesNome = window.mesesNomes[index];
        if (snap.exists()) {
            let trans = snap.data().transacoes || [];
            
            // Ordenar por data (Mais recente primeiro no extrato)
            trans.sort((a, b) => new Date(b.data) - new Date(a.data));

            trans.forEach((t, idx) => {
                const v = parseFloat(t.valor);
                
                // Acumular para o gráfico de investimentos (barra anual)
                if (t.tipo === 'investimento') investMeses[index] += v;

                // Processar apenas o mês selecionado para o Dashboard/Extrato
                if (mesNome === mesSel) {
                    if (t.tipo === 'entrada') { r += v; }
                    else { 
                        if(t.tipo === 'fixo') f += v; 
                        else if(t.tipo === 'lazer') l += v; 
                        else if(t.tipo === 'investimento') i += v;
                    }

                    const corValor = t.tipo === 'entrada' ? 'var(--green)' : 'var(--red)';
                    const sinal = t.tipo === 'entrada' ? '+' : '-';
                    const icon = window.getIcon ? window.getIcon(t.tipo, t.descricao) : '🏷️';

                    const card = `
                    <div class="entry">
                        <div class="entry-left">
                            <div class="entry-icon">${icon}</div>
                            <div class="entry-info">
                                <b>${t.descricao}</b>
                                <small>${t.data.split('-').reverse().join('/')}</small>
                            </div>
                        </div>
                        <div class="entry-right">
                            <span style="color:${corValor}">${sinal} R$ ${v.toFixed(2)}</span>
                            <button style="background:none;border:none;color:var(--red);font-size:1.2rem;cursor:pointer" onclick="apagar('${mesNome}', ${idx})">×</button>
                        </div>
                    </div>`;

                    htmlGeral += card;
                    if(t.tipo === 'investimento') htmlInvest += card;
                }
            });
        }
    });

    // Atualizar Saldo Principal
    const saldoTotal = r - (f + l + i);
    const saldoElement = document.getElementById('saldo');
    if (saldoElement) {
        saldoElement.innerText = `R$ ${saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        saldoElement.style.color = saldoTotal >= 0 ? 'var(--text)' : 'var(--red)';
    }

    // Injetar Listas
    if (listaGeral) listaGeral.innerHTML = htmlGeral || '<p style="text-align:center;color:var(--text-sub);padding:20px">Vazio</p>';
    const listaInvest = document.getElementById('lista-invest');
    if (listaInvest) listaInvest.innerHTML = htmlInvest || '<p style="text-align:center;color:var(--text-sub);padding:20px">Sem aportes</p>';

    // Atualizar Visualizações
    renderPizza(f, l, i);
    if(window.renderBarras) window.renderBarras(investMeses);
    atualizarRegra(f, l, i, r);
};

// --- GRÁFICO DOUGHNUT (Look Premium) ---
function renderPizza(f, l, i) {
    const canvas = document.getElementById('graficoPizza');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (currentChart) currentChart.destroy();
    
    // Se não houver dados, exibe um gráfico cinza vazio
    const temDados = (f + l + i) > 0;
    const dataValues = temDados ? [f, l, i] : [1];
    const bgColors = temDados ? ['#FDE047', '#22C55E', '#525252'] : ['#27272A'];

    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investimento'],
            datasets: [{ 
                data: dataValues, 
                backgroundColor: bgColors, 
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '85%', // Buraco bem grande para o saldo aparecer no meio (opcional)
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: temDados,
                    callbacks: {
                        label: (item) => ` R$ ${item.raw.toFixed(2)}`
                    }
                }
            }
        }
    });
}

// Lógica de Apagar (Melhorada)
window.apagar = async (mes, idx) => {
    if(!confirm("Deseja excluir este registro?")) return;
    const user = window.auth.currentUser;
    const ref = window.f_doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.f_getDoc(ref);
    
    if (snap.exists()) {
        let lista = snap.data().transacoes;
        lista.splice(idx, 1);
        await window.f_setDoc(ref, { transacoes: lista });
        window.carregarDados();
    }
};

// Ícones dinâmicos (Caso não esteja no Index)
window.getIcon = (tipo, desc) => {
    const d = desc.toLowerCase();
    if (tipo === 'entrada') return '💰';
    if (tipo === 'investimento') return '📈';
    if (d.includes('comida') || d.includes('ifood') || d.includes('restaurante')) return '🍴';
    if (d.includes('uber') || d.includes('gasolina') || d.includes('carro')) return '🚗';
    if (d.includes('mercado') || d.includes('compra')) return '🛒';
    if (d.includes('aluguel') || d.includes('casa') || d.includes('luz')) return '🏠';
    return '🏷️';
};
