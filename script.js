// Alternador de Tema
document.getElementById('toggleTheme').onclick = () => {
    document.body.classList.toggle('dark-mode');
};

window.carregarDados = async () => {
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    if (!user) return;

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);

    let totalReceita = 0, gastoFixo = 0, gastoLazer = 0, gastoInvest = 0;
    let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

    const listaUl = document.getElementById('lista');
    listaUl.innerHTML = "";

    transacoes.forEach(t => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') totalReceita += v;
        else if (t.tipo === 'fixo') gastoFixo += v;
        else if (t.tipo === 'lazer') gastoLazer += v;
        else if (t.tipo === 'investimento') gastoInvest += v;

        listaUl.innerHTML += `
            <li class="item">
                <span>${t.descricao}</span>
                <span class="${t.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida'}">R$ ${v.toFixed(2)}</span>
            </li>`;
    });

    // Cálculos 50-30-20
    const projFixo = totalReceita * 0.5;
    const projLazer = totalReceita * 0.3;
    const projInvest = totalReceita * 0.2;

    document.getElementById('saldo').innerText = `R$ ${(totalReceita - (gastoFixo + gastoLazer + gastoInvest)).toFixed(2)}`;

    // Atualiza Barras
    atualizarBarra('fixo', gastoFixo, projFixo);
    atualizarBarra('lazer', gastoLazer, projLazer);
    atualizarBarra('invest', gastoInvest, projInvest);
};

function atualizarBarra(id, atual, proj) {
    const porcentagem = proj > 0 ? (atual / proj) * 100 : 0;
    document.getElementById(`bar-${id}`).style.width = Math.min(porcentagem, 100) + '%';
    document.getElementById(`bar-${id}`).style.background = porcentagem > 100 ? '#ff4757' : '#00B894';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / R$ ${proj.toFixed(0)}`;
}

document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value, val = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value, mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !val) return alert("Dados incompletos!");

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    let lista = docSnap.exists() ? docSnap.data().transacoes : [];

    lista.push({ descricao: desc, valor: parseFloat(val), tipo, data: new Date().getTime() });
    await window.setDoc(dadosRef, { transacoes: lista });
    
    document.getElementById('modal').style.display = 'none';
    window.carregarDados();
};

document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDados();
