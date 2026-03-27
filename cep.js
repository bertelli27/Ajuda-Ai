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
                            const rua = document.getElementById("rua");
                            const bairro = document.getElementById("bairro");
                            const cidade = document.getElementById("cidade");
                            const estado = document.getElementById("estado");
                            
                            rua.value = data.logradouro;
                            bairro.value = data.bairro;
                            cidade.value = data.localidade;
                            estado.value = data.uf;
                            
                            if (typeof clearInputError === 'function') {
                                clearInputError(rua);
                                clearInputError(bairro);
                                clearInputError(cidade);
                                clearInputError(estado);
                            }
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