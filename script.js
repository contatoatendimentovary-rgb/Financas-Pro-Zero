// Controles de interface
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

// Função para carregar e calcular dados
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
            <li class="entry-card" style="border-left: 4px solid ${t.tipo === 'entrada' ? '#10B981' : '#F59E0B'}">
                <div><b>${t.descricao}</b><br><small>${t.tipo}</small></div>
                <span style="color: ${t.tipo === 'entrada' ? '#10B981' : '#334155'}">R$ ${v.toFixed(2)}</span>
            </li>`;
    });

    document.getElementById('lista').innerHTML = html;
    document.getElementById('saldo').innerText = `R$ ${(rec - (fix + laz + inv)).toFixed(2)}`;

    // Atualiza as metas BI
    updateBI('fixo', fix, rec * 0.5);
    updateBI('lazer', laz, rec * 0.3);
    updateBI('invest', inv, rec * 0.2);
};

function updateBI(id, atual, meta) {
    const perc = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
    const bar = document.getElementById(`bar-${id}`);
    bar.style.width = perc + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / R$ ${meta.toFixed(0)}`;
    if (atual > meta && meta > 0) bar.style.background = "#EF4444";
}

// SALVAMENTO REAL NO FIREBASE
document.getElementById('btnSalvar').onclick = async () => {
    const user = window.auth.currentUser;
    const desc = document.getElementById('desc').value;
    const valor = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;

    if (!user || !desc || !valor) {
        alert("Preencha a descrição e o valor!");
        return;
    }

    try {
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
        
        // Limpar e fechar
        document.getElementById('modal').style.display = 'none';
        document.getElementById('desc').value = "";
        document.getElementById('valor').value = "";
        
        window.carregarDados();
        alert("Registrado com sucesso!");
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
};

document.getElementById('filtroMes').onchange = () => window.carregarDados();
