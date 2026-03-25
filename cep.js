// Integração com ViaCEP
document.addEventListener("DOMContentLoaded", function() {
    const cepInput = document.getElementById("cep");
    if (cepInput) {
        cepInput.addEventListener("blur", function() {
            let cep = this.value.replace(/\D/g, '');
            if(cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(res => res.json())
                    .then(data => {
                        if(!data.erro) {
                            document.getElementById("rua").value = data.logradouro;
                            document.getElementById("bairro").value = data.bairro;
                            document.getElementById("cidade").value = data.localidade;
                            document.getElementById("estado").value = data.uf;
                        } else {
                            alert("CEP não encontrado!");
                        }
                    })
                    .catch(() => alert("Erro ao buscar o CEP."));
            } else if (cep.length > 0) {
                alert("CEP inválido!");
            }
        });
    }
});