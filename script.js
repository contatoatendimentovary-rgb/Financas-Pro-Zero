// Ativação do Bloco de Dados Cyber
window.carregarDadosCyber = async () => {
    const user = window.auth.currentUser;
    // Pega o mês atual do seletor
    const mesFeed = document.getElementById('filtroMes').value;
    if (!user) return;

    const feedRef = window.doc(window.db, "usuarios", user.uid, "meses", mesFeed);
    
    try {
        const snap = await window.getDoc(feedRef);
        let rec = 0, fix = 0, laz = 0, inv = 0, trans = [];
        
        if (snap.exists()) trans = snap.data().transacoes || [];

        const feedList = document.getElementById('lista');
        feedList.innerHTML = ""; // Limpa feeds antigos

        trans.forEach(t => {
            const v = parseFloat(t.valor);
            if (t.tipo === 'entrada') rec += v;
            else if (t.tipo === 'fixo') fix += v;
            else if (t.tipo === 'lazer') laz += v;
            else if (t.tipo === 'investimento') inv += v;

            // Determina a cor do feed-right baseado no tipo
            let feedColor = var(--border);
            if (t.tipo === 'entrada') feedColor = var(--green-neon);
            if (t.tipo === 'fixo') feedColor = var(--green-neon);
            if (t.tipo === 'lazer') feedColor = var(--orange-neon);
            if (t.tipo === 'investimento') feedColor = var(--blue-neon);

            feedList.innerHTML += `
                <li class="cyber-item" style="border-right-color: ${feedColor}">
                    <div class="feed-data">
                        <b>> ${t.descricao}</b><br>
                        <small>// type::${t.tipo}</small>
                    </div>
                    <span class="${t.tipo === 'entrada' ? 'neon-text_green' : 'neon-text_orange'}" style="font-weight: 700;">
                        ${t.tipo === 'entrada' ? '+' : '-'} R$ ${v.toFixed(2)}
                    </span>
                </li>`;
        });

        // Cálculos do Protocolo 50-30-20
        const projFixo = rec * 0.5;
        const projLazer = rec * 0.3;
        const projInv = rec * 0.2;

        const totalGasto = fix + laz + inv;
        document.getElementById('saldo').innerText = `$$ ${(rec - totalGasto).toFixed(2)}`;

        // Atualiza Barras de Energia
        atualizaPainel('fixo', fix, projFixo);
        atualizaPainel('lazer', laz, projLazer);
        atualizaPainel('invest', inv, projInv);

    } catch (e) {
        console.error("FEED_READ_ERROR ::", e);
    }
};

// Controla as barras de progresso estilo energia
function atualizaPainel(podId, atual, proj) {
    // Evita divisão por zero e formata o texto
    const projLabel = proj > 0 ? proj.toFixed(0) : "0";
    document.getElementById(`txt-${podId}`).innerText = `${atual.toFixed(0)} / ${projLabel}`;

    const perc = proj > 0 ? (atual / proj) * 100 : 0;
    const barFill = document.getElementById(`bar-${podId}`);
    
    // Limita o preenchimento em 100% visivelmente
    barFill.style.width = Math.min(perc, 100) + '%';

    // Alerta de sobrecarga (orçamento estourado)
    if (perc > 100) {
        barFill.style.background = 'var(--red-alert)';
        barFill.style.boxShadow = '0 0 15px var(--red-alert)';
    } else {
        // Reseta cores originais
        if (podId === 'fixo') { barFill.style.background = 'var(--green-neon)'; barFill.style.boxShadow = '0 0 15px var(--green-neon)'; }
        if (podId === 'lazer') { barFill.style.background = 'var(--orange-neon)'; barFill.style.boxShadow = '0 0 15px var(--orange-neon)'; }
        if (podId === 'invest') { barFill.style.background = 'var(--blue-neon)'; barFill.style.boxShadow = '0 0 15px var(--blue-neon)'; }
    }
}

// === EXECUÇÃO DE LANÇAMENTO (CORRIGIDO) ===
document.getElementById('btnSalvar').onclick = async () => {
    // 1. Captura os dados de entrada
    const descField = document.getElementById('desc').value;
    const valorField = document.getElementById('valor').value;
    const tipoField = document.getElementById('tipo').value;
    const mesField = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    // 2. Validação rigorosa para evitar erro de dados incompletos
    if (!user) return alert("ERROR :: Faça login primeiro!");
    
    // Verifica se os campos visiveis estão preenchidos
    if (!descField || !valorField || !mesField) {
        // Isso resolve seu erro "Dados incompletos!"
        return alert("EXEC_ERROR :: Preencha descrição e valor antes de confirmar.");
    }

    // 3. Converte valor para número para o Firebase aceitar
    const valorNum = parseFloat(valorField);
    if (isNaN(valorNum) || valorNum <= 0) {
        return alert("EXEC_ERROR :: Valor numérico inválido.");
    }

    // Referência do banco
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mesField);

    try {
        const docSnap = await window.getDoc(dadosRef);
        let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

        // Adiciona o novo registro na lista existente
        transacoes.push({
            descricao: descField,
            valor: valorNum, // Número real, não texto
            tipo: tipoField, // fixo, lazer, investimento, entrada
            timestamp: new Date().getTime()
        });

        // Salva de volta no banco
        await window.setDoc(dadosRef, { transacoes });
        
        // Fecha o modal e limpa campos
        document.getElementById('modal').style.display = 'none';
        document.getElementById('desc').value = "";
        document.getElementById('valor').value = "";
        
        // Recarrega o feed sem dar reload na página
        window.carregarDadosCyber();
        
    } catch (e) {
        console.error("DATA_EXEC_ERROR ::", e);
        alert("CRITICAL_ERROR :: Falha ao salvar no banco.");
    }
};

// Controles de Interface Futurista
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
document.getElementById('filtroMes').onchange = () => window.carregarDadosCyber();

// Vincula a função de carga ao Firebase (Mantenha isso no index.html módulo de script)
// window.carregarDados = window.carregarDadosCyber; 
