/* =========================================================
   LA VIE STUDIO — Página inicial
   Monta os cartões de procedimentos e o filtro por categoria.
   ========================================================= */

const Home = {
  categoriaAtual: 'Todos',

  init: function () {
    this.renderizarFiltros();
    this.renderizarServicos();
  },

  renderizarFiltros: function () {
    const caixa = document.getElementById('filtros');
    if (!caixa) return;

    const categorias = ['Todos'];
    SERVICOS.forEach(function (s) {
      if (categorias.indexOf(s.categoria) === -1) categorias.push(s.categoria);
    });

    caixa.innerHTML = categorias.map(function (c, i) {
      return '<button type="button" class="filtro' + (i === 0 ? ' ativo' : '') + '" data-categoria="' + c + '" aria-pressed="' + (i === 0) + '">' + c + '</button>';
    }).join('');

    const self = this;
    caixa.addEventListener('click', function (e) {
      const botao = e.target.closest('.filtro');
      if (!botao) return;
      Util.$$('.filtro', caixa).forEach(function (b) {
        b.classList.toggle('ativo', b === botao);
        b.setAttribute('aria-pressed', String(b === botao));
      });
      self.categoriaAtual = botao.dataset.categoria;
      self.renderizarServicos();
    });
  },

  cartao: function (servico) {
    return '' +
      '<article class="card-servico">' +
        '<div class="ilustracao tom-' + servico.tom + '">' + ICONES[servico.icone] + '</div>' +
        '<div class="card-corpo">' +
          '<span class="card-categoria">' + servico.categoria + '</span>' +
          '<h3>' + servico.nome + '</h3>' +
          '<p>' + servico.descricao + '</p>' +
          '<div class="card-meta">' +
            '<span>' + ICONES.relogio + Util.formatarDuracao(servico.duracao) + '</span>' +
            '<span class="preco"><small>a partir de</small><strong>' + Util.formatarPreco(servico.preco) + '</strong></span>' +
          '</div>' +
          '<a href="agendamento.html?servico=' + servico.id + '" class="btn btn-contorno btn-pequeno btn-bloco">Agendar este cuidado</a>' +
        '</div>' +
      '</article>';
  },

  renderizarServicos: function () {
    const grid = document.getElementById('grid-servicos');
    if (!grid) return;

    const categoria = this.categoriaAtual;
    const lista = SERVICOS.filter(function (s) {
      return categoria === 'Todos' || s.categoria === categoria;
    });

    grid.innerHTML = lista.map(this.cartao).join('');
  }
};

document.addEventListener('DOMContentLoaded', function () { Home.init(); });
