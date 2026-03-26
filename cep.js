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
                            mostrarToast("CEP não encontrado!", "error");
                        }
                    })
                    .catch(() => mostrarToast("Erro ao buscar o CEP.", "error"));
            } else if (cep.length > 0) {
                mostrarToast("CEP inválido!", "error");
            }
        });
    }
});