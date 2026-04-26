/* script.js - FinançasPRO Premium Lógica */

let meuGrafico;

// 1. Alternador de Tema Profissional
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function setTheme(theme) {
    if (theme === 'light') {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
    // Atualiza o gráfico com as cores do novo tema
    if (window.carregarDadosDoFirebase) window.carregarDadosDoFirebase();
}

// Inicializa o tema com base na preferência salva ou padrão escura
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const isLight = body.classList.contains('light-theme');
    setTheme(isLight ? 'dark' : 'light');
});


// 2. Cálculo do Saldo Total Acumulado
async function calcularSaldoTotal() {
    const user = window.auth.currentUser;
    if (!user) return;
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

// 3. Carregar dados do mês selecionado
window.carregarDadosDoFirebase = async () => {
    const user = window.auth.currentUser;
    const mes = document.getElementById('filtroMes').value;
    if (!user) return;

    // Roda o acumulado em paralelo
    calcularSaldoTotal();

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    
    let entradas = 0, saidas = 0, transacoes = [];
    if (docSnap.exists()) transacoes = docSnap.data().transacoes || [];

    const listaUl = document.getElementById('lista');
    listaUl.innerHTML = "";

    // Lista vazia visual
    if (transacoes.length === 0) {
        listaUl.innerHTML = `<p style="text-align:center; padding: 30px; color: var(--current-text-sec); font-size: 14px;">Sem lançamentos em ${mes}.</p>`;
    } else {
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
    }

    document.getElementById('saldoMes').innerText = `R$ ${(entradas - saidas).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    desenharGrafico(entradas, saidas);
};

// 4. Desenhar Gráfico Profissional e Sensível ao Tema
function desenharGrafico(entradas, saidas) {
    const canvas = document.getElementById('meuGrafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (meuGrafico) meuGrafico.destroy();

    const temDados = entradas > 0 || saidas > 0;
    
    // Cores dinâmicas com base no tema
    const isLightTheme = body.classList.contains('light-theme');
    const colorEntrada = "#34C759"; // Verde Profissional
    const colorSaida = isLightTheme ? "#FF9500" : "#FF9F0A"; // Laranja Profissional
    const colorVazio = isLightTheme ? "#E5E5EA" : "#1C1C1E"; // Cinza Premium

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Receita', 'Despesa'],
            datasets: [{
                data: temDados ? [entradas, saidas] : [1, 0.0001],
                backgroundColor: temDados ? [colorEntrada, colorSaida] : [colorVazio, colorVazio],
                borderWidth: 0,
                hoverOffset: 0
            }]
        },
        options: {
            cutout: '82%',
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 5. Salvar Novo Registro (Simplificado e Rápido)
document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user || !desc || !valor) return alert("Preencha a descrição e o valor.");

    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

    transacoes.push({
        descricao: desc,
        valor: valor,
        categoria: categoria,
        tipo: tipo,
        data: new Date().getTime()
    });

    try {
        await window.setDoc(dadosRef, { transacoes });
        fecharModalLançamento();
        limparCamposModal();
        window.carregarDadosDoFirebase();
    } catch (e) {
        alert("Erro ao salvar no banco de dados.");
        console.error(e);
    }
};

// 6. Funções Excluir e Controles de UX
window.excluirTransacao = async (index) => {
    if (!confirm("Tem certeza que deseja apagar este lançamento?")) return;
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

// Controles do Modal "Bottom Sheet"
const modalOverlay = document.getElementById('modal');
const inputDesc = document.getElementById('desc');

function abrirModalLançamento() {
    modalOverlay.classList.add('active');
    // Foca automaticamente no campo de descrição para rapidez
    setTimeout(() => inputDesc.focus(), 300);
}

function fecharModalLançamento() {
    modalOverlay.classList.remove('active');
}

function limparCamposModal() {
    document.getElementById('desc').value = "";
    document.getElementById('valor').value = "";
    // Reseta categorias e tipos para o padrão
    document.getElementById('categoria').selectedIndex = 0;
    document.getElementById('tipo').selectedIndex = 0;
}

document.getElementById('abrirModal').onclick = abrirModalLançamento;
document.getElementById('btnFechar').onclick = fecharModalLançamento;
document.getElementById('filtroMes').onchange = () => window.carregarDadosDoFirebase();

// Fecha o modal ao clicar fora dele
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) fecharModalLançamento();
});

// Fecha o modal ao pressionar 'Esc'
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) fecharModalLançamento();
});


// 7. Inicialização Automática e Monitor de Login
const checkAuth = setInterval(() => {
    if (window.auth && window.auth.currentUser) {
        window.carregarDadosDoFirebase();
        clearInterval(checkAuth);
    }
}, 1000);
