/* =========================================================
   LA VIE STUDIO — Calendário de agendamento
   ---------------------------------------------------------
   Mostra um mês por vez, com navegação pelos próximos
   meses (SALAO.mesesDeAgenda). Desabilita dias passados,
   dias em que o salão está fechado e dias sem horário livre
   para a duração escolhida.

   Uso:
     const cal = new Calendario(elemento, {
       duracao: 60,
       aoSelecionar: function (dataISO) { ... },
       profissionais: function () { return { Cabelo: 'Camila Rocha' }; }
     });
     cal.definirDuracao(120);   // também revalida após trocar a profissional
   ========================================================= */

function Calendario(container, opcoes) {
  const hoje = new Date();
  this.container = container;
  this.duracao = opcoes.duracao || SALAO.intervaloMinutos;
  this.aoSelecionar = opcoes.aoSelecionar || function () {};
  // Função que devolve a escolha de profissionais { categoria: nome }
  this.obterProfissionais = opcoes.profissionais || function () { return {}; };
  this.selecionada = null;
  this.primeiroMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  this.ultimoMes = new Date(hoje.getFullYear(), hoje.getMonth() + SALAO.mesesDeAgenda - 1, 1);
  this.mesAtual = new Date(this.primeiroMes);

  this.container.classList.add('calendario');
  this.container.addEventListener('click', this.clique.bind(this));
  this.renderizar();
}

Calendario.SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

Calendario.prototype.temVaga = function (iso) {
  return Agenda.horariosDoDia(iso, this.duracao, this.obterProfissionais()).some(function (h) { return h.livre; });
};

// Atualiza a duração (ex.: ao escolher mais procedimentos) e mantém a data se ainda couber
Calendario.prototype.definirDuracao = function (duracao) {
  this.duracao = duracao;
  if (this.selecionada && !this.temVaga(this.selecionada)) this.selecionada = null;
  this.renderizar();
};

Calendario.prototype.limpar = function () {
  this.selecionada = null;
  this.mesAtual = new Date(this.primeiroMes);
  this.renderizar();
};

Calendario.prototype.atualizar = function () { this.renderizar(); };

Calendario.prototype.renderizar = function () {
  const ano = this.mesAtual.getFullYear();
  const mes = this.mesAtual.getMonth();
  const inicioSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hojeISO = Util.hojeISO();
  const podeVoltar = this.mesAtual > this.primeiroMes;
  const podeAvancar = this.mesAtual < this.ultimoMes;
  const nomeMes = Util.MESES[mes].charAt(0).toUpperCase() + Util.MESES[mes].slice(1);

  let html = '' +
    '<div class="cal-topo">' +
      '<button type="button" class="cal-nav" data-nav="-1" aria-label="Mês anterior"' + (podeVoltar ? '' : ' disabled') + '>‹</button>' +
      '<strong class="cal-mes" aria-live="polite">' + nomeMes + ' <span>' + ano + '</span></strong>' +
      '<button type="button" class="cal-nav" data-nav="1" aria-label="Próximo mês"' + (podeAvancar ? '' : ' disabled') + '>›</button>' +
    '</div>' +
    '<div class="cal-grade cal-semana">' +
      Calendario.SEMANA.map(function (d) { return '<span>' + d + '</span>'; }).join('') +
    '</div>' +
    '<div class="cal-grade cal-dias">';

  for (let i = 0; i < inicioSemana; i++) html += '<span class="cal-vazio"></span>';

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = new Date(ano, mes, dia);
    const iso = Util.dataParaISO(data);
    const passado = iso < hojeISO;
    const fechado = !SALAO.funcionamento[data.getDay()];
    const lotado = !passado && !fechado && !this.temVaga(iso);
    const disponivel = !passado && !fechado && !lotado;

    let classe = 'cal-dia';
    let rotulo = Util.dataPorExtenso(iso);
    if (iso === hojeISO) classe += ' hoje';
    if (fechado && !passado) { classe += ' fechado'; rotulo += ' — salão fechado'; }
    if (lotado) { classe += ' lotado'; rotulo += ' — sem horários livres'; }

    html += '<button type="button" class="' + classe + '" data-data="' + iso + '"' +
      ' aria-pressed="' + (iso === this.selecionada) + '" aria-label="' + rotulo + '"' +
      (disponivel ? '' : ' disabled') + '>' + dia + '</button>';
  }

  html += '</div>' +
    '<div class="legenda">' +
      '<span><i></i>Disponível</span>' +
      '<span><i class="sel"></i>Selecionado</span>' +
      '<span><i class="ind"></i>Indisponível</span>' +
    '</div>';

  this.container.innerHTML = html;
};

Calendario.prototype.clique = function (e) {
  const nav = e.target.closest('[data-nav]');
  if (nav && !nav.disabled) {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + Number(nav.dataset.nav), 1);
    this.renderizar();
    return;
  }

  const dia = e.target.closest('.cal-dia');
  if (dia && !dia.disabled) {
    this.selecionada = dia.dataset.data;
    this.renderizar();
    this.aoSelecionar(this.selecionada);
  }
};
