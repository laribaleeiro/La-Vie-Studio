/* =========================================================
   LA VIE STUDIO — Escolha da profissional
   ---------------------------------------------------------
   A seleção é um objeto { categoria: nome }.
   Nome vazio ('') = "Sem preferência".
   Ex.: { Cabelo: 'Camila Rocha', Unhas: '' }
   ========================================================= */

const Profissionais = {
  // Categorias (sem repetir) dos procedimentos escolhidos
  categorias: function (servicos) {
    const lista = [];
    servicos.forEach(function (s) {
      if (lista.indexOf(s.categoria) === -1) lista.push(s.categoria);
    });
    return lista;
  },

  // Mantém as escolhas das categorias que continuam e adiciona as novas
  ajustarSelecao: function (selecao, servicos) {
    const nova = {};
    this.categorias(servicos).forEach(function (c) { nova[c] = selecao[c] || ''; });
    return nova;
  },

  iniciais: function (nome) {
    const partes = nome.split(' ');
    return (partes[0].charAt(0) + (partes[1] ? partes[1].charAt(0) : '')).toUpperCase();
  },

  // Botões de escolha para cada categoria
  html: function (servicos, selecao) {
    const self = this;
    return this.categorias(servicos).map(function (categoria) {
      const nomes = PROFISSIONAIS[categoria] || [];
      const atual = selecao[categoria] || '';
      const procedimentos = servicos
        .filter(function (s) { return s.categoria === categoria; })
        .map(function (s) { return s.nome; }).join(', ');

      const opcao = function (nome) {
        const rotulo = nome || 'Sem preferência';
        const avatar = nome ? self.iniciais(nome) : '✦';
        return '<button type="button" class="prof-opcao" data-categoria="' + categoria + '" data-profissional="' + nome + '"' +
          ' aria-pressed="' + (atual === nome) + '">' +
          '<span class="prof-avatar' + (nome ? '' : ' livre') + '">' + avatar + '</span>' +
          '<span class="prof-nome">' + rotulo + (nome ? '' : '<small>quem estiver livre</small>') + '</span>' +
        '</button>';
      };

      return '' +
        '<div class="prof-grupo">' +
          '<p class="prof-titulo"><strong>' + categoria + '</strong><span>' + procedimentos + '</span></p>' +
          '<div class="prof-opcoes">' + opcao('') + nomes.map(opcao).join('') + '</div>' +
        '</div>';
    }).join('');
  },

  // Texto para o resumo (antes de confirmar)
  descreverSelecao: function (selecao) {
    return Object.keys(selecao).map(function (c) {
      return (selecao[c] || 'Sem preferência') + ' <small>(' + c + ')</small>';
    }).join('<br>');
  },

  // Texto de quem vai atender (depois de confirmado)
  descreverAtribuicoes: function (agendamento, separador) {
    if (!agendamento.atribuicoes || !agendamento.atribuicoes.length) return '';
    return agendamento.atribuicoes.map(function (a) {
      return a.profissional + ' (' + a.categoria + ')';
    }).join(separador || ', ');
  },

  todas: function () {
    const lista = [];
    Object.keys(PROFISSIONAIS).forEach(function (c) {
      PROFISSIONAIS[c].forEach(function (n) { lista.push({ nome: n, categoria: c }); });
    });
    return lista;
  }
};
