/* =========================================================
   LA VIE STUDIO — Painel da equipe (somente funcionárias)
   ---------------------------------------------------------
   Painel        → controle geral, abas e números do topo
   PainelAgenda  → lista de agendamentos, status e pagamento
   PainelNovo    → agendamento feito pela equipe para a cliente
   PainelConfig  → acessos da equipe e troca de senha
   ========================================================= */

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro'];
const ORIGENS = { site: 'Site', presencial: 'Presencial', whatsapp: 'WhatsApp' };

function opcoesFormaPagamento() {
  return FORMAS_PAGAMENTO.map(function (f) { return '<option value="' + f + '">' + f + '</option>'; }).join('');
}

function linkWhatsCliente(telefone, mensagem) {
  const digitos = (telefone || '').replace(/\D/g, '');
  if (digitos.length < 10) return '';
  return 'https://wa.me/55' + digitos + '?text=' + encodeURIComponent(mensagem);
}

/* =========================================================
   PAINEL — controle geral
   ========================================================= */
const Painel = {
  usuario: null,

  init: function () {
    this.usuario = Auth.usuarioAtual();
    if (!this.usuario) { window.location.href = 'login.html'; return; }
    if (!Auth.ehFuncionario(this.usuario)) { window.location.href = 'minha-conta.html'; return; }

    document.getElementById('saudacao-equipe').textContent =
      'Olá, ' + this.usuario.nome + '! Hoje é ' + Util.dataPorExtenso(Util.hojeISO()).toLowerCase() + '.';

    this.configurarSecoes();
    PainelAgenda.init();
    PainelNovo.init();
    PainelConfig.init();
    this.atualizarEstatisticas();

  },

  configurarSecoes: function () {
    const self = this;
    Util.$$('[data-secao]').forEach(function (aba) {
      aba.addEventListener('click', function () { self.mostrarSecao(aba.dataset.secao); });
    });
    Util.$$('[data-ir-secao]').forEach(function (botao) {
      botao.addEventListener('click', function () { self.mostrarSecao(botao.dataset.irSecao); });
    });
  },

  mostrarSecao: function (nome) {
    Util.$$('[data-secao]').forEach(function (aba) {
      const ativa = aba.dataset.secao === nome;
      aba.classList.toggle('ativo', ativa);
      aba.setAttribute('aria-selected', String(ativa));
    });
    ['agenda', 'novo', 'config'].forEach(function (s) {
      document.getElementById('secao-' + s).hidden = s !== nome;
    });
    if (nome === 'agenda') PainelAgenda.renderizar();
    if (nome === 'novo') PainelNovo.aoAbrir();
  },

  atualizarEstatisticas: function () {
    const todos = Agenda.todos().filter(function (a) { return a.status !== 'cancelado'; });
    const hoje = Util.hojeISO();
    const agora = new Date();

    const deHoje = todos.filter(function (a) { return a.data === hoje; }).length;
    const futuros = todos.filter(function (a) { return a.status === 'confirmado' && Agenda.inicio(a) >= agora; }).length;
    const aReceber = todos.filter(function (a) { return !a.pago; }).reduce(function (s, a) { return s + a.preco; }, 0);
    const recebido = todos.filter(function (a) { return a.pago; }).reduce(function (s, a) { return s + a.preco; }, 0);

    const cartoes = [
      ['calendario', deHoje, 'Atendimentos hoje'],
      ['relogio', futuros, 'Próximos confirmados'],
      ['diamante', Util.formatarPreco(aReceber), 'A receber'],
      ['check', Util.formatarPreco(recebido), 'Recebido']
    ];

    document.getElementById('estatisticas').innerHTML = cartoes.map(function (c) {
      return '<div class="estatistica"><span class="estatistica-icone">' + ICONES[c[0]] + '</span>' +
        '<div><strong>' + c[1] + '</strong><small>' + c[2] + '</small></div></div>';
    }).join('');
  }
};

/* =========================================================
   AGENDA — lista de todos os agendamentos
   ========================================================= */
