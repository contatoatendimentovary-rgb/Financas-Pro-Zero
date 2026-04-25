let myChart;

// Função para garantir que os dados carreguem ao trocar de aba
function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
    
    // SEMPRE recarrega os dados ao abrir Extrato ou Saúde
    if (nomeAba === 'extrato' || nomeAba === 'saude') {
        setTimeout(carregarDados, 100); 
    }
}

async function enviarGasto() {
    const input = document.getElementById("inputGasto");
    const status = document.getElementById("iaStatus");
    if (!input.value) return;

    status.innerText = "🤖 Analisando...";
    try {
        const resIA = await fetch("/api/server", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: input.value })
        });
        const dado = await resIA.json();
        
        let storage = JSON.parse(localStorage.getItem("transacoes") || "[]");
        storage.push({ ...dado, data: new Date() });
        localStorage.setItem("transacoes", JSON.stringify(storage));

        status.innerHTML = "✅ Salvo!";
        input.value = "";
        
        // Força a atualização e volta para o extrato após 1 segundo
        setTimeout(() => {
            abrirAba(null, 'extrato');
            document.querySelectorAll('.tab-btn')[0].classList.add('active');
        }, 1000);

    } catch (e) { 
        status.innerText = "❌ Erro na IA"; 
        console.error(e);
    }
}

function carregarDados() {
    const dados = JSON.parse(localStorage.getItem("transacoes") || "[]");
    let rec = 0, des = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };
    const lista = document.getElementById("lista");
    
    if(!lista) return; // Segurança caso o elemento não exista
    lista.innerHTML = "";

    dados.forEach(d => {
        if (d.tipo === "receita") {
            rec += Number(d.valor);
        } else {
            des += Number(d.valor);
            if(cats[d.categoria] !== undefined) {
                cats[d.categoria] += Number(d.valor);
            }
        }
        lista.innerHTML += `<div class="item"><span>${d.descricao}</span><span class="${d.tipo}">R$ ${Number(d.valor).toFixed(2)}</span></div>`;
    });

    document.getElementById("receita").innerText = `R$ ${rec.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${des.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(rec - des).toFixed(2)}`;

    atualizarGrafico(cats);
    if(typeof renderizarSaude === "function") renderizarSaude(rec, cats);
}

function atualizarGrafico(cats) {
    const canvas = document.getElementById('grafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ 
                data: Object.values(cats), 
                backgroundColor: ['#3b82f6', '#a855f7', '#22c55e'],
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } } 
        }
    });
}

// Inicialização
window.onload = () => {
    carregarDados();
};
