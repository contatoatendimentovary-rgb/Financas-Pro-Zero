document.getElementById('btnSalvar').onclick = async () => {
    const descricao = document.getElementById('desc').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const mes = document.getElementById('filtroMes').value;
    const user = window.auth.currentUser;

    if (!user) return alert("Faça login primeiro!");
    if (!descricao || !valor) return alert("Preencha os campos!");

    // Aqui é onde o registro acontece de verdade
    const dadosRef = window.doc(window.db, "usuarios", user.uid, "meses", mes);
    const docSnap = await window.getDoc(dadosRef);
    let transacoes = docSnap.exists() ? docSnap.data().transacoes : [];

    transacoes.push({ descricao, valor, tipo, data: new Date().getTime() });

    await window.setDoc(dadosRef, { transacoes });
    
    document.getElementById('modal').style.display = 'none';
    location.reload(); // Atualiza para mostrar o novo gasto
};
