let meuGrafico;

// 1. Carregar dados do Firebase
window.carregarDadosDoFirebase = async () => {
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    
    if (!user) return;

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    
    try {
        const docSnap = await window.getDoc(dadosRef);
        let entradas = 0;
        let saidas = 0;
        let transacoes = [];

        if (docSnap.exists()) {
            transacoes = docSnap.data().transacoes || [];
        }

        const listaUl = document.getElementById('lista');
        listaUl.innerHTML = "";

        transacoes.forEach((t, index) => {
            const valorNum = parseFloat(t.valor);
            if (t.tipo === 'entrada') entradas += valorNum;
            else saidas += valorNum;

            listaUl.innerHTML += `
                <li class="item-transacao">
                    <div class="item-info">
                        <span class="desc">${t.descricao}</span>
                        <span class="valor-${t.tipo}">R$ ${valorNum.toFixed(2)}</span>
                    </div>
                    <button class="btn-excluir" onclick="excluirTransacao(${index})">🗑️</button>
                </li>`;
        });

        document.getElementById('saldo').innerText = `R$ ${(entradas - saidas).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        desenharGrafico(entradas, saidas);

    } catch (e) {
        console.error("Erro ao carregar:", e);
    }
};

// 2. Função de Excluir
window.excluirTransacao = async (index) => {
    if (!confirm("Deseja apagar este registro?")) return;

    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);

    try {
        const docSnap = await window.getDoc(dadosRef);
        if (docSnap.exists()) {
            let transacoes = docSnap.data().transacoes;
            transacoes.splice(index, 1); // Remove pelo índice
            await window.setDoc(dadosRef, { transacoes });
            window.carregarDadosDoFirebase(); // Atualiza a tela
        }
    } catch (e) {
        alert("Erro ao excluir.");
    }
};

// 3. Gráfico
function desenharGrafico(entradas, saidas) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();

    const temDados = entradas > 0 || saidas > 0;

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: temDados ? [entradas, saidas] : [1, 0],
                backgroundColor: temDados ? ['#32D74B', '#FF453A'] : ['#333', '#333'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// 4. Salvar Novo Registro
document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value;
    const valorRaw = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !valorRaw) return alert("Preencha tudo!");

    const valor = parseFloat(valorRaw);
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);

    try {
        const docSnap = await window.getDoc(dadosRef);
        let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];
        transacoes.push({ descricao: desc, valor, tipo, data: new Date().getTime() });

        await window.setDoc(dadosRef, { transacoes });
        document.getElementById('modal').style.display = 'none';
        document.getElementById('desc').value = "";
        document.getElementById('valor').value = "";
        window.carregarDadosDoFirebase();
    } catch (e) {
        alert("Erro ao salvar.");
    }
};

// 5. Interface
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDadosDoFirebase();

// 6. Monitor de Login
const checkAuth = setInterval(() => {
    if (window.auth && window.auth.currentUser) {
        window.carregarDadosDoFirebase();
        clearInterval(checkAuth);
    }
}, 1000);
