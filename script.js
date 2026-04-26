let meuGrafico;

window.carregarDadosDoFirebase = async () => {
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    if (!user) return;

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);

    let entradas = 0, saidas = 0, transacoes = [];
    if (docSnap.exists()) transacoes = docSnap.data().transacoes || [];

    const listaUl = document.getElementById('lista');
    listaUl.innerHTML = "";

    transacoes.forEach(t => {
        const v = parseFloat(t.valor);
        t.tipo === 'entrada' ? entradas += v : saidas += v;
        listaUl.innerHTML += `
            <li class="item-transacao">
                <span>${t.descricao}</span>
                <span class="valor-${t.tipo}">R$ ${v.toFixed(2)}</span>
            </li>`;
    });

    document.getElementById('saldo').innerText = `R$ ${(entradas - saidas).toFixed(2)}`;
    desenharGrafico(entradas, saidas);
};

function desenharGrafico(e, s) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    const temD = e > 0 || s > 0;
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: temD ? [e, s] : [1, 0],
                backgroundColor: temD ? ['#32D74B', '#FF453A'] : ['#333', '#333'],
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value, val = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value, mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !val) return alert("Preencha tudo!");

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    let lista = docSnap.exists() ? docSnap.data().transacoes : [];

    lista.push({ descricao: desc, valor: parseFloat(val), tipo, data: new Date().getTime() });
    await window.setDoc(dadosRef, { transacoes: lista });
    
    document.getElementById('modal').style.display = 'none';
    window.carregarDadosDoFirebase();
};

document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDadosDoFirebase();