const PainelAgenda = {
  filtro: 'proximos',
  busca: '',
  pagamento: 'todos',
  profissional: '',
  idPagamento: null,

  init: function () {
    const self = this;

    Util.$$('[data-filtro]').forEach(function (aba) {
      aba.addEventListener('click', function () {
        Util.$$('[data-filtro]').forEach(function (a) { a.classList.toggle('ativo', a === aba); });
        self.filtro = aba.dataset.filtro;
        self.renderizar();
      });
    });

    document.getElementById('busca').addEventListener('input', function (e) {
      self.busca = e.target.value.trim();
      self.renderizar();
    });

    document.getElementById('filtro-pagamento').addEventListener('change', function (e) {
      self.pagamento = e.target.value;
      self.renderizar();
    });

    // Filtro por profissional
    const filtroProf = document.getElementById('filtro-profissional');
    filtroProf.innerHTML = '<option value="">Todas</option>' + Object.keys(PROFISSIONAIS).map(function (c) {
      return '<optgroup label="' + c + '">' + PROFISSIONAIS[c].map(function (n) {
        return '<option value="' + n + '">' + n + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    filtroProf.addEventListener('change', function (e) {
      self.profissional = e.target.value;
      self.renderizar();
    });

    document.getElementById('lista-painel').addEventListener('click', this.clique.bind(this));

    // Janela de pagamento
    document.getElementById('pg-forma').innerHTML = opcoesFormaPagamento();
    document.getElementById('dialogo-pagamento').addEventListener('close', function (e) {
      if (e.target.returnValue === 'confirmar' && self.idPagamento) {
        Agenda.registrarPagamento(self.idPagamento, true, document.getElementById('pg-forma').value);
        Layout.toast('Pagamento registrado.', 'sucesso');
        self.atualizarTudo();
      }
      self.idPagamento = null;
    });

    this.renderizar();
  },

  atualizarTudo: function () {
    this.renderizar();
    Painel.atualizarEstatisticas();
  },

  // Situação real (um confirmado que já passou fica "aguardando baixa")
  situacao: function (a) {
    if (a.status === 'cancelado') return { classe: 'cancelado', rotulo: 'Cancelado' };
    if (a.status === 'realizado') return { classe: 'concluido', rotulo: 'Realizado' };
    if (Agenda.inicio(a) < new Date()) return { classe: 'pendente', rotulo: 'Aguardando baixa' };
    return { classe: 'confirmado', rotulo: 'Confirmado' };
  },

  filtrar: function () {
    const hoje = Util.hojeISO();
    const agora = new Date();
    const termo = this.busca.toLowerCase();
    const filtro = this.filtro;
    const pagamento = this.pagamento;
    const profissional = this.profissional;

    let lista = Agenda.todos().filter(function (a) {
      if (filtro === 'hoje') return a.data === hoje;
      if (filtro === 'proximos') return a.status === 'confirmado' && Agenda.inicio(a) >= agora;
      if (filtro === 'historico') return a.status !== 'confirmado' || Agenda.inicio(a) < agora;
      return true;
    });

    if (pagamento !== 'todos') {
      lista = lista.filter(function (a) { return a.status !== 'cancelado' && (pagamento === 'pago' ? a.pago : !a.pago); });
    }

    if (profissional) {
      lista = lista.filter(function (a) {
        return (a.atribuicoes || []).some(function (x) { return x.profissional === profissional; });
      });
    }

    if (termo) {
      lista = lista.filter(function (a) {
        return (a.clienteNome + ' ' + a.servicoNome + ' ' + a.codigo + ' ' + Profissionais.descreverAtribuicoes(a)).toLowerCase().indexOf(termo) !== -1;
      });
    }

    lista.sort(function (a, b) { return (a.data + a.horario).localeCompare(b.data + b.horario); });
    if (filtro === 'historico') lista.reverse();
    return lista;
  },

  item: function (a) {
    const s = this.situacao(a);
    const data = Util.isoParaData(a.data);
    const fim = Util.hhmm(Util.minutos(a.horario) + a.duracao);
    const origem = ORIGENS[a.origem || 'site'];
    const whats = linkWhatsCliente(a.clienteTelefone,
      'Olá, ' + Util.primeiroNome(a.clienteNome) + '! Aqui é do La Vie Studio. Sobre seu horário de ' +
      a.servicoNome + ' em ' + Util.dataCurta(a.data) + ' às ' + a.horario + '...');

    // Pagamento
    let pagamento = '';
    if (a.status !== 'cancelado') {
      pagamento = a.pago
        ? '<span class="pagamento pago">' + ICONES.check + 'Pago' + (a.formaPagamento ? ' · ' + a.formaPagamento : '') + '</span>'
        : '<span class="pagamento pendente">Não pago</span>';
    }

    // Ações
    let acoes = '';
    if (a.status !== 'cancelado') {
      acoes += a.pago
        ? '<button type="button" class="btn-acao" data-acao="estornar" data-id="' + a.id + '">Desfazer pagamento</button>'
        : '<button type="button" class="btn-acao destaque" data-acao="pagar" data-id="' + a.id + '">Registrar pagamento</button>';
    }
    if (a.status === 'confirmado') {
      acoes += '<button type="button" class="btn-acao" data-acao="realizado" data-id="' + a.id + '">Marcar realizado</button>' +
               '<button type="button" class="btn-cancelar" data-acao="cancelado" data-id="' + a.id + '">Cancelar</button>';
    } else {
      acoes += '<button type="button" class="btn-acao" data-acao="confirmado" data-id="' + a.id + '">Reabrir</button>';
    }
    if (whats) acoes += '<a class="btn-acao" href="' + whats + '" target="_blank" rel="noopener">WhatsApp da cliente</a>';

    return '' +
      '<article class="item-agendamento item-painel">' +
        '<div class="item-data">' +
          '<span>' + Util.DIAS_CURTOS[data.getDay()] + ' ' + data.getDate() + '/' + Util.doisDigitos(data.getMonth() + 1) + '</span>' +
          '<strong>' + a.horario + '</strong>' +
          '<span>até ' + fim + '</span>' +
        '</div>' +
        '<div class="item-info">' +
          '<h3>' + Util.escapar(a.clienteNome) + '</h3>' +
          '<p class="item-servicos">' + Util.escapar(a.servicoNome) + ' · ' + Util.formatarDuracao(a.duracao) + ' · ' + Util.formatarPreco(a.preco) + '</p>' +
          (a.atribuicoes && a.atribuicoes.length
            ? '<p class="item-prof">' + ICONES.usuario + 'Com ' + Util.escapar(Profissionais.descreverAtribuicoes(a)) +
              (a.escolheuProfissional ? '' : ' <small>· sem preferência</small>') + '</p>'
            : '') +
          '<p>' +
            '<span>' + ICONES.telefone + Util.escapar(a.clienteTelefone || '—') + '</span>' +
            '<span class="tag-origem">' + origem + '</span>' +
            '<span>' + a.codigo + '</span>' +
          '</p>' +
          (a.observacao ? '<p class="item-obs">“' + Util.escapar(a.observacao) + '”</p>' : '') +
        '</div>' +
        '<div class="item-acoes">' +
          '<div class="item-selos"><span class="status status-' + s.classe + '">' + s.rotulo + '</span>' + pagamento + '</div>' +
          '<div class="item-botoes">' + acoes + '</div>' +
        '</div>' +
      '</article>';
  },

  renderizar: function () {
    const lista = this.filtrar();
    const caixa = document.getElementById('lista-painel');

    if (!lista.length) {
      const textos = {
        hoje: 'Nenhum atendimento marcado para hoje.',
        proximos: 'Nenhum agendamento futuro.',
        historico: 'Nenhum atendimento no histórico.',
        todos: 'Nenhum agendamento encontrado.'
      };
      const filtrado = this.busca || this.pagamento !== 'todos';
      caixa.innerHTML = '<div class="vazio">' + (filtrado ? 'Nenhum resultado com esses filtros.' : textos[this.filtro]) + '</div>';
      return;
    }

    caixa.innerHTML = lista.map(this.item.bind(this)).join('');
  },

  clique: function (e) {
    const botao = e.target.closest('button[data-acao]');
    if (!botao) return;
    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    if (acao === 'pagar') {
      const a = Agenda.todos().find(function (x) { return x.id === id; });
      this.idPagamento = id;
      document.getElementById('pg-descricao').textContent =
        a.clienteNome + ' — ' + a.servicoNome + ' · ' + Util.formatarPreco(a.preco);
      document.getElementById('dialogo-pagamento').showModal();
      return;
    }

    if (acao === 'estornar') {
      if (!window.confirm('Desfazer o pagamento deste agendamento?')) return;
      Agenda.registrarPagamento(id, false);
      Layout.toast('Pagamento desfeito.', 'sucesso');
    } else {
      if (acao === 'cancelado' && !window.confirm('Cancelar este agendamento? O horário será liberado.')) return;
      Agenda.alterarStatus(id, acao);
      const mensagens = { realizado: 'Atendimento marcado como realizado.', cancelado: 'Agendamento cancelado.', confirmado: 'Agendamento reaberto.' };
      Layout.toast(mensagens[acao], 'sucesso');
    }
    this.atualizarTudo();
  }
};

/* =========================================================
   NOVO AGENDAMENTO — feito pela equipe
   ========================================================= */
const PainelNovo = {
  calendario: null,
  clienteId: null,
  escolha: { servicos: [], profissionais: {}, data: null, horario: null },

  init: function () {
    const self = this;

    this.renderizarClientes();
    this.renderizarServicos();
    document.getElementById('nb-forma').innerHTML = opcoesFormaPagamento();
    Form.configurarMascaraTelefone(document.getElementById('nb-telefone'));

    this.calendario = new Calendario(document.getElementById('nb-calendario'), {
      aoSelecionar: function (iso) {
        self.escolha.data = iso;
        self.escolha.horario = null;
        self.renderizarHorarios();
        self.atualizar();
      },
      profissionais: function () { return self.escolha.profissionais; }
    });

    document.getElementById('nb-profissionais').addEventListener('click', function (e) {
      const botao = e.target.closest('.prof-opcao');
      if (!botao) return;
      self.escolha.profissionais[botao.dataset.categoria] = botao.dataset.profissional;
      self.renderizarProfissionais();
      self.escolha.horario = null;
      self.calendario.definirDuracao(Agenda.duracaoTotal(self.escolha.servicos));
      self.escolha.data = self.calendario.selecionada;
      self.renderizarHorarios();
      self.atualizar();
    });

    // Cliente cadastrada: preenche nome e telefone
    document.getElementById('nb-cliente-existente').addEventListener('change', function (e) {
      const cliente = Auth.clientes().find(function (c) { return c.id === e.target.value; });
      self.clienteId = cliente ? cliente.id : null;
      document.getElementById('nb-nome').value = cliente ? cliente.nome : '';
      document.getElementById('nb-telefone').value = cliente ? cliente.telefone : '';
      self.atualizar();
    });

    ['nb-nome', 'nb-telefone'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function (e) {
        e.target.closest('.campo').classList.remove('erro');
        self.atualizar();
      });
    });

    document.getElementById('nb-servicos').addEventListener('click', function (e) {
      const botao = e.target.closest('.opcao-servico');
      if (botao) self.alternarServico(botao.dataset.servico);
    });

    document.getElementById('nb-horarios').addEventListener('click', function (e) {
      const botao = e.target.closest('.btn-horario');
      if (!botao || botao.disabled) return;
      self.escolha.horario = botao.dataset.horario;
      Util.$$('#nb-horarios .btn-horario').forEach(function (b) { b.setAttribute('aria-pressed', String(b === botao)); });
      self.atualizar();
    });

    Util.$$('input[name="nb-pago"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.getElementById('nb-forma-campo').hidden = !self.estaPago();
        self.atualizar();
      });
    });
    document.getElementById('nb-forma').addEventListener('change', this.atualizar.bind(this));

    document.getElementById('nb-confirmar').addEventListener('click', this.confirmar.bind(this));
  },

  // Ao abrir a aba: atualiza a lista de clientes e a disponibilidade
  aoAbrir: function () {
    document.getElementById('nb-sucesso').hidden = true;
    document.getElementById('nb-formulario').hidden = false;
    this.renderizarClientes();
    this.calendario.atualizar();
    if (this.escolha.data) this.renderizarHorarios();
  },

  estaPago: function () { return Util.$('input[name="nb-pago"]:checked').value === 'sim'; },
  origem: function () { return Util.$('input[name="nb-origem"]:checked').value; },

  renderizarClientes: function () {
    const atual = this.clienteId;
    document.getElementById('nb-cliente-existente').innerHTML =
      '<option value="">— Nova cliente / não cadastrada —</option>' +
      Auth.clientes().map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === atual ? ' selected' : '') + '>' +
          Util.escapar(c.nome) + ' · ' + Util.escapar(c.telefone) + '</option>';
      }).join('');
  },

  renderizarServicos: function () {
    document.getElementById('nb-servicos').innerHTML = SERVICOS.map(function (s) {
      return '' +
        '<button type="button" class="opcao-servico" data-servico="' + s.id + '" aria-pressed="false">' +
          '<span class="mini-ilustra tom-' + s.tom + '">' + ICONES[s.icone] + '</span>' +
          '<span><strong>' + s.nome + '</strong><small>' + Util.formatarDuracao(s.duracao) + ' · ' + Util.formatarPreco(s.preco) + '</small></span>' +
        '</button>';
    }).join('');
  },

  alternarServico: function (id) {
    const lista = this.escolha.servicos;
    const posicao = lista.findIndex(function (s) { return s.id === id; });
    if (posicao >= 0) lista.splice(posicao, 1);
    else lista.push(buscarServico(id));
    lista.sort(function (a, b) { return SERVICOS.indexOf(a) - SERVICOS.indexOf(b); });

    Util.$$('#nb-servicos .opcao-servico').forEach(function (b) {
      b.setAttribute('aria-pressed', String(lista.some(function (s) { return s.id === b.dataset.servico; })));
    });

    this.escolha.profissionais = Profissionais.ajustarSelecao(this.escolha.profissionais, lista);
    this.renderizarProfissionais();

    const tem = lista.length > 0;
    document.getElementById('nb-calendario').hidden = !tem;
    document.getElementById('nb-data-vazio').hidden = tem;
    this.escolha.horario = null;

    if (tem) {
      this.calendario.definirDuracao(Agenda.duracaoTotal(lista));
      this.escolha.data = this.calendario.selecionada;
    } else {
      this.calendario.limpar();
      this.escolha.data = null;
    }
    this.renderizarHorarios();
    this.atualizar();
  },

  renderizarProfissionais: function () {
    const tem = this.escolha.servicos.length > 0;
    document.getElementById('nb-profissional-vazio').hidden = tem;
    document.getElementById('nb-profissionais').innerHTML =
      tem ? Profissionais.html(this.escolha.servicos, this.escolha.profissionais) : '';
  },

  renderizarHorarios: function () {
    const caixa = document.getElementById('nb-horarios');
    if (!this.escolha.data) {
      caixa.innerHTML = '<p class="vazio">Selecione uma data para ver os horários.</p>';
      return;
    }
    const horarios = Agenda.horariosDoDia(this.escolha.data, Agenda.duracaoTotal(this.escolha.servicos), this.escolha.profissionais);
    const selecionado = this.escolha.horario;

    if (!horarios.length) {
      caixa.innerHTML = '<p class="vazio">Não há horários para esta data.</p>';
      return;
    }
    caixa.innerHTML = '<p class="etapa-desc">' + Util.dataPorExtenso(this.escolha.data) + '</p>' +
      '<div class="lista-horarios">' + horarios.map(function (h) {
        return '<button type="button" class="btn-horario" data-horario="' + h.horario + '" aria-pressed="' + (h.horario === selecionado) + '"' +
          (h.livre ? '' : ' disabled') + '>' + h.horario + '</button>';
      }).join('') + '</div>';
  },

  definir: function (id, valorHtml, vazio) {
    const el = document.getElementById(id);
    el.innerHTML = valorHtml || vazio;
    el.classList.toggle('pendente', !valorHtml);
  },

  // Atualiza etapas, resumo e o botão de confirmar
  atualizar: function () {
    const e = this.escolha;
    const nome = document.getElementById('nb-nome').value.trim();
    const tem = e.servicos.length > 0;
    const duracao = Agenda.duracaoTotal(e.servicos);

    document.getElementById('nb-etapa-profissional').classList.toggle('bloqueada', !tem);
    document.getElementById('nb-etapa-data').classList.toggle('bloqueada', !tem);
    document.getElementById('nb-etapa-horario').classList.toggle('bloqueada', !e.data);

    this.definir('nb-r-cliente', Util.escapar(nome), 'a informar');
    this.definir('nb-r-servicos', tem ? e.servicos.map(function (s) { return s.nome; }).join('<br>') : '', 'a escolher');
    this.definir('nb-r-profissional', tem ? Profissionais.descreverSelecao(e.profissionais) : '', '—');
    this.definir('nb-r-duracao', tem ? Util.formatarDuracao(duracao) : '', '—');
    this.definir('nb-r-data', e.data ? Util.dataCurta(e.data) : '', 'a escolher');
    this.definir('nb-r-horario', e.horario ? e.horario + ' às ' + Util.hhmm(Util.minutos(e.horario) + duracao) : '', 'a escolher');
    document.getElementById('nb-r-pagamento').textContent = this.estaPago()
      ? 'Pago · ' + document.getElementById('nb-forma').value
      : 'Não pago';
    document.getElementById('nb-r-preco').textContent = tem ? Util.formatarPreco(Agenda.precoTotal(e.servicos)) : '—';

    const pronto = nome && tem && e.data && e.horario;
    document.getElementById('nb-confirmar').disabled = !pronto;
    document.getElementById('nb-aviso').hidden = !!pronto;
  },

  confirmar: function () {
    const nomeInput = document.getElementById('nb-nome');
    const telInput = document.getElementById('nb-telefone');
    let valido = true;

    if (nomeInput.value.trim().length < 3) { Form.erro(nomeInput, 'Informe o nome da cliente.'); valido = false; }
    if (!Util.telefoneValido(telInput.value)) { Form.erro(telInput, 'Informe o telefone com DDD.'); valido = false; }
    if (!valido) { nomeInput.closest('.etapa').scrollIntoView({ behavior: 'smooth' }); return; }

    // Liga à conta da cliente, se ela for cadastrada (pela lista ou pelo telefone)
    let clienteId = this.clienteId;
    let email = '';
    const digitos = telInput.value.replace(/\D/g, '');
    const conta = Auth.clientes().find(function (c) {
      return c.id === clienteId || (!clienteId && c.telefone.replace(/\D/g, '') === digitos);
    });
    if (conta) { clienteId = conta.id; email = conta.email; }

    const pago = this.estaPago();
    const resultado = Agenda.criar({
      cliente: { id: clienteId, nome: nomeInput.value, email: email, telefone: telInput.value },
      servicos: this.escolha.servicos,
      profissionais: this.escolha.profissionais,
      data: this.escolha.data,
      horario: this.escolha.horario,
      observacao: document.getElementById('nb-obs').value,
      origem: this.origem(),
      pago: pago,
      formaPagamento: pago ? document.getElementById('nb-forma').value : '',
      criadoPor: Painel.usuario.nome
    });

    if (!resultado.ok) {
      Layout.toast(resultado.erro, 'erro');
      this.escolha.horario = null;
      this.calendario.atualizar();
      this.renderizarHorarios();
      this.atualizar();
      return;
    }

    this.mostrarSucesso(resultado.agendamento);
    this.limpar();
    PainelAgenda.atualizarTudo();
  },

  mostrarSucesso: function (a) {
    const mensagem = 'Olá, ' + Util.primeiroNome(a.clienteNome) + '! Seu horário no La Vie Studio está confirmado ✨\n' +
      'Procedimentos: ' + a.servicoNome + '\n' +
      'Profissional: ' + Profissionais.descreverAtribuicoes(a) + '\n' +
      'Data: ' + Util.dataPorExtenso(a.data) + '\n' +
      'Horário: ' + a.horario + '\n' +
      'Código: ' + a.codigo + '\n' +
      (a.pago ? 'Pagamento: recebido (' + a.formaPagamento + '). Obrigada!' : 'Pagamento: no salão, no dia do atendimento.');
    const whats = linkWhatsCliente(a.clienteTelefone, mensagem);

    const caixa = document.getElementById('nb-sucesso');
    caixa.innerHTML =
      '<div class="icone-circulo sucesso">' + ICONES.check + '</div>' +
      '<span class="sobretitulo">Agendamento criado</span>' +
      '<h2>' + Util.escapar(a.clienteNome) + '</h2>' +
      '<ul class="detalhes-confirmacao">' +
        '<li><span>Código</span><span class="codigo">' + a.codigo + '</span></li>' +
        '<li><span>Procedimentos</span><span>' + a.servicos.map(function (s) { return s.nome; }).join('<br>') + '</span></li>' +
        '<li><span>Profissional</span><span>' + Profissionais.descreverAtribuicoes(a, '<br>') + '</span></li>' +
        '<li><span>Data</span><span>' + Util.dataPorExtenso(a.data) + '</span></li>' +
        '<li><span>Horário</span><span>' + a.horario + ' às ' + Util.hhmm(Util.minutos(a.horario) + a.duracao) + '</span></li>' +
        '<li><span>Origem</span><span>' + ORIGENS[a.origem] + '</span></li>' +
        '<li><span>Total</span><span>' + Util.formatarPreco(a.preco) + '</span></li>' +
        '<li><span>Pagamento</span><span>' + (a.pago ? 'Pago · ' + a.formaPagamento : 'Não pago') + '</span></li>' +
      '</ul>' +
      '<div class="hero-acoes">' +
        (whats ? '<a class="btn btn-dourado" href="' + whats + '" target="_blank" rel="noopener">' + ICONES.whatsapp + 'Enviar confirmação</a>' : '') +
        '<button type="button" class="btn btn-primario" data-novo-outro>Novo agendamento</button>' +
        '<button type="button" class="btn btn-contorno" data-ver-agenda>Ver na agenda</button>' +
      '</div>';

    caixa.querySelector('[data-novo-outro]').addEventListener('click', function () { Painel.mostrarSecao('novo'); });
    caixa.querySelector('[data-ver-agenda]').addEventListener('click', function () { Painel.mostrarSecao('agenda'); });

    document.getElementById('nb-formulario').hidden = true;
    caixa.hidden = false;
    window.scrollTo({ top: caixa.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  },

  limpar: function () {
    this.clienteId = null;
    this.escolha = { servicos: [], profissionais: {}, data: null, horario: null };
    ['nb-nome', 'nb-telefone', 'nb-obs'].forEach(function (id) { document.getElementById(id).value = ''; });
    Util.$('input[name="nb-origem"][value="presencial"]').checked = true;
    Util.$('input[name="nb-pago"][value="nao"]').checked = true;
    document.getElementById('nb-forma-campo').hidden = true;
    Util.$$('#nb-servicos .opcao-servico').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    document.getElementById('nb-calendario').hidden = true;
    document.getElementById('nb-data-vazio').hidden = false;
    this.calendario.limpar();
    this.renderizarProfissionais();
    this.renderizarClientes();
    this.renderizarHorarios();
    this.atualizar();
  }
};

/* =========================================================
   CONFIGURAÇÕES — acessos da equipe
   ========================================================= */
const PainelConfig = {
  init: function () {
    Form.configurarVerSenha();
    Form.limparAoDigitar(document.getElementById('form-equipe'));
    Form.limparAoDigitar(document.getElementById('form-minha-senha'));

    document.getElementById('form-equipe').addEventListener('submit', this.adicionar.bind(this));
    document.getElementById('form-minha-senha').addEventListener('submit', this.alterarSenha.bind(this));
    document.getElementById('lista-equipe').addEventListener('click', this.remover.bind(this));
    this.renderizar();
  },

  renderizar: function () {
    const meuId = Painel.usuario.id;
    document.getElementById('lista-equipe').innerHTML = Auth.funcionarios().map(function (f) {
      const desde = new Date(f.criadoEm);
      const souEu = f.id === meuId;
      return '' +
        '<div class="membro-equipe">' +
          '<div class="avatar avatar-pequeno">' + Util.escapar(f.nome.charAt(0).toUpperCase()) + '</div>' +
          '<div class="membro-info">' +
            '<strong>' + Util.escapar(f.nome) + (souEu ? ' <span class="tag-origem">você</span>' : '') + '</strong>' +
            '<small>' + Util.escapar(f.email) + ' · desde ' + Util.MESES_CURTOS[desde.getMonth()] + '/' + desde.getFullYear() + '</small>' +
          '</div>' +
          (souEu ? '' : '<button type="button" class="btn-cancelar" data-remover="' + f.id + '">Remover acesso</button>') +
        '</div>';
    }).join('');
  },

  adicionar: function (e) {
    e.preventDefault();
    const f = e.target;
    const alerta = document.getElementById('alerta-equipe');
    Form.limpar(f);
    alerta.hidden = true;

    let valido = true;
    if (f.nome.value.trim().length < 3) { Form.erro(f.nome, 'Informe o nome.'); valido = false; }
    if (!Util.emailValido(f.email.value.trim())) { Form.erro(f.email, 'Informe um e-mail válido.'); valido = false; }
    if (f.senha.value.length < 6) { Form.erro(f.senha, 'Mínimo de 6 caracteres.'); valido = false; }
    if (f.confirmar.value !== f.senha.value) { Form.erro(f.confirmar, 'As senhas não coincidem.'); valido = false; }
    if (!valido) return;

    const resultado = Auth.cadastrar({
      nome: f.nome.value,
      email: f.email.value,
      telefone: '',
      senha: f.senha.value,
      papel: 'funcionario'
    });

    if (!resultado.ok) {
      Form.alerta(alerta, 'erro', 'Já existe uma conta com esse e-mail.');
      return;
    }

    Form.alerta(alerta, 'sucesso', 'Acesso liberado para ' + resultado.usuario.nome + '. Ela já pode entrar com o e-mail e a senha cadastrados.');
    f.reset();
    this.renderizar();
  },

  remover: function (e) {
    const botao = e.target.closest('[data-remover]');
    if (!botao) return;
    if (!window.confirm('Remover o acesso desta funcionária ao painel?')) return;

    const resultado = Auth.removerFuncionario(botao.dataset.remover);
    Layout.toast(resultado.ok ? 'Acesso removido.' : resultado.erro, resultado.ok ? 'sucesso' : 'erro');
    this.renderizar();
  },

  alterarSenha: function (e) {
    e.preventDefault();
    const f = e.target;
    const alerta = document.getElementById('alerta-senha');
    Form.limpar(f);
    alerta.hidden = true;

    let valido = true;
    if (!f.atual.value) { Form.erro(f.atual, 'Informe a senha atual.'); valido = false; }
    if (f.nova.value.length < 6) { Form.erro(f.nova, 'Mínimo de 6 caracteres.'); valido = false; }
    if (f.confirmar.value !== f.nova.value) { Form.erro(f.confirmar, 'As senhas não coincidem.'); valido = false; }
    if (!valido) return;

    const resultado = Auth.alterarSenha(Painel.usuario.id, f.atual.value, f.nova.value);
    if (!resultado.ok) { Form.erro(f.atual, resultado.erro); return; }

    Form.alerta(alerta, 'sucesso', 'Senha alterada com sucesso.');
    f.reset();
  }
};

document.addEventListener('DOMContentLoaded', function () { Painel.init(); });
