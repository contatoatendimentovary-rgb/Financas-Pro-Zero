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

    let rec = 0, fixo = 0, lazer = 0, inv = 0, trans = [];
    if (docSnap.exists()) trans = docSnap.data().transacoes || [];

    const lista = document.getElementById('lista');
    lista.innerHTML = "";

    trans.forEach(t => {
        const v = parseFloat(t.valor);
        if (t.tipo === 'entrada') rec += v;
        else if (t.tipo === 'fixo') fixo += v;
        else if (t.tipo === 'lazer') lazer += v;
        else if (t.tipo === 'investimento') inv += v;

        lista.innerHTML += `
            <li class="item" style="border-left: 5px solid ${t.tipo === 'entrada' ? '#00D166' : '#FF7A00'}">
                <div><b>${t.descricao}</b><br><small style="color: #999; text-transform: capitalize;">${t.tipo}</small></div>
                <span style="color: ${t.tipo === 'entrada' ? '#00D166' : '#FF7A00'}; font-weight: bold;">R$ ${v.toFixed(2)}</span>
            </li>`;
    });

    // Cálculos 50-30-20
    const pFixo = rec * 0.5;
    const pLazer = rec * 0.3;
    const pInv = rec * 0.2;

    document.getElementById('saldo').innerText = `R$ ${(rec - (fixo + lazer + inv)).toFixed(2)}`;

    updateBar('fixo', fixo, pFixo);
    updateBar('lazer', lazer, pLazer);
    updateBar('invest', inv, pInv);
};

function updateBar(id, atual, proj) {
    const perc = proj > 0 ? Math.min((atual / proj) * 100, 100) : 0;
    const bar = document.getElementById(`bar-${id}`);
    bar.style.width = perc + '%';
    document.getElementById(`txt-${id}`).innerText = `R$ ${atual.toFixed(0)} / R$ ${proj.toFixed(0)}`;
    
    // Se estourar o orçamento projetado, a barra fica vermelha
    if (atual > proj && proj > 0) {
        bar.style.background = '#FF453A';
    } else {
        // Volta para a cor original caso não esteja estourado
        if(id === 'fixo') bar.style.background = '#00D166';
        if(id === 'lazer') bar.style.background = '#FF7A00';
        if(id === 'invest') bar.style.background = '#00A3FF';
    }
}

document.getElementById('btnSalvar').onclick = async () => {
    const d = document.getElementById('desc').value, v = document.getElementById('valor').value;
    const t = document.getElementById('tipo').value, m = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !d || !v) return alert("Preencha descrição e valor!");

    const ref = window.doc(window.db, "usuarios", user.uid, "meses", m);
    const snap = await window.getDoc(ref);
    let list = snap.exists() ? snap.data().transacoes : [];

    list.push({ descricao: d, valor: parseFloat(v), tipo: t, data: new Date().getTime() });
    await window.setDoc(ref, { transacoes: list });
    
    document.getElementById('modal').style.display = 'none';
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    window.carregarDados();
};

document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDados();
