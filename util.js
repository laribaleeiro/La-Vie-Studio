/* =========================================================
   LA VIE STUDIO — Funções utilitárias (datas, formatação,
   validação e ajudantes de formulário)
   ========================================================= */

const Util = {
  DIAS: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  DIAS_CURTOS: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  MESES: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  MESES_CURTOS: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],

  /* ---------- Seletores ---------- */
  $: function (seletor, contexto) { return (contexto || document).querySelector(seletor); },
  $$: function (seletor, contexto) { return Array.from((contexto || document).querySelectorAll(seletor)); },

  /* ---------- Datas e horários ---------- */
  doisDigitos: function (n) { return String(n).padStart(2, '0'); },

  // Date -> "2026-11-13" (sempre no horário local)
  dataParaISO: function (data) {
    return data.getFullYear() + '-' + this.doisDigitos(data.getMonth() + 1) + '-' + this.doisDigitos(data.getDate());
  },

  // "2026-11-13" -> Date (local)
  isoParaData: function (iso) {
    const partes = iso.split('-').map(Number);
    return new Date(partes[0], partes[1] - 1, partes[2]);
  },

  hojeISO: function () { return this.dataParaISO(new Date()); },

  minutos: function (hhmm) {
    const p = hhmm.split(':').map(Number);
    return p[0] * 60 + p[1];
  },

  hhmm: function (min) {
    return this.doisDigitos(Math.floor(min / 60)) + ':' + this.doisDigitos(min % 60);
  },

  dataPorExtenso: function (iso) {
    const d = this.isoParaData(iso);
    return this.DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + this.MESES[d.getMonth()] + ' de ' + d.getFullYear();
  },

  dataCurta: function (iso) {
    const p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  },

  /* ---------- Formatação ---------- */
  formatarPreco: function (valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatarDuracao: function (min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return m + ' min';
    return m ? h + 'h' + this.doisDigitos(m) : h + 'h';
  },

  mascaraTelefone: function (valor) {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  },

  primeiroNome: function (nome) { return (nome || '').trim().split(/\s+/)[0]; },

  // Evita que textos digitados pelo usuário virem HTML
  escapar: function (texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  },

  /* ---------- Validação ---------- */
  emailValido: function (email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); },

  telefoneValido: function (tel) {
    const d = tel.replace(/\D/g, '');
    return d.length === 10 || d.length === 11;
  },

  /* ---------- URL ---------- */
  param: function (nome) { return new URLSearchParams(window.location.search).get(nome); },

  // Só permite redirecionar para páginas internas do próprio site
  destinoSeguro: function (url, padrao) {
    return url && /^[a-z-]+\.html(\?[\w=&%-]*)?$/i.test(url) ? url : padrao;
  },

  /* ---------- Mensagem passada entre páginas ---------- */
  flash: {
    definir: function (dados) { sessionStorage.setItem('lavie_flash', JSON.stringify(dados)); },
    ler: function () {
      const valor = sessionStorage.getItem('lavie_flash');
      sessionStorage.removeItem('lavie_flash');
      try { return valor ? JSON.parse(valor) : null; } catch (e) { return null; }
    }
  }
};

/* =========================================================
   Ajudantes de formulário
   ========================================================= */
const Form = {
  erro: function (input, mensagem) {
    const campo = input.closest('.campo');
    campo.classList.add('erro');
    campo.querySelector('.msg-erro').textContent = mensagem;
    input.setAttribute('aria-invalid', 'true');
  },

  limpar: function (form) {
    Util.$$('.campo.erro', form).forEach(function (c) { c.classList.remove('erro'); });
    Util.$$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
  },

  // Remove o erro do campo assim que a cliente volta a digitar
  limparAoDigitar: function (form) {
    Util.$$('input', form).forEach(function (input) {
      input.addEventListener('input', function () {
        const campo = input.closest('.campo');
        if (campo) campo.classList.remove('erro');
        input.removeAttribute('aria-invalid');
      });
    });
  },

  alerta: function (elemento, tipo, mensagem) {
    elemento.className = 'alerta alerta-' + tipo;
    elemento.textContent = mensagem;
    elemento.hidden = false;
  },

  // Botão "olho" para mostrar/ocultar senha
  configurarVerSenha: function () {
    Util.$$('.ver-senha').forEach(function (botao) {
      botao.innerHTML = ICONES.olho;
      botao.addEventListener('click', function () {
        const input = botao.parentElement.querySelector('input');
        const mostrar = input.type === 'password';
        input.type = mostrar ? 'text' : 'password';
        botao.classList.toggle('ativo', mostrar);
        botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      });
    });
  },

  configurarMascaraTelefone: function (input) {
    input.addEventListener('input', function () {
      input.value = Util.mascaraTelefone(input.value);
    });
  }
};
