// script.js - Versão Final Consolidada
let meuGrafico;

// 1. Função para carregar e calcular tudo do Firebase
window.carregarDadosDoFirebase = async () => {
    const user = window.auth.currentUser;
    const mesSelecionado = document.getElementById('filtroMes').value;
    
    if (!user) return;

    // Referência correta da pasta do usuário e mês
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mesSelecionado);
    
    try {
        const docSnap = await window.getDoc(dadosRef);
        let entradas = 0;
        let saidas = 0;
        let transacoes = [];

        if (docSnap.exists()) {
            transacoes = docSnap.data().transacoes || [];
        }

        // Limpa a lista antes de preencher
        const listaUl = document.getElementById('lista');
        listaUl.innerHTML = "";

        // Processa cada lançamento
        transacoes.forEach(t => {
            const valorNum = parseFloat(t.valor);
            if (t.tipo === 'entrada') {
                entradas += valorNum;
            } else {
                saidas += valorNum;
            }

            // Adiciona na lista visual
            listaUl.innerHTML += `
                <li class="item-transacao">
                    <span>${t.descricao}</span>
                    <span class="valor-${t.tipo}">R$ ${valorNum.toFixed(2)}</span>
                </li>`;
        });

        // Atualiza Saldo e Gráfico
        const saldoTotal = entradas - saidas;
        document.getElementById('saldo').innerText = `R$ ${saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        
        desenharGrafico(entradas, saidas);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
};

// 2. Função do Gráfico (Ajustada para Mobile)
function desenharGrafico(entradas, saidas) {
    const canvas = document.getElementById('meuGrafico');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (meuGrafico) meuGrafico.destroy();

    const temDados = entradas > 0 || saidas > 0;

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: temDados ? [entradas, saidas] : [1, 0.00001], 
                backgroundColor: temDados ? ['#32D74B', '#FF453A'] : ['#333', '#333'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 3. Evento de Salvar Registro
document.getElementById('btnSalvar').onclick = async () => {
    const desc = document.getElementById('desc').value;
    const valorRaw = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user) return alert("Erro: Usuário não identificado. Faça login novamente.");
    if (!desc || !valorRaw) return alert("Preencha a descrição e o valor.");

    const valor = parseFloat(valorRaw);
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);

    try {
        const docSnap = await window.getDoc(dadosRef);
        let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

        transacoes.push({
            descricao: desc,
            valor: valor,
            tipo: tipo,
            data: new Date().getTime()
        });

        await window.setDoc(dadosRef, { transacoes });
        
        document.getElementById('modal').style.display = 'none';
        // Limpa campos
        document.getElementById('desc').value = "";
        document.getElementById('valor').value = "";
        
        // Recarrega os dados sem dar reload na página inteira
        window.carregarDadosDoFirebase();
        
    } catch (e) {
        alert("Erro ao salvar no banco de dados.");
        console.error(e);
    }
};

// 4. Controles de Interface
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDadosDoFirebase();

// 5. Inicialização Automática
// Aguarda o Firebase avisar que o usuário está logado
const checkAuth = setInterval(() => {
    if (window.auth && window.auth.currentUser) {
        window.carregarDadosDoFirebase();
        clearInterval(checkAuth);
    }
}, 1000);
