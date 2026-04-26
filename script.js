let meuGrafico;

// 1. Calcula o Saldo de TODOS os meses para o acumulado
async function calcularSaldoTotal() {
    const user = window.auth.currentUser;
    const colRef = window.collection(window.db, "usuarios", user.uid, "meses");
    const querySnapshot = await window.getDocs(colRef);
    let acumulado = 0;

    querySnapshot.forEach((doc) => {
        const transacoes = doc.data().transacoes || [];
        transacoes.forEach(t => {
            if (t.tipo === 'entrada') acumulado += parseFloat(t.valor);
            else acumulado -= parseFloat(t.valor);
        });
    });

    document.getElementById('saldoTotal').innerText = `R$ ${acumulado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// 2. Carrega os dados do mês atual
window.carregarDadosDoFirebase = async () => {
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    if (!user) return;

    // Roda o cálculo do acumulado em paralelo
    calcularSaldoTotal();

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    
    let entradas = 0, saidas = 0, transacoes = [];
    if (docSnap.exists()) transacoes = docSnap.data().transacoes || [];

    const listaUl = document.getElementById('lista');
    listaUl.innerHTML = "";

    transacoes.forEach((t, index) => {
        const valor = parseFloat(t.valor);
        t.tipo === 'entrada' ? entradas += valor : saidas += valor;

        listaUl.innerHTML += `
            <li class="item-transacao">
                <div class="item-info">
                    <span class="cat">${t.categoria || '🛠️ Geral'}</span>
                    <span class="desc">${t.descricao}</span>
                </div>
                <div class="valores">
                    <span class="valor-${t.tipo}">R$ ${valor.toFixed(2)}</span>
                    <button class="btn-excluir" onclick="excluirTransacao(${index})">✕</button>
                </div>
            </li>`;
    });

    document.getElementById('saldo').innerText = `R$ ${(entradas - saidas).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    desenharGrafico(entradas, saidas);
};

// 3. Gráfico de Rosca
function desenharGrafico(entradas, saidas) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    const temDados = entradas > 0 || saidas > 0;

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: temDados ? [entradas, saidas] : [1, 0.01],
                backgroundColor: temDados ? ['#32D74B', '#FF453A'] : ['#222', '#222'],
                borderWidth: 0
            }]
        },
        options: { cutout: '80%', maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// 4. Salvar com Categoria
document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !valor) return alert("Preencha os campos!");

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

    transacoes.push({ descricao: desc, valor, categoria, tipo, data: new Date().getTime() });

    await window.setDoc(dadosRef, { transacoes });
    document.getElementById('modal').style.display = 'none';
    window.carregarDadosDoFirebase();
};

// 5. Excluir e Controles
window.excluirTransacao = async (index) => {
    if (!confirm("Excluir item?")) return;
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    if (docSnap.exists()) {
        let transacoes = docSnap.data().transacoes;
        transacoes.splice(index, 1);
        await window.setDoc(dadosRef, { transacoes });
        window.carregarDadosDoFirebase();
    }
};

document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDadosDoFirebase();

const checkAuth = setInterval(() => {
    if (window.auth && window.auth.currentUser) {
        window.carregarDadosDoFirebase();
        clearInterval(checkAuth);
    }
}, 1000);
