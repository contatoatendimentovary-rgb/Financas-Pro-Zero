let meuGrafico;

// Alternar Modo Escuro
document.getElementById('toggleTheme').onclick = () => {
    document.body.classList.toggle('dark-mode');
    window.carregarDados(); // Recarrega para ajustar as cores do gráfico
};

document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

window.carregarDados = async () => {
    const user = window.auth.currentUser;
    if (!user) return;

    const mes = document.getElementById('filtroMes').value;
    const docRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(docRef);

    let rec = 0, fix = 0, laz = 0, inv = 0, html = "";
    let trans = snap.exists() ? snap.data().transacoes : [];

    trans.forEach(t => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') rec += v;
        else if (t.tipo === 'fixo') fix += v;
        else if (t.tipo === 'lazer') laz += v;
        else if (t.tipo === 'investimento') inv += v;

        html += `
            <li class="entry-card" style="border-left-color: ${t.tipo === 'entrada' ? '#10B981' : '#F59E0B'}">
                <div><b>${t.descricao}</b><br><small>${t.tipo}</small></div>
                <span style="color: ${t.tipo === 'entrada' ? '#10B981' : 'var(--text)'}">R$ ${v.toFixed(2)}</span>
            </li>`;
    });

    document.getElementById('lista').innerHTML = html;
    document.getElementById('saldo').innerText = `R$ ${(rec - (fix + laz + inv)).toFixed(2)}`;

    updateBI('fixo', fix, rec * 0.5);
    updateBI('lazer', laz, rec * 0.3);
    updateBI('invest', inv, rec * 0.2);

    // Renderizar Gráfico Pizza
    renderPizza(fix, laz, inv);
};

function renderPizza(fix, laz, inv) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (meuGrafico) meuGrafico.destroy();

    meuGrafico = new Chart(ctx, {
        type: 'doughnut', // Estilo Rosca (mais moderno que pizza cheia)
        data: {
            labels: ['Essencial', 'Lazer', 'Investimento'],
            datasets: [{
                data: [fix, laz, inv],
                backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
                borderWidth: isDarkMode ? 0 : 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDarkMode ? '#F1F5F9' : '#334155',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            cutout: '70%' // Deixa o gráfico estilo "anel" fino
        }
    });
}

function updateBI(id, atual, meta) {
    const perc = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
    const bar = document.getElementById(`bar-${id}`);
    bar.style.width = perc + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / R$ ${meta.toFixed(0)}`;
    if (atual > meta && meta > 0) bar.style.background = "#EF4444";
}

document.getElementById('btnSalvar').onclick = async () => {
    const user = window.auth.currentUser;
    const desc = document.getElementById('desc').value;
    const valor = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;

    if (!user || !desc || !valor) return alert("Preencha tudo!");

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    let transacoes = snap.exists() ? snap.data().transacoes : [];

    transacoes.push({
        descricao: desc,
        valor: parseFloat(valor),
        tipo: tipo,
        data: new Date().getTime()
    });

    await window.setDoc(ref, { transacoes });
    document.getElementById('modal').style.display = 'none';
    window.carregarDados();
};

document.getElementById('filtroMes').onchange = () => window.carregarDados();
