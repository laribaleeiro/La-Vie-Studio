/* =========================================================
   LA VIE STUDIO — Página de login
   ========================================================= */

const Login = {
  CHAVE_LEMBRAR: 'lavie_lembrar_email',

  init: function () {
    // Para onde ir depois do login (padrão: agendamento)
    this.destino = Util.destinoSeguro(Util.param('redirect'), 'agendamento.html');

    const logada = Auth.usuarioAtual();
    if (logada) {
      window.location.href = (Util.param('redirect') && !Auth.ehFuncionario(logada)) ? this.destino : Auth.paginaInicial(logada);
      return;
    }

    this.form = document.getElementById('form-login');
    this.alerta = document.getElementById('alerta');

    // Mantém o destino ao alternar para o cadastro
    if (Util.param('redirect')) {
      document.getElementById('link-cadastro').href = 'cadastro.html?redirect=' + encodeURIComponent(this.destino);
      Form.alerta(this.alerta, 'info', 'Para continuar com o agendamento, entre na sua conta ou cadastre-se.');
    }

    // E-mail lembrado de acessos anteriores
    const lembrado = localStorage.getItem(this.CHAVE_LEMBRAR);
    if (lembrado) this.form.email.value = lembrado;

    // Mensagem vinda do cadastro ou da recuperação de senha
    const flash = Util.flash.ler();
    if (flash) {
      Form.alerta(this.alerta, flash.tipo, flash.mensagem);
      if (flash.email) this.form.email.value = flash.email;
      this.form.senha.focus();
    }

    Form.configurarVerSenha();
    Form.limparAoDigitar(this.form);
    this.configurarDemo();
    this.form.addEventListener('submit', this.enviar.bind(this));
  },

  // Acesso demonstrativo: preenche os dados e entra direto
  configurarDemo: function () {
    const form = this.form;
    Util.$$('[data-demo-email]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        form.email.value = botao.dataset.demoEmail;
        form.senha.value = botao.dataset.demoSenha;
        Form.limpar(form);
        form.requestSubmit();
      });
    });
  },


  enviar: function (e) {
    e.preventDefault();
    Form.limpar(this.form);

    const email = this.form.email.value.trim();
    const senha = this.form.senha.value;
    let valido = true;

    if (!Util.emailValido(email)) {
      Form.erro(this.form.email, 'Informe um e-mail válido.');
      valido = false;
    }
    if (!senha) {
      Form.erro(this.form.senha, 'Informe sua senha.');
      valido = false;
    }
    if (!valido) return;

    const resultado = Auth.entrar(email, senha);
    if (!resultado.ok) {
      Form.alerta(this.alerta, 'erro', resultado.erro);
      this.form.senha.value = '';
      this.form.senha.focus();
      return;
    }

    if (document.getElementById('lembrar').checked) {
      localStorage.setItem(this.CHAVE_LEMBRAR, resultado.usuario.email);
    } else {
      localStorage.removeItem(this.CHAVE_LEMBRAR);
    }

    Util.flash.definir({ tipo: 'sucesso', mensagem: 'Olá, ' + Util.primeiroNome(resultado.usuario.nome) + '! Que bom ter você aqui.' });
    // Equipe vai direto para o painel; clientes seguem para o destino
    window.location.href = Auth.ehFuncionario(resultado.usuario) ? 'painel.html' : this.destino;
  }
};

document.addEventListener('DOMContentLoaded', function () { Login.init(); });
