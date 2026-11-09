/* =========================================================
   LA VIE STUDIO — Dados do salão e catálogo de procedimentos
   ---------------------------------------------------------
   Edite este arquivo para alterar horários de funcionamento,
   contatos, preços, durações e descrições dos serviços.
   ========================================================= */

const SALAO = {
  nome: 'La Vie Studio',
  whatsapp: '5511980660805',
  telefoneExibicao: '(11) 98066-0805',
  instagram: '@laviestudios',
  instagramUrl: 'https://www.instagram.com/laviestudios/',

  // Horário de funcionamento por dia da semana
  // 0 = domingo, 1 = segunda ... 6 = sábado  |  null = fechado
  funcionamento: {
    0: { abre: '07:00', fecha: '15:00' },
    1: null,
    2: { abre: '07:00', fecha: '20:00' },
    3: { abre: '07:00', fecha: '20:00' },
    4: { abre: '07:00', fecha: '20:00' },
    5: { abre: '07:00', fecha: '20:00' },
    6: { abre: '07:00', fecha: '20:00' }
  },
  textoFuncionamento: ['Terça a sábado: 7h às 20h', 'Domingo: 7h às 15h', 'Segunda: fechado'],

  intervaloMinutos: 30,     // intervalo entre horários exibidos
  mesesDeAgenda: 12,        // quantos meses à frente o calendário permite agendar
  antecedenciaMinutos: 60   // antecedência mínima para agendar no mesmo dia
};

/* Link do WhatsApp, com mensagem opcional já preenchida */
function linkWhatsApp(mensagem) {
  const base = 'https://wa.me/' + SALAO.whatsapp;
  return mensagem ? base + '?text=' + encodeURIComponent(mensagem) : base;
}

/* Catálogo de procedimentos
   duracao em minutos | preco = valor "a partir de" (R$)
   icone = chave do objeto ICONES (js/icones.js)
   tom = cor de fundo da ilustração (rosa | nude | blush) */
const SERVICOS = [
  {
    id: 'corte-escova',
    nome: 'Corte & Escova',
    categoria: 'Cabelo',
    icone: 'tesoura',
    tom: 'rosa',
    duracao: 60,
    preco: 120,
    descricao: 'Corte personalizado, pensado para o formato do seu rosto e o seu estilo, finalizado com escova modeladora.',
    detalhes: ['Consultoria de visagismo', 'Lavagem com produtos profissionais', 'Escova modeladora inclusa']
  },
  {
    id: 'coloracao',
    nome: 'Coloração',
    categoria: 'Cabelo',
    icone: 'coloracao',
    tom: 'nude',
    duracao: 120,
    preco: 220,
    descricao: 'Cor uniforme e luminosa, da cobertura de fios brancos à mudança de tom, sempre cuidando da saúde dos fios.',
    detalhes: ['Teste de mecha e diagnóstico', 'Coloração com tratamento protetor', 'Finalização com escova']
  },
  {
    id: 'mechas',
    nome: 'Mechas & Luzes',
    categoria: 'Cabelo',
    icone: 'mechas',
    tom: 'blush',
    duracao: 180,
    preco: 380,
    descricao: 'Morena iluminada, balayage e luzes sob medida para trazer luz e movimento com acabamento natural.',
    detalhes: ['Técnicas de balayage e babylights', 'Tonalização inclusa', 'O tempo pode variar conforme o comprimento']
  },
  {
    id: 'tratamentos',
    nome: 'Tratamentos Capilares',
    categoria: 'Cabelo',
    icone: 'hidratacao',
    tom: 'rosa',
    duracao: 60,
    preco: 140,
    descricao: 'Hidratação, nutrição e reconstrução profundas para devolver brilho, maciez e força aos fios.',
    detalhes: ['Diagnóstico capilar', 'Cronograma personalizado', 'Finalização inclusa']
  },
  {
    id: 'manicure-pedicure',
    nome: 'Manicure & Pedicure',
    categoria: 'Unhas',
    icone: 'unhas',
    tom: 'nude',
    duracao: 90,
    preco: 90,
    descricao: 'Cuidado completo das mãos e dos pés, com esmaltação impecável e materiais esterilizados.',
    detalhes: ['Cutilagem delicada', 'Esmaltação tradicional ou em gel', 'Hidratação de mãos e pés']
  },
  {
    id: 'sobrancelhas',
    nome: 'Design de Sobrancelhas',
    categoria: 'Olhar',
    icone: 'sobrancelha',
    tom: 'blush',
    duracao: 30,
    preco: 60,
    descricao: 'Design que respeita a sua fisionomia e valoriza o olhar, com opção de henna para preencher falhas.',
    detalhes: ['Mapeamento facial', 'Pinça e/ou linha', 'Henna opcional']
  },
  {
    id: 'cilios',
    nome: 'Extensão de Cílios',
    categoria: 'Olhar',
    icone: 'cilios',
    tom: 'rosa',
    duracao: 120,
    preco: 200,
    descricao: 'Cílios alongados fio a fio ou em volume, com efeito natural ou marcante e aplicação confortável.',
    detalhes: ['Técnica fio a fio ou volume', 'Fios leves e hipoalergênicos', 'Manutenção a cada 15–20 dias']
  },
  {
    id: 'maquiagem',
    nome: 'Maquiagem',
    categoria: 'Maquiagem',
    icone: 'maquiagem',
    tom: 'nude',
    duracao: 60,
    preco: 180,
    descricao: 'Make para eventos, festas e ocasiões especiais, com produtos de alta performance e longa duração.',
    detalhes: ['Preparação de pele', 'Cílios postiços inclusos', 'Ideal para noivas, formandas e convidadas']
  }
];

/* Profissionais de cada categoria (nomes demonstrativos)
   A cliente pode escolher uma profissional por categoria
   ou "Sem preferência" (o sistema escolhe quem estiver livre). */
const PROFISSIONAIS = {
  Cabelo: ['Camila Rocha', 'Juliana Alves', 'Patrícia Nunes'],
  Unhas: ['Fernanda Costa', 'Larissa Martins', 'Bianca Teixeira'],
  Olhar: ['Gabriela Souza', 'Isabela Ramos', 'Mariana Duarte'],
  Maquiagem: ['Renata Moura', 'Letícia Campos', 'Vanessa Freitas']
};

function buscarServico(id) {
  return SERVICOS.find(function (s) { return s.id === id; }) || null;
}
