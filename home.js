document.getElementById("searchBtn").addEventListener("click", function(){
    const termo = document.getElementById("searchInput").value.trim();
    if(!termo){
        alert("Digite algum serviço ou cidade para buscar!");
        return;
    }
    alert(`Resultados filtrados para: "${termo}" (simulado)`);
});

const buttons = document.querySelectorAll(".btn-service");
buttons.forEach(btn => {
    btn.addEventListener("click", function(){
        alert("Serviço solicitado com sucesso! (simulado)");
    });
});

//---------------------

// Bloqueia acesso se não estiver logado
const usuario = localStorage.getItem("usuarioLogado") || sessionStorage.getItem("usuarioLogado");
if(!usuario){
    alert("Você precisa estar logado para acessar a home!");
    window.location.href = "index.html";
} else {
    console.log("Usuário logado:", usuario);
}

// Logout - já no menu
const logoutBtn = document.querySelector(".menu a[href='index.html']");
logoutBtn.addEventListener("click", function(){
    localStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("usuarioLogado");
});
 
// BUSCA SIMULADA
document.getElementById("searchBtn").addEventListener("click", function(){
    const termo = document.getElementById("searchInput").value.trim();
    if(!termo){
        alert("Digite algum serviço ou cidade para buscar!");
        return;
    }
    alert(`Resultados filtrados para: "${termo}" (simulado)`);
});

// BOTÃO SOLICITAR SERVIÇO
const buttons = document.querySelectorAll(".btn-service");
buttons.forEach(btn => {
    btn.addEventListener("click", function(){
        alert("Serviço solicitado com sucesso! (simulado)");
    });
});
