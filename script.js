// script.js - FinançasPRO Premium (Ajuste de Gráfico e Layout)

let currentChart;

// Alternador de Tema
document.getElementById('toggleTheme').onclick = () => {
    document.body.classList.toggle('dark-mode');
    window.carregarDados();
};

// Sistema de Abas
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    window.carregarDados();
}

// Carregamento de Dados (Dashboard, Extrato, Metas)
window.carregarDados = async () => {
    const user = window.auth.currentUser; if (!user) return;
    const mes = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    
    let r = 0, f = 0, l = 0, i = 0, html = "";
    let trans = snap.exists() ? snap.data().transacoes : [];

    // Ordenar transações por data automaticamente
    trans.sort((a, b) => new Date(a.data) - new Date(b.data));

    trans.forEach((t, idx) => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') r += v;
        else { if(t.tipo === 'fixo') f += v; else if(t.tipo === 'lazer') l += v; else i += v; }
        
        // Pega o dia (ex: Dia 15)
        const dia = t.data ? t.data.split('-')[2] : '??';

        html += `
        <div class="entry-card">
            <div>
                <span class="badge-dia">Dia ${dia}</span>
                <b>${t.descricao}</b><br>
                <small>${t.tipo}</small>
            </div>
            <div style="text-align:right">
                <span style="color:${t.tipo==='entrada'?'var(--green)':'var(--red)'}">
                    ${t.tipo==='entrada'?'+':'-'} R$ ${v.toFixed(2)}
                </span><br>
                <button class="btn-del" onclick="deletar(${idx})">Remover</button>
            </div>
        </div>`;
    });

    // Atualização dos Card de Saldo e Resumo
    const totalGasto = f + l + i;
    document.getElementById('saldo').innerText = `R$ ${(r - totalGasto).toFixed(2)}`;
    document.getElementById('resumo-receita').innerText = `R$ ${r.toFixed(0)}`;
    document.getElementById('resumo-despesa').innerText = `R$ ${totalGasto.toFixed(0)}`;
    
    // Lista de Lançamentos (Extrato)
    document.getElementById('lista').innerHTML = html || '<p style="text-align:center;opacity:0.5;padding:20px;">Vazio</p>';
    
    updateBars(r, f, l, i);
    
    // CHAMADA DO GRÁFICO (Aqui estão os principais ajustes)
    renderPizza(f, l, i);
};

// Barras de Progresso (Aba Metas)
function updateBars(r, f, l, i) {
    const set = (id, v, m) => {
        const p = m > 0 ? Math.min((v/m)*100, 100) : 0;
        document.getElementById(`bar-${id}`).style.width = p + '%';
        document.getElementById(`txt-${id}`).innerText = `R$ ${v.toFixed(0)} / ${m.toFixed(0)}`;
    };
    set('fixo', f, r * 0.5); set('lazer', l, r * 0.3); set('invest', i, r * 0.2);
}

// --- AJUSTE DEFINITIVO DO GRÁFICO ---
function renderPizza(f, l, i) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    
    // Evita sobreposição de gráficos ao carregar
    if (currentChart) currentChart.destroy();
    
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            // Rótulos técnicos, não visíveis na legenda, mas usados por tooltips
            labels: ['Essencial', 'Lazer', 'Invest'],
            datasets: [{ 
                data: [f, l, i], 
                // Cores Black & Neon (Amarelo, Laranja, Vermelho)
                backgroundColor: ['#EF4444', '#F97316', '#FDE047'], 
                borderWidth: 0 // Sem bordas para look moderno
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // O CSS controla o tamanho
            cutout: '88%', // Buraco central maior (look Mobils)
            plugins: {
                // REMOÇÃO DA LEGENDA EMBUTIDA
                legend: {
                    display: false // Desativa a legenda que espremia o gráfico
                },
                // HabilitaTooltips (Diz o valor ao clicar)
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { family: 'Plus Jakarta Sans', size: 14, weight: '800' },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.parsed || 0;
                            return label + ': R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Modal de Lançamento
document.getElementById('abrirModal').onclick = () => {
    document.getElementById('modal').style.display = 'flex';
    // Preenche com a data de hoje por padrão
    document.getElementById('data-lancamento').valueAsDate = new Date();
};
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

// Salvar Lançamento no Firebase
document.getElementById('btnSalvar').onclick = async () => {
    const user = window.auth.currentUser;
    const d = document.getElementById('desc').value, v = document.getElementById('valor').value, t = document.getElementById('tipo').value, dt = document.getElementById('data-lancamento').value, m = document.getElementById('filtroMes').value;
    
    if (!user || !d || !v || !dt) { alert("Preencha Descrição, Valor e Data!"); return; }

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", m);
    const snap = await window.getDoc(ref);
    let trans = snap.exists() ? snap.data().transacoes : [];
    
    // Adiciona o novo lançamento
    trans.push({ descricao: d, valor: parseFloat(v), tipo: t, data: dt });
    
    // Salva no Firebase
    await window.setDoc(ref, { transacoes: trans });
    
    // Fecha o modal e limpa
    document.getElementById('modal').style.display = 'none';
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    window.carregarDados();
};

// Remover Lançamento
window.deletar = async (idx) => {
    const user = window.auth.currentUser; const m = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", m);
    const snap = await window.getDoc(ref);
    let trans = snap.data().transacoes; trans.splice(idx, 1);
    await window.setDoc(ref, { transacoes: trans });
    window.carregarDados();
};

// Filtro de Mês
document.getElementById('filtroMes').onchange = () => window.carregarDados();
