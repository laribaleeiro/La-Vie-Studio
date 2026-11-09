/* =========================================================
   LA VIE STUDIO — Página de cadastro
   ========================================================= */

const Cadastro = {
  init: function () {
    // Quem já está logada não precisa se cadastrar novamente
    if (Auth.usuarioAtual()) {
      window.location.href = 'minha-conta.html';
      return;
    }

    this.form = document.getElementById('form-cadastro');
    this.alerta = document.getElementById('alerta');
    this.destino = Util.destinoSeguro(Util.param('redirect'), '');

    // Mantém o destino (ex.: agendamento) ao alternar para o login
    if (this.destino) {
      document.getElementById('link-login').href = 'login.html?redirect=' + encodeURIComponent(this.destino);
    }

    Form.configurarVerSenha();
    Form.configurarMascaraTelefone(this.form.telefone);
    Form.limparAoDigitar(this.form);
    this.configurarForcaSenha();

    this.form.addEventListener('submit', this.enviar.bind(this));
  },

  configurarForcaSenha: function () {
    const barra = document.getElementById('forca-senha');
    this.form.senha.addEventListener('input', function (e) {
      const s = e.target.value;
      let nivel = 0;
      if (s.length >= 6) nivel = 1;
      if (s.length >= 8 && /\d/.test(s) && /[a-zA-Z]/.test(s)) nivel = 2;
      if (s.length >= 10 && /\d/.test(s) && /[a-z]/.test(s) && /[A-Z]/.test(s)) nivel = 3;
      barra.dataset.nivel = nivel;
    });
  },

  validar: function () {
    const f = this.form;
    let valido = true;

    const nome = f.nome.value.trim();
    if (nome.split(/\s+/).length < 2 || nome.length < 5) {
      Form.erro(f.nome, 'Informe seu nome completo (nome e sobrenome).');
      valido = false;
    }

    if (!Util.emailValido(f.email.value.trim())) {
      Form.erro(f.email, 'Informe um e-mail válido.');
      valido = false;
    }

    if (!Util.telefoneValido(f.telefone.value)) {
      Form.erro(f.telefone, 'Informe um telefone com DDD.');
      valido = false;
    }

    if (f.senha.value.length < 6) {
      Form.erro(f.senha, 'A senha deve ter pelo menos 6 caracteres.');
      valido = false;
    }

    if (!f.confirmar.value) {
      Form.erro(f.confirmar, 'Confirme a sua senha.');
      valido = false;
    } else if (f.confirmar.value !== f.senha.value) {
      Form.erro(f.confirmar, 'As senhas não coincidem.');
      valido = false;
    }

    return valido;
  },

  enviar: function (e) {
    e.preventDefault();
    Form.limpar(this.form);
    this.alerta.hidden = true;

    if (!this.validar()) {
      const primeiro = Util.$('.campo.erro input', this.form);
      if (primeiro) primeiro.focus();
      return;
    }

    const resultado = Auth.cadastrar({
      nome: this.form.nome.value,
      email: this.form.email.value,
      telefone: this.form.telefone.value,
      senha: this.form.senha.value
    });

    if (!resultado.ok) {
      Form.alerta(this.alerta, 'erro', resultado.erro);
      Form.erro(this.form.email, 'E-mail já cadastrado.');
      return;
    }

    // Leva a cliente ao login, com o e-mail já preenchido
    Util.flash.definir({
      tipo: 'sucesso',
      mensagem: 'Cadastro realizado com sucesso, ' + Util.primeiroNome(resultado.usuario.nome) + '! Agora é só entrar com seu e-mail e senha.',
      email: resultado.usuario.email
    });

    window.location.href = 'login.html' + (this.destino ? '?redirect=' + encodeURIComponent(this.destino) : '');
  }
};

document.addEventListener('DOMContentLoaded', function () { Cadastro.init(); });
