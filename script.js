let myChart;

// Inicializa a data de hoje no formulário
document.getElementById('dataLancamento').valueAsDate = new Date();

function abrirAba(event, nomeAba) {
    document.querySelectorAll('.aba-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(nomeAba).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
    if (nomeAba === 'extrato') carregarDados();
}

function salvarManual() {
    const desc = document.getElementById("desc").value;
    const valor = document.getElementById("valor").value;
    const data = document.getElementById("dataLancamento").value;
    const tipo = document.getElementById("tipo").value;
    const cat = document.getElementById("cat").value;

    if (!desc || !valor || !data) return alert("Preencha tudo!");

    const registro = {
        descricao: desc,
        valor: parseFloat(valor),
        data: data,
        tipo: tipo,
        categoria: cat,
        id: Date.now()
    };

    let historico = JSON.parse(localStorage.getItem("meus_gastos") || "[]");
    historico.push(registro);
    localStorage.setItem("meus_gastos", JSON.stringify(historico));

    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    alert("Salvo com sucesso!");
    abrirAba(null, 'extrato');
}

function carregarDados() {
    const dados = JSON.parse(localStorage.getItem("meus_gastos") || "[]");
    const filtro = document.getElementById("filtroMes").value;
    
    let rec = 0, des = 0, cats = { Essencial: 0, Lazer: 0, Investimento: 0 };
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    // Filtra dados pelo mês selecionado
    const dadosFiltrados = dados.filter(d => d.data.substring(0, 7) === filtro);

    dadosFiltrados.reverse().forEach(d => {
        const v = d.valor;
        if (d.tipo === "receita") { 
            rec += v; 
        } else { 
            des += v; 
            if(cats[d.categoria] !== undefined) cats[d.categoria] += v;
        }
        lista.innerHTML += `
            <div class="item">
                <div><strong>${d.descricao}</strong><br><small>${d.data.split('-').reverse().join('/')}</small></div>
                <span class="${d.tipo}">R$ ${v.toFixed(2)}</span>
            </div>`;
    });

    document.getElementById("receita").innerText = `R$ ${rec.toFixed(2)}`;
    document.getElementById("despesa").innerText = `R$ ${des.toFixed(2)}`;
    document.getElementById("saldo").innerText = `R$ ${(rec - des).toFixed(2)}`;
    atualizarGrafico(cats);
}

function atualizarGrafico(cats) {
    const canvas = document.getElementById('grafico');
    if (myChart) myChart.destroy();
    myChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ data: Object.values(cats), backgroundColor: ['#3b82f6', '#a855f7', '#22c55e'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
    });
}

function preencherMeses() {
    const seletor = document.getElementById("filtroMes");
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
        let d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        let valor = d.toISOString().substring(0, 7);
        let texto = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        seletor.innerHTML += `<option value="${valor}">${texto}</option>`;
    }
}

function exportarCSV() {
    const dados = JSON.parse(localStorage.getItem("meus_gastos") || "[]");
    let csv = "Data,Descricao,Valor,Tipo,Categoria\n";
    dados.forEach(d => {
        csv += `${d.data},${d.descricao},${d.valor},${d.tipo},${d.categoria}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'meus_gastos.csv');
    a.click();
}

function limparTudo() {
    if(confirm("Deseja apagar todos os dados permanentemente?")) {
        localStorage.clear();
        location.reload();
    }
}

window.onload = () => {
    preencherMeses();
    carregarDados();
};
