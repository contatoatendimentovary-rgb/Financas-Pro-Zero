let myChart;
const DB_COLLECTION = "usuarios";

async function salvarNoFirebase() {
    const user = window.auth.currentUser;
    if (!user) return alert("Faça login com o Google primeiro!");

    const desc = document.getElementById("desc").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const cat = document.getElementById("cat").value;

    if (!desc || !valor || !data) return alert("Preencha todos os campos!");

    const novoItem = {
        id: Date.now(),
        desc,
        valor,
        data,
        categoria: cat,
        tipo: cat === "Receita" ? "receita" : "despesa"
    };

    const docRef = window.doc(window.db, DB_COLLECTION, user.uid);
    const docSnap = await window.getDoc(docRef);
    let dadosAtuais = docSnap.exists() ? docSnap.data().lancamentos : [];
    
    dadosAtuais.push(novoItem);
    await window.setDoc(docRef, { lancamentos: dadosAtuais });

    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";
    carregarDadosDoFirebase();
}

async function carregarDadosDoFirebase() {
    const user = window.auth.currentUser;
    if (!user) return;

    const docSnap = await window.getDoc(window.doc(window.db, DB_COLLECTION, user.uid));
    const banco = docSnap.exists() ? docSnap.data().lancamentos : [];
    const filtro = document.getElementById("filtroMes").value;
    const lista = document.getElementById("lista");
    
    lista.innerHTML = "";
    let r = 0, d = 0, c = { Essencial: 0, Lazer: 0, Investimento: 0 };

    banco.filter(t => t.data.startsWith(filtro)).reverse().forEach(t => {
        if (t.tipo === 'receita') r += t.valor;
        else { 
            d += t.valor; 
            if(c.hasOwnProperty(t.categoria)) c[t.categoria] += t.valor;
        }

        lista.innerHTML += `
            <div class="list-item">
                <div><strong>${t.desc}</strong><br><small>${t.data}</small></div>
                <span class="${t.tipo === 'receita' ? 'text-green' : 'text-red'}">
                    R$ ${t.valor.toFixed(2)}
                </span>
            </div>`;
    });

    document.getElementById("saldo").innerText = `R$ ${(r - d).toLocaleString('pt-BR')}`;
    atualizarGrafico(c);
}

function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Essencial', 'Lazer', 'Investir'],
            datasets: [{
                data: [dados.Essencial, dados.Lazer, dados.Investimento],
                backgroundColor: ['#0A84FF', '#BF5AF2', '#32D74B'],
                borderWidth: 0
            }]
        },
        options: { maintainAspectRatio: false, cutout: '85%' }
    });
}

// Inicializa o seletor de meses
(function init() {
    const s = document.getElementById("filtroMes");
    const agora = new Date();
    for(let i = 0; i < 12; i++) {
        let m = new Date(agora.getFullYear(), i, 1);
        let opt = document.createElement("option");
        opt.value = m.toISOString().substring(0, 7);
        opt.innerText = m.toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
        if(i === agora.getMonth()) opt.selected = true;
        s.appendChild(opt);
    }
})();
