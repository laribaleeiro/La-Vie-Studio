/* =========================================================
   LA VIE STUDIO — Recuperação de senha
   Etapa 1: confere e-mail + telefone cadastrados
   Etapa 2: define uma nova senha
   (Com um servidor, o ideal é enviar um link por e-mail.)
   ========================================================= */

const Recuperar = {
  emailVerificado: null,

  init: function () {
    this.formVerificar = document.getElementById('form-verificar');
    this.formSenha = document.getElementById('form-nova-senha');
    this.alerta = document.getElementById('alerta');

    Form.configurarVerSenha();
    Form.configurarMascaraTelefone(this.formVerificar.telefone);
    Form.limparAoDigitar(this.formVerificar);
    Form.limparAoDigitar(this.formSenha);

    this.formVerificar.addEventListener('submit', this.verificar.bind(this));
    this.formSenha.addEventListener('submit', this.salvar.bind(this));
  },

  verificar: function (e) {
    e.preventDefault();
    const f = this.formVerificar;
    Form.limpar(f);
    this.alerta.hidden = true;

    let valido = true;
    if (!Util.emailValido(f.email.value.trim())) { Form.erro(f.email, 'Informe um e-mail válido.'); valido = false; }
    if (!Util.telefoneValido(f.telefone.value)) { Form.erro(f.telefone, 'Informe o telefone com DDD.'); valido = false; }
    if (!valido) return;

    if (!Auth.verificarIdentidade(f.email.value, f.telefone.value)) {
      Form.alerta(this.alerta, 'erro', 'Não encontramos uma conta com esse e-mail e telefone. Confira os dados ou cadastre-se.');
      return;
    }

    this.emailVerificado = f.email.value.trim();
    f.hidden = true;
    this.formSenha.hidden = false;
    document.getElementById('subtitulo').textContent = 'Dados confirmados! Agora crie sua nova senha.';
    Form.alerta(this.alerta, 'sucesso', 'Conta encontrada. Escolha uma nova senha abaixo.');
    this.formSenha.senha.focus();
  },

  salvar: function (e) {
    e.preventDefault();
    const f = this.formSenha;
    Form.limpar(f);

    let valido = true;
    if (f.senha.value.length < 6) { Form.erro(f.senha, 'A senha deve ter pelo menos 6 caracteres.'); valido = false; }
    if (f.confirmar.value !== f.senha.value) { Form.erro(f.confirmar, 'As senhas não coincidem.'); valido = false; }
    if (!valido) return;

    const resultado = Auth.redefinirSenha(this.emailVerificado, f.senha.value);
    if (!resultado.ok) {
      Form.alerta(this.alerta, 'erro', resultado.erro);
      return;
    }

    Util.flash.definir({
      tipo: 'sucesso',
      mensagem: 'Senha alterada com sucesso! Entre com a sua nova senha.',
      email: this.emailVerificado
    });
    window.location.href = 'login.html';
  }
};

document.addEventListener('DOMContentLoaded', function () { Recuperar.init(); });
