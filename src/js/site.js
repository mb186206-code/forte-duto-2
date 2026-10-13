/* Forte Duto — formulário de orçamento.
   Sem backend: monta a mensagem e abre o WhatsApp oficial; o envio só acontece quando o cliente toca em enviar no WhatsApp.
   Com backend: preencha form_endpoint em site.config.json; o form faz POST JSON e só confirma com resposta 2xx. */
(function () {
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // botão flutuante: aparece depois do hero (que já tem o botão principal) e some no formulário e no rodapé
  var flutuante = document.getElementById('wa-float');
  var alvos = [document.querySelector('.hero'), document.getElementById('orcamento'), document.querySelector('.site-footer')].filter(Boolean);
  if (flutuante && 'IntersectionObserver' in window && alvos.length) {
    var visiveis = new Set();
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target); });
      flutuante.classList.toggle('is-oculto', visiveis.size > 0);
    });
    alvos.forEach(function (a) { obs.observe(a); });
  } else if (flutuante) {
    flutuante.classList.remove('is-oculto');
  }

  // acordeões (Serviços e Dúvidas): abre/fecha com efeito de mola via Web Animations API.
  // Progressivo: sem JS ou sem suporte, o <details> nativo continua funcionando (instantâneo).
  var reduzMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduzMovimento && 'animate' in document.createElement('div')) {
    var mola = 'cubic-bezier(.34,1.56,.64,1)';
    document.querySelectorAll('details.servico, .faq details').forEach(function (det) {
      var resumo = det.querySelector('summary');
      var conteudo = det.querySelector(':scope > :not(summary)');
      if (!resumo || !conteudo) return;
      var animacao = null, fechando = false, abrindo = false;

      resumo.addEventListener('click', function (e) {
        e.preventDefault();
        det.style.overflow = 'hidden';
        if (fechando || !det.open) { abrir(); } else if (abrindo || det.open) { encolher(); }
      });

      function encolher() {
        fechando = true;
        var alturaInicial = det.offsetHeight + 'px';
        var alturaFinal = resumo.offsetHeight + 'px';
        if (animacao) animacao.cancel();
        animacao = det.animate({ height: [alturaInicial, alturaFinal] }, { duration: 420, easing: mola });
        animacao.onfinish = function () { finalizar(false); };
        animacao.oncancel = function () { fechando = false; };
      }

      function abrir() {
        det.style.height = det.offsetHeight + 'px';
        det.open = true;
        window.requestAnimationFrame(expandir);
      }

      function expandir() {
        abrindo = true;
        var alturaInicial = det.offsetHeight + 'px';
        var alturaFinal = (resumo.offsetHeight + conteudo.offsetHeight) + 'px';
        if (animacao) animacao.cancel();
        animacao = det.animate({ height: [alturaInicial, alturaFinal] }, { duration: 420, easing: mola });
        animacao.onfinish = function () { finalizar(true); };
        animacao.oncancel = function () { abrindo = false; };
      }

      function finalizar(aberto) {
        det.open = aberto;
        animacao = null; fechando = false; abrindo = false;
        det.style.height = ''; det.style.overflow = '';
      }
    });
  }

  var form = document.getElementById('form-orcamento');
  if (!form) return;
  var status = document.getElementById('form-status');
  var botao = form.querySelector('button[type="submit"]');
  var endpoint = form.getAttribute('data-endpoint') || '';
  var numero = form.getAttribute('data-whatsapp');

  var regras = {
    nome: function (v) { return v.trim().length >= 2 ? '' : 'Informe seu nome.'; },
    telefone: function (v) {
      var d = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
      return /^\d{10,11}$/.test(d) ? '' : 'Informe um telefone com DDD, por exemplo (21) 90000-0000.';
    },
    bairro: function (v) { return v.trim().length >= 2 ? '' : 'Informe o bairro ou a região do atendimento.'; },
    tipo: function (v) { return v ? '' : 'Escolha o tipo de problema.'; }
  };

  function mostrarErro(campo, msg) {
    var erro = document.getElementById(campo.getAttribute('aria-describedby'));
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (erro) { erro.textContent = msg; erro.hidden = !msg; }
  }

  function validar(campo) {
    var regra = regras[campo.name];
    if (!regra) return '';
    var msg = regra(campo.value);
    mostrarErro(campo, msg);
    return msg;
  }

  Object.keys(regras).forEach(function (nome) {
    var campo = form.elements[nome];
    campo.addEventListener('blur', function () { if (campo.value) validar(campo); });
    campo.addEventListener('input', function () { if (campo.getAttribute('aria-invalid') === 'true') validar(campo); });
  });

  function setStatus(html, erro) {
    status.innerHTML = html;
    status.classList.toggle('is-erro', !!erro);
    status.focus();
  }

  function mensagem(d) {
    var linhas = [
      'Olá, Forte Duto! Gostaria de um orçamento.',
      'Nome: ' + d.nome,
      'Telefone: ' + d.telefone,
      'Bairro/região: ' + d.bairro,
      'Problema: ' + d.tipo
    ];
    if (d.descricao) linhas.push('Detalhes: ' + d.descricao);
    return linhas.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.empresa.value) return; // honeypot: bots preenchem, pessoas não veem

    var primeiroErro = null;
    Object.keys(regras).forEach(function (nome) {
      if (validar(form.elements[nome]) && !primeiroErro) primeiroErro = form.elements[nome];
    });
    if (primeiroErro) {
      setStatus('Revise os campos destacados para continuar.', true);
      primeiroErro.focus();
      return;
    }

    var dados = {
      nome: form.elements.nome.value.trim(),
      telefone: form.elements.telefone.value.trim(),
      bairro: form.elements.bairro.value.trim(),
      tipo: form.elements.tipo.value,
      descricao: form.elements.descricao.value.trim()
    };

    if (endpoint) {
      botao.setAttribute('aria-busy', 'true'); botao.disabled = true;
      setStatus('Enviando sua solicitação…');
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          setStatus('Solicitação recebida. A Forte Duto vai entrar em contato pelo telefone informado.');
        })
        .catch(function () {
          setStatus('Não foi possível enviar agora. Tente de novo ou chame direto no <a href="https://wa.me/' + numero + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>.', true);
        })
        .finally(function () { botao.removeAttribute('aria-busy'); botao.disabled = false; });
      return;
    }

    var url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem(dados));
    try { window.open(url, '_blank', 'noopener'); } catch (err) { /* navegador bloqueou; o link abaixo resolve */ }
    setStatus('Sua mensagem está pronta. Se o WhatsApp não abriu sozinho, toque em <a href="' + url + '" target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp</a>. O pedido só chega à Forte Duto depois que você enviar a mensagem por lá.');
  });
})();
