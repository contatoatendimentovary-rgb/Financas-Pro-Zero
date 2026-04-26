// Abrir e Fechar Modal
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';

window.carregarDados = async () => {
    const user = window.auth.currentUser;
    const mesAtual = document.getElementById('filtroMes').value;
    if (!user) return;

    const docRef = window.doc(window.db, "usuarios", user.uid, "meses", mesAtual);
    const snap = await window.getDoc(docRef);

    let receitas = 0, custoFixo = 0, lazer = 0, invest = 0, listaHTML = "";
    let transacoes = snap.exists() ? snap.data().transacoes : [];

    transacoes.forEach(t => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') receitas += v;
        else if (t.tipo === 'fixo') custoFixo += v;
        else if (t.tipo === 'lazer') lazer += v;
        else if (t.tipo === 'investimento') invest += v;

        listaHTML += `
            <li class="entry-card" style="border-left-color: ${t.tipo === 'entrada' ? '#10B981' : '#F59E0B'}">
                <div>
                    <div style="font-weight: 700; font-size: 14px;">${t.descricao}</div>
                    <small style="color: #64748B; text-transform: uppercase; font-size: 10px;">${t.tipo}</small>
                </div>
                <b style="color: ${t.tipo === 'entrada' ? '#10B981' : '#334155'}">R$ ${v.toFixed(2)}</b>
            </li>`;
    });

    document.getElementById('lista').innerHTML = listaHTML;
    document.getElementById('saldo').innerText = `R$ ${(receitas - (custoFixo + lazer + invest)).toFixed(2)}`;

    // BI Logic: 50-30-20
    renderBar('fixo', custoFixo, receitas * 0.5);
    renderBar('lazer', lazer, receitas * 0.3);
    renderBar('invest', invest, receitas * 0.2);
};

function renderBar(id, atual, meta) {
    const porcentagem = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
    document.getElementById(`bar-${id}`).style.width = porcentagem + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / R$ ${meta.toFixed(0)}`;
    
    // Alerta visual de orçamento excedido
    if (atual > meta && meta > 0) {
        document.getElementById(`bar-${id}`).style.background = "#EF4444";
    }
}

document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value;
    const valor = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !valor) return alert("Preencha todos os campos!");

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const snap = await window.getDoc(ref);
    let transacoes = snap.exists() ? snap.data().transacoes : [];

    transacoes.push({
        descricao: desc,
        valor: parseFloat(valor),
        tipo: tipo,
        data: new Date().toISOString()
    });

    await window.setDoc(ref, { transacoes });
    document.getElementById('modal').style.display = 'none';
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    window.carregarDados();
};

document.getElementById('filtroMes').onchange = () => window.carregarDados();
