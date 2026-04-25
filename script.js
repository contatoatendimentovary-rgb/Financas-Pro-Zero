let myChart;

// Função para navegar entre as abas
function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    
    // Recarrega os dados visualmente ao abrir as abas de resumo
    if (nomeAba === 'extrato' || nomeAba === 'saude') {
        carregarDados();
    }
}

// Função que envia a frase para a IA no Gemini
async function enviarGasto() {
    const input = document.getElementById("inputGasto");
    const status = document.getElementById("iaStatus");
    
    if (!input || !input.value) return;

    status.innerText = "🤖 Analisando com IA...";
    
    try {
        const resIA = await fetch("/api/server", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: input.value })
        });
        
        const dadoIA = await resIA.json();
        
        // Se a IA retornar erro, avisa na tela
        if (dadoIA.erro) throw new Error(dadoIA.erro);

        // Salva no banco de dados local do navegador
        let historico = JSON.parse(localStorage.getItem("transacoes") || "[]");
        historico.push({
            valor: parseFloat(dadoIA.valor) || 0,
            descricao: dadoIA.descricao || "Gasto sem nome",
            tipo: dadoIA.tipo || "despesa",
            categoria: dadoIA.categoria || "Lazer",
            data: new Date().toISOString()
        });
        
        localStorage.setItem("transacoes", JSON.stringify(historico));

        status.innerText = "✅ Salvo com sucesso!";
        input.value = "";
        
        // Após 1.5 segundos, volta para o extrato para ver o gráfico atualizado
        setTimeout(() => {
            status.innerText = "";
            abrirAba(null, 'extrato');
            // Ativa o primeiro botão da navegação visualmente
            const btnExtrato = document.querySelector('.tab-btn');
            if(btnExtrato) btnExtrato.classList.add('active');
        }, 1500);

    } catch (e) {
        console.error("Erro no app:", e);
        status.innerText = "❌ Erro na IA. Verifique sua chave API.";
    }
}

// Função que lê os dados salvos e monta o gráfico e a lista
function carregarDados() {
    const dadosRaw = localStorage.getItem("transacoes");
    const transacoes = JSON.parse(dadosRaw || "[]");
    
    let totalReceitas = 0;
    let totalDespesas = 0;
    let categoriasSoma = { Essencial: 0, Lazer: 0, Investimento: 0 };
    
    const listaHTML = document.getElementById("lista");
    if(!listaHTML) return;
    listaHTML.innerHTML = "";

    transacoes.forEach(t => {
        const v = parseFloat(t.valor) || 0;
        
        if (t.tipo === "receita") {
            totalReceitas += v;
        } else {
            totalDespesas += v;
            // Soma na categoria correta (se a categoria não existir, joga no Lazer)
            if (categoriasSoma.hasOwnProperty(t.categoria)) {
                categoriasSoma[t.categoria] += v;
            } else {
                categoriasSoma["Lazer"] += v;
            }
        }

        // Adiciona o item na lista visual
        listaHTML.innerHTML += `
            <div class="item">
                <span>${t.descricao}</span>
                <span class="${t.tipo}">R$ ${v.toFixed(2)}</span>
            </div>`;
    });

    // Atualiza os valores nos cards do topo
    document.getElementById("receita").innerText = `R$ ${totalReceitas.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${totalDespesas.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(totalReceitas - totalDespesas).toFixed(2)}`;

    desenharGrafico(categoriasSoma);
}

// Função técnica para criar o gráfico de rosca (Chart.js)
function desenharGrafico(dadosCategorias) {
    const canvas = document.getElementById('grafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Se já existir um gráfico, apaga para criar um novo por cima
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investimento'],
            datasets: [{
                data: [dadosCategorias.Essencial, dadosCategorias.Lazer, dadosCategorias.Investimento],
                backgroundColor: ['#3b82f6', '#a855f7', '#22c55e'],
                hoverOffset: 4,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'white', font: { size: 12 } }
                }
            }
        }
    });
}

// Quando a página abre, carrega os dados automaticamente
window.onload = carregarDados;
