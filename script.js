let currentChart;

// Tema e Navegação
document.getElementById('toggleTheme').onclick = () => {
    document.body.classList.toggle('dark-mode');
    window.carregarDados();
};

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    window.carregarDados();
}

// Carregamento de Dados
window.carregarDados = async () => {
    const user = window.auth.currentUser;
    if (!user) return;

    const mes = document.getElementById('filtroMes').value;
    const docRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(docRef);

    let rec = 0, fix = 0, laz = 0, inv = 0, html = "";
    let trans = snap.exists() ? snap.data().transacoes : [];

    trans.forEach((t, i) => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') rec += v;
        else if (t.tipo === 'fixo') fix += v;
        else if (t.tipo === 'lazer') laz += v;
        else if (t.tipo === 'investimento') inv += v;

        html += `
            <div class="entry-card">
                <div class="info"><b>${t.descricao}</b><br><small>${t.tipo}</small></div>
                <div class="amt">
                    <span style="color: ${t.tipo === 'entrada' ? 'var(--green)' : 'var(--text-main)'}">
                        ${t.tipo === 'entrada' ? '+' : '-'} R$ ${v.toFixed(2)}
                    </span>
                    <button class="btn-del" onclick="deletar(${i})">Excluir</button>
                </div>
            </div>`;
    });

    document.getElementById('saldo').innerText = `R$ ${(rec - (fix + laz + inv)).toFixed(2)}`;
    document.getElementById('resumo-receita').innerText = `R$ ${rec.toFixed(0)}`;
    document.getElementById('resumo-despesa').innerText = `R$ ${(fix + laz + inv).toFixed(0)}`;
    document.getElementById('lista').innerHTML = html || '<p style="text-align:center; padding:20px; opacity:0.5;">Nenhum registro.</p>';

    renderDash(rec, fix, laz, inv);
};

function renderDash(rec, fix, laz, inv) {
    updateBar('fixo', fix, rec * 0.5);
    updateBar('lazer', laz, rec * 0.3);
    updateBar('invest', inv, rec * 0.2);

    const ctx = document.getElementById('graficoPizza').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Invest.'],
            datasets: [{
                data: [fix, laz, inv],
                backgroundColor: ['#10B981', '#F59E0B', '#6366F1'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            cutout: '80%',
            plugins: {
                legend: { position: 'bottom', labels: { color: isDark ? '#94A3B8' : '#64748B', font: { size: 10, weight: '600' } } }
            }
        }
    });
}

function updateBar(id, val, meta) {
    const perc = meta > 0 ? Math.min((val/meta)*100, 100) : 0;
    document.getElementById(`bar-${id}`).style.width = perc + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${val.toFixed(0)} / ${meta.toFixed(0)}`;
    if (val > meta && meta > 0) document.getElementById(`bar-${id}`).style.background = '#EF4444';
}

// Funções de Registro
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('btnSalvar').onclick = async () => {
    const user = window.auth.currentUser;
    const desc = document.getElementById('desc').value;
    const valor = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;

    if (!user || !desc || !valor) return;

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    let trans = snap.exists() ? snap.data().transacoes : [];
    trans.push({ descricao: desc, valor: parseFloat(valor), tipo: tipo });

    await window.setDoc(ref, { transacoes: trans });
    document.getElementById('modal').style.display = 'none';
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    window.carregarDados();
};

window.deletar = async (index) => {
    if (!confirm("Excluir item?")) return;
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    let trans = snap.data().transacoes;
    trans.splice(index, 1);
    await window.setDoc(ref, { transacoes: trans });
    window.carregarDados();
};

document.getElementById('filtroMes').onchange = () => window.carregarDados();
