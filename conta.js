/* =========================================================
   LA VIE STUDIO — Área "Minha conta"
   Dados da cliente e lista dos seus agendamentos.
   ========================================================= */

const Conta = {
  usuario: null,
  abaAtual: 'proximos',

  init: function () {
    this.usuario = Auth.exigirLogin('minha-conta.html');
    if (!this.usuario) return;
    if (Auth.ehFuncionario(this.usuario)) {
      window.location.href = 'painel.html';
      return;
    }

    const flash = Util.flash.ler();
    if (flash) Layout.toast(flash.mensagem, flash.tipo);

    this.renderizarPerfil();
    this.renderizarAgendamentos();
    this.configurarEventos();
  },

  renderizarPerfil: function () {
    const u = this.usuario;
    const primeiro = Util.primeiroNome(u.nome);

    document.getElementById('saudacao').innerHTML = 'Olá, <em>' + Util.escapar(primeiro) + '</em>';
    document.getElementById('avatar').textContent = primeiro.charAt(0).toUpperCase();
    document.getElementById('perfil-nome').textContent = u.nome;

    const desde = new Date(u.criadoEm);
    document.getElementById('perfil-dados').innerHTML =
      '<li>' + ICONES.usuario + '<span>' + Util.escapar(u.email) + '</span></li>' +
      '<li>' + ICONES.telefone + '<span>' + Util.escapar(u.telefone) + '</span></li>' +
      '<li>' + ICONES.coracao + '<span>Cliente desde ' + Util.MESES[desde.getMonth()] + ' de ' + desde.getFullYear() + '</span></li>';
  },

  // Separa os agendamentos em "próximos" e "histórico"
  separar: function () {
    const agora = new Date();
    const todos = Agenda.doUsuario(this.usuario.id);
    const proximos = [];
    const historico = [];

    todos.forEach(function (a) {
      const passou = Agenda.inicio(a) < agora;
      if (a.status === 'confirmado' && !passou) proximos.push(a);
      else historico.push(a);
    });

    historico.reverse(); // mais recentes primeiro
    return { proximos: proximos, historico: historico };
  },

  item: function (a, podeCancelar) {
    const data = Util.isoParaData(a.data);
    const passou = Agenda.inicio(a) < new Date();

    let status = 'confirmado';
    let rotulo = 'Confirmado';
    if (a.status === 'cancelado') { status = 'cancelado'; rotulo = 'Cancelado'; }
    else if (passou || a.status === 'realizado') { status = 'concluido'; rotulo = 'Realizado'; }

    return '' +
      '<article class="item-agendamento">' +
        '<div class="item-data">' +
          '<span>' + Util.DIAS_CURTOS[data.getDay()] + '</span>' +
          '<strong>' + data.getDate() + '</strong>' +
          '<span>' + Util.MESES_CURTOS[data.getMonth()] + '</span>' +
        '</div>' +
        '<div class="item-info">' +
          '<h3>' + Util.escapar(a.servicoNome) + '</h3>' +
          '<p>' +
            '<span>' + ICONES.relogio + a.horario + ' · ' + Util.formatarDuracao(a.duracao) + '</span>' +
            (a.atribuicoes ? '<span>' + ICONES.usuario + Util.escapar(Profissionais.descreverAtribuicoes(a)) + '</span>' : '') +
            '<span>' + ICONES.diamante + 'a partir de ' + Util.formatarPreco(a.preco) + '</span>' +
            '<span>Código ' + a.codigo + '</span>' +
            (a.status !== 'cancelado'
              ? '<span class="pagamento ' + (a.pago ? 'pago' : 'pendente') + '">' + (a.pago ? 'Pago' : 'Pagamento no salão') + '</span>'
              : '') +
          '</p>' +
        '</div>' +
        '<div class="item-acoes">' +
          '<span class="status status-' + status + '">' + rotulo + '</span>' +
          (podeCancelar ? '<button type="button" class="btn-cancelar" data-cancelar="' + a.id + '">Cancelar horário</button>' : '') +
        '</div>' +
      '</article>';
  },

  renderizarAgendamentos: function () {
    const grupos = this.separar();
    document.getElementById('cont-proximos').textContent = grupos.proximos.length;
    document.getElementById('cont-historico').textContent = grupos.historico.length;

    const lista = grupos[this.abaAtual];
    const caixa = document.getElementById('lista-agendamentos');
    const self = this;

    if (!lista.length) {
      caixa.innerHTML = this.abaAtual === 'proximos'
        ? '<div class="vazio">Você ainda não tem horários marcados.<br><br><a href="agendamento.html" class="btn btn-primario btn-pequeno">Agendar agora</a></div>'
        : '<div class="vazio">Seu histórico aparecerá aqui.</div>';
      return;
    }

    caixa.innerHTML = lista.map(function (a) { return self.item(a, self.abaAtual === 'proximos'); }).join('');
  },

  configurarEventos: function () {
    const self = this;

    Util.$$('.aba').forEach(function (aba) {
      aba.addEventListener('click', function () {
        Util.$$('.aba').forEach(function (a) {
          a.classList.toggle('ativo', a === aba);
          a.setAttribute('aria-selected', String(a === aba));
        });
        self.abaAtual = aba.dataset.aba;
        self.renderizarAgendamentos();
      });
    });

    document.getElementById('lista-agendamentos').addEventListener('click', function (e) {
      const botao = e.target.closest('[data-cancelar]');
      if (!botao) return;
      if (!window.confirm('Deseja realmente cancelar este horário?')) return;

      if (Agenda.cancelar(botao.dataset.cancelar, self.usuario.id)) {
        Layout.toast('Agendamento cancelado. O horário foi liberado.', 'sucesso');
        self.renderizarAgendamentos();
      }
    });

    document.getElementById('btn-sair').addEventListener('click', function () {
      Auth.sair();
      window.location.href = 'index.html';
    });
  }
};

document.addEventListener('DOMContentLoaded', function () { Conta.init(); });
