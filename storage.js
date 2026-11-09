/* =========================================================
   LA VIE STUDIO — Armazenamento de dados
   ---------------------------------------------------------
   Contas, sessão e agendamentos ficam salvos no navegador
   (localStorage). Para uso em produção, estas funções podem
   ser trocadas por chamadas a um servidor/banco de dados
   sem alterar o restante do site.
   ========================================================= */

const CHAVES = {
  usuarios: 'lavie_usuarios',
  sessao: 'lavie_sessao',
  agendamentos: 'lavie_agendamentos'
};

const Banco = {
  ler: function (chave, padrao) {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) : padrao;
    } catch (e) {
      return padrao;
    }
  },
  salvar: function (chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }
};

function gerarId(prefixo) {
  return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* =========================================================
   CONTAS DE CLIENTES (cadastro, login, sessão)
   ========================================================= */
const Auth = {
  // A senha nunca é salva em texto puro: guardamos apenas um "hash"
  _hash: function (email, senha) {
    const texto = email + '::' + senha + '::lavie-studio';
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < texto.length; i++) {
      const c = texto.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  },

  usuarios: function () { return Banco.ler(CHAVES.usuarios, []); },

  buscarPorEmail: function (email) {
    const alvo = email.trim().toLowerCase();
    return this.usuarios().find(function (u) { return u.email === alvo; }) || null;
  },

  cadastrar: function (dados) {
    const email = dados.email.trim().toLowerCase();
    const lista = this.usuarios();

    if (this.buscarPorEmail(email)) {
      return { ok: false, erro: 'Este e-mail já possui cadastro. Faça login para continuar.' };
    }

    const usuario = {
      id: gerarId('u'),
      nome: dados.nome.trim().replace(/\s+/g, ' '),
      email: email,
      telefone: dados.telefone || '',
      papel: dados.papel === 'funcionario' ? 'funcionario' : 'cliente',
      senhaHash: this._hash(email, dados.senha),
      criadoEm: new Date().toISOString()
    };

    lista.push(usuario);
    Banco.salvar(CHAVES.usuarios, lista);
    return { ok: true, usuario: usuario };
  },

  entrar: function (email, senha) {
    const usuario = this.buscarPorEmail(email);
    if (!usuario || usuario.senhaHash !== this._hash(usuario.email, senha)) {
      return { ok: false, erro: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' };
    }
    Banco.salvar(CHAVES.sessao, { id: usuario.id, desde: new Date().toISOString() });
    return { ok: true, usuario: usuario };
  },

  sair: function () { localStorage.removeItem(CHAVES.sessao); },

  usuarioAtual: function () {
    const sessao = Banco.ler(CHAVES.sessao, null);
    if (!sessao) return null;
    return this.usuarios().find(function (u) { return u.id === sessao.id; }) || null;
  },

  // Confere e-mail + telefone cadastrados antes de permitir a troca de senha
  verificarIdentidade: function (email, telefone) {
    const usuario = this.buscarPorEmail(email);
    if (!usuario) return false;
    return usuario.telefone.replace(/\D/g, '') === telefone.replace(/\D/g, '');
  },

  redefinirSenha: function (email, novaSenha) {
    const lista = this.usuarios();
    const alvo = email.trim().toLowerCase();
    const usuario = lista.find(function (u) { return u.email === alvo; });
    if (!usuario) return { ok: false, erro: 'Conta não encontrada.' };
    usuario.senhaHash = this._hash(usuario.email, novaSenha);
    Banco.salvar(CHAVES.usuarios, lista);
    return { ok: true };
  },

  // Usado nas páginas restritas: sem login, envia para a página de login
  exigirLogin: function (paginaAtual) {
    const usuario = this.usuarioAtual();
    if (!usuario) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(paginaAtual);
      return null;
    }
    return usuario;
  },

  // Contas da equipe têm papel "funcionario"; as demais são clientes
  ehFuncionario: function (usuario) {
    return !!usuario && usuario.papel === 'funcionario';
  },

  // Página inicial de cada tipo de conta após o login
  paginaInicial: function (usuario) {
    return this.ehFuncionario(usuario) ? 'painel.html' : 'minha-conta.html';
  },

  funcionarios: function () {
    return this.usuarios().filter(function (u) { return u.papel === 'funcionario'; });
  },

  clientes: function () {
    return this.usuarios()
      .filter(function (u) { return u.papel !== 'funcionario'; })
      .sort(function (a, b) { return a.nome.localeCompare(b.nome); });
  },

  // Remove o acesso de uma funcionária (sempre resta pelo menos uma)
  removerFuncionario: function (id) {
    if (this.funcionarios().length <= 1) {
      return { ok: false, erro: 'É preciso manter pelo menos um acesso da equipe.' };
    }
    const lista = this.usuarios().filter(function (u) { return u.id !== id; });
    Banco.salvar(CHAVES.usuarios, lista);
    return { ok: true };
  },

  alterarSenha: function (id, senhaAtual, novaSenha) {
    const lista = this.usuarios();
    const usuario = lista.find(function (u) { return u.id === id; });
    if (!usuario || usuario.senhaHash !== this._hash(usuario.email, senhaAtual)) {
      return { ok: false, erro: 'A senha atual está incorreta.' };
    }
    usuario.senhaHash = this._hash(usuario.email, novaSenha);
    Banco.salvar(CHAVES.usuarios, lista);
    return { ok: true };
  }
};

/* =========================================================
   AGENDAMENTOS
   ========================================================= */
const Agenda = {
  todos: function () { return Banco.ler(CHAVES.agendamentos, []); },

  doUsuario: function (usuarioId) {
    return this.todos()
      .filter(function (a) { return a.usuarioId === usuarioId; })
      .sort(function (a, b) { return (a.data + a.horario).localeCompare(b.data + b.horario); });
  },

  // Data e hora em que o agendamento começa (para saber se já passou)
  inicio: function (agendamento) {
    const d = Util.isoParaData(agendamento.data);
    const min = Util.minutos(agendamento.horario);
    d.setHours(Math.floor(min / 60), min % 60, 0, 0);
    return d;
  },

  // Agendamentos ativos do dia, com o intervalo e quem atende
  // (agendamentos antigos, sem profissional, bloqueiam todas)
  ocupadosNoDia: function (dataISO) {
    return this.todos()
      .filter(function (a) { return a.data === dataISO && a.status !== 'cancelado'; })
      .map(function (a) {
        const inicio = Util.minutos(a.horario);
        return {
          inicio: inicio,
          fim: inicio + a.duracao,
          profissionais: a.atribuicoes ? a.atribuicoes.map(function (x) { return x.profissional; }) : null
        };
      });
  },

  profissionalLivre: function (nome, ocupados, inicio, fim) {
    return !ocupados.some(function (o) {
      const sobrepoe = inicio < o.fim && fim > o.inicio;
      return sobrepoe && (o.profissionais === null || o.profissionais.indexOf(nome) !== -1);
    });
  },

  // Define quem atende cada categoria naquele intervalo.
  // Respeita a profissional escolhida; "sem preferência" pega a primeira livre.
  // Retorna null se alguma categoria não tiver profissional disponível.
  resolverProfissionais: function (selecao, ocupados, inicio, fim) {
    const self = this;
    const categorias = Object.keys(selecao || {});

    if (!categorias.length) {
      const conflito = ocupados.some(function (o) { return inicio < o.fim && fim > o.inicio; });
      return conflito ? null : [];
    }

    const atribuicoes = [];
    for (let i = 0; i < categorias.length; i++) {
      const categoria = categorias[i];
      const candidatas = selecao[categoria] ? [selecao[categoria]] : (PROFISSIONAIS[categoria] || []);
      const livre = candidatas.find(function (n) { return self.profissionalLivre(n, ocupados, inicio, fim); });
      if (!livre) return null;
      atribuicoes.push({ categoria: categoria, profissional: livre });
    }
    return atribuicoes;
  },

  // Lista de horários do dia com a informação "livre" ou não
  // selecao = { categoria: profissional } (opcional)
  horariosDoDia: function (dataISO, duracao, selecao) {
    const data = Util.isoParaData(dataISO);
    const expediente = SALAO.funcionamento[data.getDay()];
    if (!expediente) return [];

    const abre = Util.minutos(expediente.abre);
    const fecha = Util.minutos(expediente.fecha);
    const ocupados = this.ocupadosNoDia(dataISO);

    // No dia de hoje, só mostra horários com a antecedência mínima
    let limite = -1;
    if (dataISO === Util.hojeISO()) {
      const agora = new Date();
      limite = agora.getHours() * 60 + agora.getMinutes() + SALAO.antecedenciaMinutos;
    }

    const lista = [];
    for (let t = abre; t + duracao <= fecha; t += SALAO.intervaloMinutos) {
      if (t < limite) continue;
      const livre = this.resolverProfissionais(selecao, ocupados, t, t + duracao) !== null;
      lista.push({ horario: Util.hhmm(t), livre: livre });
    }
    return lista;
  },

  duracaoTotal: function (servicos) {
    return servicos.reduce(function (soma, s) { return soma + s.duracao; }, 0);
  },

  precoTotal: function (servicos) {
    return servicos.reduce(function (soma, s) { return soma + s.preco; }, 0);
  },

  // Cria um agendamento com um ou mais procedimentos (feitos em sequência)
  // dados: { cliente:{id,nome,email,telefone}, servicos:[], data, horario,
  //          observacao, origem:'site'|'presencial'|'whatsapp', pago, formaPagamento, criadoPor }
  criar: function (dados) {
    const servicos = dados.servicos || [];
    if (!servicos.length) return { ok: false, erro: 'Selecione pelo menos um procedimento.' };

    const duracao = this.duracaoTotal(servicos);
    const selecao = dados.profissionais || Profissionais.ajustarSelecao({}, servicos);
    const escolhido = this.horariosDoDia(dados.data, duracao, selecao).find(function (h) { return h.horario === dados.horario; });
    if (!escolhido || !escolhido.livre) {
      return { ok: false, erro: 'Este horário acabou de ficar indisponível. Por favor, escolha outro.' };
    }

    // Quem vai atender cada categoria
    const inicio = Util.minutos(dados.horario);
    const atribuicoes = this.resolverProfissionais(selecao, this.ocupadosNoDia(dados.data), inicio, inicio + duracao);
    const quemAtende = function (categoria) {
      const a = atribuicoes.find(function (x) { return x.categoria === categoria; });
      return a ? a.profissional : '';
    };

    const cliente = dados.cliente;
    const agora = new Date().toISOString();
    const agendamento = {
      id: gerarId('a'),
      codigo: 'LV-' + Date.now().toString(36).slice(-5).toUpperCase(),
      usuarioId: cliente.id || null,
      clienteNome: cliente.nome.trim(),
      clienteEmail: cliente.email || '',
      clienteTelefone: cliente.telefone || '',
      servicos: servicos.map(function (s) {
        return { id: s.id, nome: s.nome, categoria: s.categoria, duracao: s.duracao, preco: s.preco, profissional: quemAtende(s.categoria) };
      }),
      servicoNome: servicos.map(function (s) { return s.nome; }).join(' + '),
      atribuicoes: atribuicoes,
      escolheuProfissional: Object.keys(selecao).some(function (c) { return !!selecao[c]; }),
      duracao: duracao,
      preco: this.precoTotal(servicos),
      data: dados.data,
      horario: dados.horario,
      observacao: (dados.observacao || '').trim(),
      status: 'confirmado',
      origem: dados.origem || 'site',
      pago: !!dados.pago,
      formaPagamento: dados.pago ? (dados.formaPagamento || '') : '',
      pagoEm: dados.pago ? agora : null,
      criadoPor: dados.criadoPor || 'cliente',
      criadoEm: agora
    };

    const lista = this.todos();
    lista.push(agendamento);
    Banco.salvar(CHAVES.agendamentos, lista);
    return { ok: true, agendamento: agendamento };
  },

  // Usado pela equipe no painel (realizado / cancelado / confirmado)
  alterarStatus: function (id, status) {
    const lista = this.todos();
    const item = lista.find(function (a) { return a.id === id; });
    if (!item) return false;
    item.status = status;
    Banco.salvar(CHAVES.agendamentos, lista);
    return true;
  },

  // Marca como pago (com a forma de pagamento) ou desfaz o pagamento
  registrarPagamento: function (id, pago, forma) {
    const lista = this.todos();
    const item = lista.find(function (a) { return a.id === id; });
    if (!item) return false;
    item.pago = !!pago;
    item.formaPagamento = pago ? (forma || '') : '';
    item.pagoEm = pago ? new Date().toISOString() : null;
    Banco.salvar(CHAVES.agendamentos, lista);
    return true;
  },

  cancelar: function (id, usuarioId) {
    const lista = this.todos();
    const item = lista.find(function (a) { return a.id === id && a.usuarioId === usuarioId; });
    if (!item) return false;
    item.status = 'cancelado';
    item.canceladoEm = new Date().toISOString();
    Banco.salvar(CHAVES.agendamentos, lista);
    return true;
  }
};

/* =========================================================
   CONTAS DE DEMONSTRAÇÃO
   ---------------------------------------------------------
   Acessos liberados para navegar pelo site (não aparecem na tela):
     Cliente:     cliente@lavie.com  /  cliente123
     Funcionária: equipe@lavie.com   /  equipe123
   Para remover em produção, apague este bloco.
   ========================================================= */
const CONTAS_DEMO = [
  { id: 'demo-cliente', nome: 'Ana Clara Souza', email: 'cliente@lavie.com', telefone: '(11) 91234-5678', senha: 'cliente123', papel: 'cliente' },
  { id: 'demo-equipe', nome: 'Equipe La Vie', email: 'equipe@lavie.com', telefone: '(11) 98066-0805', senha: 'equipe123', papel: 'funcionario' }
];

const Demo = {
  VERSAO: 'lavie_demo_agenda_v3',

  preparar: function () {
    const lista = Auth.usuarios();
    let mudou = false;

    CONTAS_DEMO.forEach(function (c) {
      if (!lista.some(function (u) { return u.email === c.email; })) {
        lista.push({
          id: c.id, nome: c.nome, email: c.email, telefone: c.telefone, papel: c.papel,
          senhaHash: Auth._hash(c.email, c.senha),
          criadoEm: new Date().toISOString()
        });
        mudou = true;
      }
    });
    if (mudou) Banco.salvar(CHAVES.usuarios, lista);

    // Agendamentos de exemplo (criados uma única vez)
    if (!localStorage.getItem(this.VERSAO)) {
      this.criarAgendamentosExemplo();
      localStorage.setItem(this.VERSAO, '1');
    }
  },

  // Próximo dia aberto (passo 1 = para frente, -1 = para trás)
  diaAberto: function (passo, pular) {
    const d = new Date();
    let encontrados = 0;
    for (let i = 1; i < 60; i++) {
      d.setDate(d.getDate() + passo);
      if (SALAO.funcionamento[d.getDay()]) {
        if (encontrados === pular) return Util.dataParaISO(d);
        encontrados++;
      }
    }
    return Util.hojeISO();
  },

  criarAgendamentosExemplo: function () {
    const ana = { id: 'demo-cliente', nome: 'Ana Clara Souza', email: 'cliente@lavie.com', telefone: '(11) 91234-5678' };
    const bia = { id: null, nome: 'Beatriz Lima', email: '', telefone: '(11) 99876-5432' };
    const dia1 = this.diaAberto(1, 0);
    const dia2 = this.diaAberto(1, 1);
    const passado = this.diaAberto(-1, 1);

    // cliente, procedimentos, data, horário, status, observação, origem, pago, forma, profissional
    const exemplos = [
      [ana, ['corte-escova', 'tratamentos'], dia1, '10:00', 'confirmado', 'Quero manter o comprimento.', 'site', false, '', 'Camila Rocha'],
      [bia, ['coloracao'], dia1, '14:00', 'confirmado', 'Castanho iluminado.', 'whatsapp', true, 'Pix', 'Juliana Alves'],
      [ana, ['sobrancelhas'], dia2, '15:00', 'confirmado', '', 'site', false, '', 'Gabriela Souza'],
      [ana, ['manicure-pedicure'], passado, '14:00', 'realizado', '', 'presencial', true, 'Cartão de crédito', 'Fernanda Costa']
    ];

    // Remove exemplos antigos antes de recriar
    const lista = Agenda.todos().filter(function (a) { return String(a.id).indexOf('demo-ag-') !== 0; });
    exemplos.forEach(function (e, i) {
      const servicos = e[1].map(buscarServico);
      lista.push({
        id: 'demo-ag-' + i,
        codigo: 'LV-DEMO' + (i + 1),
        usuarioId: e[0].id, clienteNome: e[0].nome, clienteEmail: e[0].email, clienteTelefone: e[0].telefone,
        servicos: servicos.map(function (s) {
          return { id: s.id, nome: s.nome, categoria: s.categoria, duracao: s.duracao, preco: s.preco, profissional: e[9] };
        }),
        servicoNome: servicos.map(function (s) { return s.nome; }).join(' + '),
        atribuicoes: [{ categoria: servicos[0].categoria, profissional: e[9] }],
        escolheuProfissional: true,
        duracao: Agenda.duracaoTotal(servicos),
        preco: Agenda.precoTotal(servicos),
        data: e[2], horario: e[3], status: e[4], observacao: e[5],
        origem: e[6], pago: e[7], formaPagamento: e[8], pagoEm: e[7] ? new Date().toISOString() : null,
        criadoPor: e[6] === 'site' ? 'cliente' : 'Equipe La Vie',
        criadoEm: new Date().toISOString()
      });
    });
    Banco.salvar(CHAVES.agendamentos, lista);
  }
};

Demo.preparar();
