/* =========================================================
   LA VIE STUDIO — Elementos comuns a todas as páginas
   Cabeçalho (menu), rodapé, botão flutuante do WhatsApp,
   avisos (toast) e animações suaves de entrada.
   ========================================================= */

const Layout = {
  init: function () {
    document.documentElement.classList.add('js');

    // Funcionária logada: só o painel, sem o menu público do site
    const usuario = Auth.usuarioAtual();
    if (Auth.ehFuncionario(usuario)) {
      if (document.body.dataset.page !== 'painel') {
        window.location.replace('painel.html');
        return;
      }
      document.body.classList.add('modo-equipe');
      this.renderizarCabecalhoEquipe(usuario);
      this.renderizarRodapeEquipe();
      this.configurarLinksWhatsApp();
      return;
    }

    this.renderizarCabecalho();
    this.renderizarRodape();
    this.renderizarWhatsFlutuante();
    this.configurarMenuMobile();
    this.configurarLinksWhatsApp();
    this.animarAoRolar();
  },

  logo: function (classeExtra) {
    return '<span class="logo ' + (classeExtra || '') + '">' +
      '<span class="logo-lavie">La Vie</span><span class="logo-studio">Studio</span></span>';
  },

  /* ---------- Cabeçalho ---------- */
  renderizarCabecalho: function () {
    const cabecalho = document.getElementById('site-header');
    if (!cabecalho) return;

    const pagina = document.body.dataset.page;
    const usuario = Auth.usuarioAtual();
    const contaAtiva = ['login', 'cadastro', 'conta', 'recuperar', 'painel'].indexOf(pagina) !== -1;

    const botaoConta = Auth.ehFuncionario(usuario)
      ? '<a href="painel.html" class="btn btn-contorno btn-pequeno nav-conta' + (contaAtiva ? ' ativo' : '') + '">' +
          ICONES.calendario + '<span>Painel da equipe</span></a>'
      : usuario
      ? '<a href="minha-conta.html" class="btn btn-contorno btn-pequeno nav-conta' + (contaAtiva ? ' ativo' : '') + '">' +
          ICONES.usuario + '<span>Minha conta</span></a>'
      : '<a href="login.html" class="btn btn-contorno btn-pequeno nav-conta' + (contaAtiva ? ' ativo' : '') + '">' +
          ICONES.usuario + '<span>Entrar</span></a>';

    cabecalho.className = 'site-header';
    cabecalho.innerHTML =
      '<div class="container header-inner">' +
        '<a href="index.html" aria-label="La Vie Studio — página inicial">' + this.logo() + '</a>' +
        '<button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-principal">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<nav id="menu-principal" class="nav" aria-label="Menu principal">' +
          '<ul>' +
            '<li><a href="index.html"' + (pagina === 'home' ? ' class="ativo" aria-current="page"' : '') + '>Início</a></li>' +
            '<li><a href="index.html#sobre">Sobre o salão</a></li>' +
            '<li><a href="index.html#procedimentos">Procedimentos</a></li>' +
            '<li><a href="agendamento.html"' + (pagina === 'agendamento' ? ' class="ativo" aria-current="page"' : '') + '>Agendamento</a></li>' +
          '</ul>' +
          botaoConta +
        '</nav>' +
      '</div>';
  },

  /* ---------- Cabeçalho e rodapé da equipe ---------- */
  renderizarCabecalhoEquipe: function (usuario) {
    const cabecalho = document.getElementById('site-header');
    if (!cabecalho) return;
    cabecalho.className = 'site-header';
    cabecalho.innerHTML =
      '<div class="container header-inner">' +
        '<a href="painel.html" class="marca-equipe" aria-label="Painel da equipe">' + this.logo() +
          '<span class="selo-equipe">Equipe</span></a>' +
        '<div class="header-equipe">' +
          '<span class="usuario-equipe">' + ICONES.usuario + '<span>' + Util.escapar(usuario.nome) + '</span></span>' +
          '<button type="button" class="btn btn-contorno btn-pequeno" id="btn-sair-equipe">' + ICONES.sair + '<span>Sair</span></button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-sair-equipe').addEventListener('click', function () {
      Auth.sair();
      window.location.href = 'login.html';
    });
  },

  renderizarRodapeEquipe: function () {
    const rodape = document.getElementById('site-footer');
    if (!rodape) return;
    rodape.className = 'site-footer footer-equipe';
    rodape.innerHTML = '<div class="footer-base"><div class="container">' +
      '<span>La Vie Studio · Painel da equipe</span>' +
      '<span>© ' + new Date().getFullYear() + ' La Vie Studio</span>' +
    '</div></div>';
  },

  configurarMenuMobile: function () {
    const botao = Util.$('.menu-toggle');
    const nav = Util.$('#menu-principal');
    if (!botao || !nav) return;

    function fechar() {
      nav.classList.remove('aberto');
      botao.classList.remove('aberto');
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu');
    }

    botao.addEventListener('click', function () {
      const abrir = !nav.classList.contains('aberto');
      nav.classList.toggle('aberto', abrir);
      botao.classList.toggle('aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
      botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    });

    // Fecha o menu ao clicar em um link (útil para os links com âncora)
    Util.$$('a', nav).forEach(function (link) { link.addEventListener('click', fechar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  },

  /* ---------- Rodapé ---------- */
  renderizarRodape: function () {
    const rodape = document.getElementById('site-footer');
    if (!rodape) return;

    const horarios = SALAO.textoFuncionamento.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    const ano = new Date().getFullYear();

    rodape.className = 'site-footer';
    rodape.innerHTML =
      '<div class="container footer-grid">' +
        '<div class="footer-marca">' +
          '<a href="index.html" aria-label="La Vie Studio — página inicial">' + this.logo('logo-rodape') + '</a>' +
          '<p class="footer-nome">La Vie Studio · Salão de Beleza</p>' +
          '<p>Um espaço pensado para cuidar de você com delicadeza, técnica e muito carinho.</p>' +
          '<a class="footer-insta" href="' + SALAO.instagramUrl + '" target="_blank" rel="noopener" aria-label="Instagram do La Vie Studio">' +
            ICONES.instagram + '<span>' + SALAO.instagram + '</span></a>' +
        '</div>' +
        '<div>' +
          '<h3 class="footer-titulo">Navegação</h3>' +
          '<ul class="footer-lista">' +
            '<li><a href="index.html">Início</a></li>' +
            '<li><a href="index.html#sobre">Sobre o salão</a></li>' +
            '<li><a href="index.html#procedimentos">Procedimentos</a></li>' +
            '<li><a href="agendamento.html">Agendamento</a></li>' +
            '<li><a href="login.html">Entrar</a> · <a href="cadastro.html">Cadastre-se</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h3 class="footer-titulo">Contato</h3>' +
          '<ul class="footer-lista footer-contato">' +
            '<li><a href="' + linkWhatsApp() + '" target="_blank" rel="noopener">' + ICONES.whatsapp + '<span>WhatsApp ' + SALAO.telefoneExibicao + '</span></a></li>' +
            '<li><a href="' + SALAO.instagramUrl + '" target="_blank" rel="noopener">' + ICONES.instagram + '<span>' + SALAO.instagram + '</span></a></li>' +
          '</ul>' +
          '<h3 class="footer-titulo footer-titulo-espaco">Horário de atendimento</h3>' +
          '<ul class="footer-lista footer-horarios">' + horarios + '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="footer-base"><div class="container">' +
        '<span>© ' + ano + ' La Vie Studio. Todos os direitos reservados.</span>' +
        '<span>Feito com carinho ♡</span>' +
      '</div></div>';
  },

  /* ---------- WhatsApp ---------- */
  renderizarWhatsFlutuante: function () {
    const link = document.createElement('a');
    link.className = 'whats-flutuante';
    link.href = linkWhatsApp('Olá! Gostaria de mais informações sobre o La Vie Studio.');
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Conversar pelo WhatsApp');
    link.innerHTML = ICONES.whatsapp + '<span class="whats-dica">Fale conosco</span>';
    document.body.appendChild(link);
  },

  // Qualquer elemento com data-whatsapp vira link para o WhatsApp do salão
  configurarLinksWhatsApp: function () {
    Util.$$('[data-whatsapp]').forEach(function (el) {
      el.href = linkWhatsApp(el.dataset.whatsapp || '');
      el.target = '_blank';
      el.rel = 'noopener';
    });
    Util.$$('[data-icone]').forEach(function (el) {
      if (ICONES[el.dataset.icone]) el.insertAdjacentHTML('afterbegin', ICONES[el.dataset.icone]);
    });
  },

  /* ---------- Aviso rápido (toast) ---------- */
  toast: function (mensagem, tipo) {
    let caixa = Util.$('.toast');
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.className = 'toast';
      caixa.setAttribute('role', 'status');
      document.body.appendChild(caixa);
    }
    caixa.textContent = mensagem;
    caixa.dataset.tipo = tipo || 'info';
    caixa.classList.add('visivel');
    clearTimeout(this._timerToast);
    this._timerToast = setTimeout(function () { caixa.classList.remove('visivel'); }, 3200);
  },

  /* ---------- Animação de entrada ---------- */
  animarAoRolar: function () {
    const elementos = Util.$$('.revelar');
    if (!('IntersectionObserver' in window)) {
      elementos.forEach(function (el) { el.classList.add('visivel'); });
      return;
    }
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12 });
    elementos.forEach(function (el) { observador.observe(el); });
  }
};

document.addEventListener('DOMContentLoaded', function () { Layout.init(); });
