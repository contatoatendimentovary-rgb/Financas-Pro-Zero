// Adicione isso ao seu script.js atualizado
document.getElementById('btnSalvar').onclick = async () => {
    const descricao = document.getElementById('desc').value;
    const valorInput = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user) return alert("Por favor, faça login com o Google!");
    if (!descricao || !valorInput) return alert("Preencha todos os campos!");

    const valor = parseFloat(valorInput);
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    
    try {
        const docSnap = await window.getDoc(dadosRef);
        let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

        // Adiciona a nova transação
        transacoes.push({
            descricao,
            valor,
            tipo,
            data: new Date().getTime()
        });

        // Salva no Firebase
        await window.setDoc(dadosRef, { transacoes });
        
        // Sucesso: Fecha o modal e recarrega a tela para atualizar saldo/gráfico
        document.getElementById('modal').style.display = 'none';
        alert("Registrado com sucesso!");
        location.reload(); 
        
    } catch (e) {
        console.error("Erro ao salvar: ", e);
        alert("Erro ao salvar no banco de dados.");
    }
};

// Abre/Fecha Modal
document.getElementById('abrirModal').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('btnFechar').onclick = () => document.getElementById('modal').style.display = 'none';
