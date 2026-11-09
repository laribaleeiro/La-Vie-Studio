/* =========================================================
   LA VIE STUDIO — Página de agendamento (cliente)
   Fluxo: procedimentos → data → horário → confirmação
   A cliente pode escolher mais de um procedimento; eles são
   somados em um único horário (duração e valor totais).
   ========================================================= */

const Agendamento = {
  usuario: null,
  calendario: null,
  escolha: { servicos: [], profissionais: {}, data: null, horario: null },

  init: function () {
    this.usuario = Auth.usuarioAtual();
    const servicoUrl = Util.param('servico');

    // Sem login: mostra o convite para entrar ou se cadastrar
    if (!this.usuario) {
      const destino = 'agendamento.html' + (servicoUrl ? '?servico=' + encodeURIComponent(servicoUrl) : '');
      document.getElementById('btn-ir-login').href = 'login.html?redirect=' + encodeURIComponent(destino);
      document.getElementById('btn-ir-cadastro').href = 'cadastro.html?redirect=' + encodeURIComponent(destino);
      document.getElementById('bloqueio').hidden = false;
      return;
    }

    // Conta da equipe agenda pelo painel
    if (Auth.ehFuncionario(this.usuario)) {
      window.location.href = 'painel.html';
      return;
    }

    document.getElementById('fluxo').hidden = false;

    const flash = Util.flash.ler();
    if (flash) Layout.toast(flash.mensagem, flash.tipo);

    const self = this;
    this.calendario = new Calendario(document.getElementById('calendario'), {
      aoSelecionar: function (iso) { self.selecionarData(iso); },
      profissionais: function () { return self.escolha.profissionais; }
    });

    this.renderizarCliente();
    this.renderizarServicos();
    this.configurarEventos();
    this.atualizarEtapas();
    this.atualizarResumo();

    // Procedimento vindo da página inicial (botão "Agendar este cuidado")
    if (servicoUrl && buscarServico(servicoUrl)) this.alternarServico(servicoUrl);
  },

  /* ---------- Renderização ---------- */
  renderizarCliente: function () {
    document.getElementById('resumo-cliente').innerHTML =
      ICONES.usuario +
      '<span><small>Agendando como</small><strong>' + Util.escapar(this.usuario.nome) + '</strong></span>';
  },

  renderizarServicos: function () {
    document.getElementById('lista-servicos').innerHTML = SERVICOS.map(function (s) {
      return '' +
        '<button type="button" class="opcao-servico" data-servico="' + s.id + '" aria-pressed="false">' +
          '<span class="mini-ilustra tom-' + s.tom + '">' + ICONES[s.icone] + '</span>' +
          '<span><strong>' + s.nome + '</strong><small>' + Util.formatarDuracao(s.duracao) + ' · a partir de ' + Util.formatarPreco(s.preco) + '</small></span>' +
        '</button>';
    }).join('');
  },

  // Informações de cada procedimento escolhido
  renderizarInfoServicos: function () {
    const caixa = document.getElementById('info-servico');
    caixa.innerHTML = this.escolha.servicos.map(function (s) {
      const detalhes = s.detalhes.map(function (d) { return '<li>' + ICONES.check + d + '</li>'; }).join('');
      return '' +
        '<div class="info-servico">' +
          '<div class="ilustracao tom-' + s.tom + '">' + ICONES[s.icone] + '</div>' +
          '<div>' +
            '<span class="card-categoria">' + s.categoria + '</span>' +
            '<h3>' + s.nome + '</h3>' +
            '<p>' + s.descricao + '</p>' +
            '<ul>' + detalhes + '</ul>' +
            '<div class="info-tags">' +
              '<span class="tag">' + ICONES.relogio + 'Duração: ' + Util.formatarDuracao(s.duracao) + '</span>' +
              '<span class="tag">' + ICONES.diamante + 'A partir de ' + Util.formatarPreco(s.preco) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  },

  renderizarHorarios: function () {
    const caixa = document.getElementById('lista-horarios');
    const desc = document.getElementById('desc-horario');

    if (!this.escolha.data) {
      desc.textContent = 'Horários livres para a data escolhida.';
      caixa.innerHTML = '<p class="vazio">Selecione uma data para ver os horários.</p>';
      return;
    }

    const duracao = Agenda.duracaoTotal(this.escolha.servicos);
    const horarios = Agenda.horariosDoDia(this.escolha.data, duracao, this.escolha.profissionais);
    const selecionado = this.escolha.horario;

    desc.textContent = 'Horários para ' + Util.dataPorExtenso(this.escolha.data).toLowerCase() +
      ' (atendimento de ' + Util.formatarDuracao(duracao) + ').';

    if (!horarios.length) {
      caixa.innerHTML = '<p class="vazio">Não há horários para esta data.</p>';
      return;
    }

    caixa.innerHTML = '<div class="lista-horarios">' + horarios.map(function (h) {
      return '<button type="button" class="btn-horario" data-horario="' + h.horario + '" aria-pressed="' + (h.horario === selecionado) + '"' +
        (h.livre ? '' : ' disabled aria-label="' + h.horario + ' — indisponível"') + '>' + h.horario + '</button>';
    }).join('') + '</div>' +
    '<div class="legenda"><span><i></i>Livre</span><span><i class="sel"></i>Selecionado</span><span><i class="ind"></i>Ocupado</span></div>';
  },

  /* ---------- Escolhas ---------- */
  alternarServico: function (id) {
    const lista = this.escolha.servicos;
    const posicao = lista.findIndex(function (s) { return s.id === id; });
    if (posicao >= 0) lista.splice(posicao, 1);
    else lista.push(buscarServico(id));

    // Mantém a ordem do catálogo
    lista.sort(function (a, b) { return SERVICOS.indexOf(a) - SERVICOS.indexOf(b); });

    Util.$$('.opcao-servico').forEach(function (b) {
      b.setAttribute('aria-pressed', String(lista.some(function (s) { return s.id === b.dataset.servico; })));
    });

    // Mantém a profissional escolhida das categorias que continuam
    this.escolha.profissionais = Profissionais.ajustarSelecao(this.escolha.profissionais, lista);
    this.renderizarProfissionais();

    // A duração mudou: o horário precisa ser escolhido de novo
    this.escolha.horario = null;
    const temServico = lista.length > 0;
    document.getElementById('calendario').hidden = !temServico;
    document.getElementById('data-vazio').hidden = temServico;

    if (temServico) {
      this.calendario.definirDuracao(Agenda.duracaoTotal(lista));
      this.escolha.data = this.calendario.selecionada;
    } else {
      this.calendario.limpar();
      this.escolha.data = null;
    }

    this.renderizarInfoServicos();
    this.renderizarHorarios();
    this.atualizarEtapas();
    this.atualizarResumo();
  },

  renderizarProfissionais: function () {
    const tem = this.escolha.servicos.length > 0;
    document.getElementById('profissional-vazio').hidden = tem;
    document.getElementById('lista-profissionais').innerHTML =
      tem ? Profissionais.html(this.escolha.servicos, this.escolha.profissionais) : '';
  },

  selecionarProfissional: function (categoria, nome) {
    this.escolha.profissionais[categoria] = nome;
    this.renderizarProfissionais();

    // A disponibilidade muda conforme a profissional
    this.escolha.horario = null;
    this.calendario.definirDuracao(Agenda.duracaoTotal(this.escolha.servicos));
    this.escolha.data = this.calendario.selecionada;
    this.renderizarHorarios();
    this.atualizarEtapas();
    this.atualizarResumo();
  },

  selecionarData: function (iso) {
    this.escolha.data = iso;
    this.escolha.horario = null;
    this.renderizarHorarios();
    this.atualizarEtapas();
    this.atualizarResumo();

    // No celular, leva a cliente até os horários
    if (window.innerWidth < 1024) {
      document.getElementById('etapa-horario').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  selecionarHorario: function (horario) {
    this.escolha.horario = horario;
    Util.$$('.btn-horario').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.horario === horario)); });
    this.atualizarEtapas();
    this.atualizarResumo();
  },

  /* ---------- Estado visual ---------- */
  atualizarEtapas: function () {
    const e = this.escolha;
    document.getElementById('etapa-profissional').classList.toggle('bloqueada', !e.servicos.length);
    document.getElementById('etapa-data').classList.toggle('bloqueada', !e.servicos.length);
    document.getElementById('etapa-horario').classList.toggle('bloqueada', !e.data);

    const concluidos = [e.servicos.length > 0, e.servicos.length > 0, !!e.data, !!e.horario];
    const atual = concluidos.indexOf(false) === -1 ? 5 : concluidos.indexOf(false) + 1;

    Util.$$('#stepper li').forEach(function (li) {
      const passo = Number(li.dataset.passo);
      li.classList.toggle('feito', passo < atual);
      li.classList.toggle('atual', passo === atual);
    });
  },

  definirResumo: function (id, valorHtml, vazio) {
    const el = document.getElementById(id);
    el.innerHTML = valorHtml || vazio;
    el.classList.toggle('pendente', !valorHtml);
  },

  atualizarResumo: function () {
    const e = this.escolha;
    const tem = e.servicos.length > 0;
    const duracao = Agenda.duracaoTotal(e.servicos);

    this.definirResumo('r-servico', tem ? e.servicos.map(function (s) { return s.nome; }).join('<br>') : '', 'a escolher');
    this.definirResumo('r-profissional', tem ? Profissionais.descreverSelecao(e.profissionais) : '', '—');
    this.definirResumo('r-duracao', tem ? Util.formatarDuracao(duracao) : '', '—');
    this.definirResumo('r-data', e.data ? Util.dataCurta(e.data) + ' (' + Util.DIAS_CURTOS[Util.isoParaData(e.data).getDay()] + ')' : '', 'a escolher');
    this.definirResumo('r-horario', e.horario ? e.horario + ' às ' + Util.hhmm(Util.minutos(e.horario) + duracao) : '', 'a escolher');
    document.getElementById('r-preco').textContent = tem ? Util.formatarPreco(Agenda.precoTotal(e.servicos)) : '—';
    document.getElementById('btn-confirmar').disabled = !(tem && e.data && e.horario);
  },

  /* ---------- Eventos ---------- */
  configurarEventos: function () {
    const self = this;

    document.getElementById('lista-servicos').addEventListener('click', function (e) {
      const botao = e.target.closest('.opcao-servico');
      if (botao) self.alternarServico(botao.dataset.servico);
    });

    document.getElementById('lista-profissionais').addEventListener('click', function (e) {
      const botao = e.target.closest('.prof-opcao');
      if (botao) self.selecionarProfissional(botao.dataset.categoria, botao.dataset.profissional);
    });

    document.getElementById('lista-horarios').addEventListener('click', function (e) {
      const botao = e.target.closest('.btn-horario');
      if (botao && !botao.disabled) self.selecionarHorario(botao.dataset.horario);
    });

    document.getElementById('btn-confirmar').addEventListener('click', this.confirmar.bind(this));
  },

  confirmar: function () {
    const e = this.escolha;
    if (!(e.servicos.length && e.data && e.horario)) return;

    const resultado = Agenda.criar({
      cliente: this.usuario,
      servicos: e.servicos,
      profissionais: e.profissionais,
      data: e.data,
      horario: e.horario,
      observacao: document.getElementById('observacao').value,
      origem: 'site',
      pago: false
    });

    if (!resultado.ok) {
      Layout.toast(resultado.erro, 'erro');
      this.escolha.horario = null;
      this.calendario.atualizar();
      this.renderizarHorarios();
      this.atualizarEtapas();
      this.atualizarResumo();
      return;
    }

    this.mostrarConfirmacao(resultado.agendamento);
  },

  mostrarConfirmacao: function (a) {
    document.getElementById('fluxo').hidden = true;
    const caixa = document.getElementById('confirmacao');
    caixa.hidden = false;

    document.getElementById('texto-confirmacao').innerHTML =
      'Obrigada, <strong>' + Util.escapar(Util.primeiroNome(a.clienteNome)) + '</strong>! Seu horário está reservado. ' +
      'Você pode acompanhar ou cancelar pela área “Minha conta”.';

    const linhas = [
      ['Código', '<span class="codigo">' + a.codigo + '</span>'],
      ['Cliente', Util.escapar(a.clienteNome)],
      ['Procedimentos', a.servicos.map(function (s) { return s.nome; }).join('<br>')],
      ['Profissional', Profissionais.descreverAtribuicoes(a, '<br>')],
      ['Data', Util.dataPorExtenso(a.data)],
      ['Horário', a.horario + ' às ' + Util.hhmm(Util.minutos(a.horario) + a.duracao) + ' (' + Util.formatarDuracao(a.duracao) + ')'],
      ['Total a partir de', Util.formatarPreco(a.preco)],
      ['Pagamento', 'No salão, no dia do atendimento']
    ];
    if (a.observacao) linhas.push(['Observações', Util.escapar(a.observacao)]);

    document.getElementById('detalhes-confirmacao').innerHTML = linhas.map(function (l) {
      return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>';
    }).join('');

    const mensagem = 'Olá! Acabei de agendar pelo site do La Vie Studio.\n' +
      'Código: ' + a.codigo + '\n' +
      'Nome: ' + a.clienteNome + '\n' +
      'Procedimentos: ' + a.servicoNome + '\n' +
      'Profissional: ' + Profissionais.descreverAtribuicoes(a) + '\n' +
      'Data: ' + Util.dataCurta(a.data) + ' às ' + a.horario;
    document.getElementById('btn-whats-confirmacao').href = linkWhatsApp(mensagem);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    caixa.focus({ preventScroll: true });
  }
};

document.addEventListener('DOMContentLoaded', function () { Agendamento.init(); });
