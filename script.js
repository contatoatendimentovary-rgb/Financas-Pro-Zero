let chartPizza, chartBarras;

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    window.carregarDados();
}

window.carregarDados = async () => {
    const user = window.auth.currentUser;
    if (!user) return;

    const mes = document.getElementById('filtroMes').value;
    const docRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(docRef);

    let rec = 0, fix = 0, laz = 0, inv = 0, html = "";
    let trans = snap.exists() ? snap.data().transacoes : [];

    trans.forEach((t, index) => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') rec += v;
        else if (t.tipo === 'fixo') fix += v;
        else if (t.tipo === 'lazer') laz += v;
        else if (t.tipo === 'investimento') inv += v;

        html += `
            <li class="entry-card">
                <div><b>${t.descricao}</b><br><small style="color: #64748B">${t.tipo}</small></div>
                <div style="text-align: right">
                    <div style="color: ${t.tipo === 'entrada' ? '#10B981' : '#F1F5F9'}">R$ ${v.toFixed(2)}</div>
                    <button class="btn-delete" onclick="excluirItem(${index})">Apagar</button>
                </div>
            </li>`;
    });

    document.getElementById('lista').innerHTML = html;
    document.getElementById('saldo').innerText = `R$ ${(rec - (fix + laz + inv)).toFixed(2)}`;

    updateProgress('fixo', fix, rec * 0.5);
    updateProgress('lazer', laz, rec * 0.3);
    updateProgress('invest', inv, rec * 0.2);

    renderCharts(rec, fix, laz, inv);
};

async function excluirItem(index) {
    if (!confirm("Deseja apagar este registro?")) return;
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    
    const snap = await window.getDoc(ref);
    let trans = snap.data().transacoes;
    trans.splice(index, 1);
    
    await window.setDoc(ref, { transacoes: trans });
    window.carregarDados();
}

function renderCharts(rec, fix, laz, inv) {
    // Gráfico de Pizza (Aba Dashboard)
    const ctxP = document.getElementById('graficoPizza').getContext('2d');
    if (chartPizza) chartPizza.destroy();
    chartPizza = new Chart(ctxP, {
        type: 'doughnut',
        data: {
            labels: ['Fixo', 'Lazer', 'Invest'],
            datasets: [{ data: [fix, laz, inv], backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#F1F5F9' } } }, cutout: '75%' }
    });

    // Gráfico de Barras Geral (Receita vs Despesa)
    const ctxB = document.getElementById('graficoBarrasGeral').getContext('2d');
    if (chartBarras) chartBarras.destroy();
    chartBarras = new Chart(ctxB, {
        type: 'bar',
        data: {
            labels: ['Fluxo'],
            datasets: [
                { label: 'Receita', data: [rec], backgroundColor: '#10B981' },
                { label: 'Despesa', data: [fix + laz + inv], backgroundColor: '#EF4444' }
            ]
        },
        options: { scales: { y: { display: false } }, plugins: { legend: { labels: { color: '#F1F5F9' } } } }
    });
}

function updateProgress(id, atual, meta) {
    const p = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
    document.getElementById(`bar-${id}`).style.width = p + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / ${meta.toFixed(0)}`;
}

// Modal e Salvar (Mantidos)
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
    let transacoes = snap.exists() ? snap.data().transacoes : [];
    transacoes.push({ descricao: desc, valor: parseFloat(valor), tipo: tipo });

    await window.setDoc(ref, { transacoes });
    document.getElementById('modal').style.display = 'none';
    window.carregarDados();
};
