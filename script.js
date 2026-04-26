let currentChart;

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

window.carregarDados = async () => {
    const user = window.auth.currentUser; if (!user) return;
    const mes = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    
    let r = 0, f = 0, l = 0, i = 0, html = "";
    let trans = snap.exists() ? snap.data().transacoes : [];

    // Ordenar por data
    trans.sort((a, b) => new Date(a.data) - new Date(b.data));

    trans.forEach((t, idx) => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') r += v;
        else { if(t.tipo === 'fixo') f += v; else if(t.tipo === 'lazer') l += v; else i += v; }
        
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

    document.getElementById('saldo').innerText = `R$ ${(r - (f + l + i)).toFixed(2)}`;
    document.getElementById('resumo-receita').innerText = `R$ ${r.toFixed(0)}`;
    document.getElementById('resumo-despesa').innerText = `R$ ${(f + l + i).toFixed(0)}`;
    document.getElementById('lista').innerHTML = html || '<p style="text-align:center;opacity:0.5">Sem lançamentos</p>';
    
    updateBars(r, f, l, i);
    renderPizza(f, l, i);
};

function updateBars(r, f, l, i) {
    const set = (id, v, m) => {
        const p = m > 0 ? Math.min((v/m)*100, 100) : 0;
        document.getElementById(`bar-${id}`).style.width = p + '%';
        document.getElementById(`txt-${id}`).innerText = `R$ ${v.toFixed(0)} / ${m.toFixed(0)}`;
    };
    set('fixo', f, r * 0.5); set('lazer', l, r * 0.3); set('invest', i, r * 0.2);
}

function renderPizza(f, l, i) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Invest'],
            datasets: [{ data: [f, l, i], backgroundColor: ['#10B981', '#F59E0B', '#6366F1'], borderWidth: 0 }]
        },
        options: { cutout: '80%', plugins: { legend: { position: 'bottom', labels: { color: document.body.classList.contains('dark-mode') ? '#94A3B8' : '#64748B' } } } }
    });
}

document.getElementById('abrirModal').onclick = () => {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('data-lancamento').valueAsDate = new Date();
};

document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('btnSalvar').onclick = async () => {
    const user = window.auth.currentUser;
    const d = document.getElementById('desc').value, v = document.getElementById('valor').value, t = document.getElementById('tipo').value, dt = document.getElementById('data-lancamento').value, m = document.getElementById('filtroMes').value;
    
    if (!user || !d || !v || !dt) { alert("Preencha todos os campos!"); return; }

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", m);
    const snap = await window.getDoc(ref);
    let trans = snap.exists() ? snap.data().transacoes : [];
    
    trans.push({ descricao: d, valor: parseFloat(v), tipo: t, data: dt });
    await window.setDoc(ref, { transacoes: trans });
    
    document.getElementById('modal').style.display = 'none';
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    window.carregarDados();
};

window.deletar = async (idx) => {
    const user = window.auth.currentUser; const m = document.getElementById('filtroMes').value;
    const ref = window.doc(window.db, "usuarios", user.uid, "meses", m);
    const snap = await window.getDoc(ref);
    let trans = snap.data().transacoes; 
    trans.splice(idx, 1);
    await window.setDoc(ref, { transacoes: trans });
    window.carregarDados();
};

document.getElementById('filtroMes').onchange = () => window.carregarDados();
