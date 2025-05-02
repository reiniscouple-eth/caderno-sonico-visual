// sketch.js - Código para o Caderno Sônico-Visual (Revisado)

console.log("sketch.js carregado."); // Log 1: Verifica se o script foi lido

// Variáveis Globais de Áudio
let mic;
let fft;
let amplitude;

// Variáveis Globais de Som (Resposta da Obra)
let osc;
let reverb;
let delay;
let noise;

// Variáveis Globais de Visualização
let particles = [];
const NUM_PARTICLES = 100; // Número de partículas visuais
let energyHistory = []; // Histórico da energia (para traços)
const HISTORY_LENGTH = 50; // Comprimento do histórico

// Variáveis de Controle de Estado
let audioStarted = false; // Flag para controlar se o áudio foi iniciado
let userInteracted = false; // Flag para garantir interação antes de iniciar áudio
let silenceThreshold = 0.01; // Limiar de volume para considerar silêncio
let lastSoundTime = 0; // Tempo do último som detectado acima do limiar
let restingState = true; // Flag para indicar se a obra está em estado de repouso

// Cores
let bgColor;
let lowFreqColor;
let midFreqColor;
let highFreqColor;

//--------------------------------------------------
// SETUP - Configuração inicial
//--------------------------------------------------
function setup() {
  console.log("setup() iniciado."); // Log 2: Verifica se setup() é chamado

  // Cria o canvas ocupando toda a janela
  createCanvas(windowWidth, windowHeight);

  // Define o modo de cor HSB (Hue, Saturation, Brightness)
  // Facilita a manipulação de cores baseada em dados numéricos
  // H: 0-360, S: 0-100, B: 0-100, Alpha: 0-1
  colorMode(HSB, 360, 100, 100, 1);

  // Define as cores
  lowFreqColor = color(0, 80, 90); // Vermelho vibrante
  midFreqColor = color(120, 70, 80); // Verde
  highFreqColor = color(240, 90, 100); // Azul brilhante
  bgColor = color(0, 0, 5); // Fundo quase preto

  // Configuração da mensagem inicial e listener
  let startMessage = select('#start-message');
  if (startMessage) {
    console.log("Elemento #start-message encontrado. Anexando listener..."); // Log 3
    // Usamos mousePressed() que funciona para clique e toque
    startMessage.mousePressed(handleUserInteraction);
  } else {
    console.error("Elemento #start-message NÃO encontrado. A interação do usuário não pode ser detectada.");
    // Exibe uma mensagem alternativa se o botão não for encontrado
    fill(255); // Cor branca para o texto de erro
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Erro: Botão de início (#start-message) não encontrado no HTML.", width / 2, height / 2);
  }

  // Inicializa as partículas (estado inicial)
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }
  // Inicializa o histórico de energia
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    energyHistory.push(0);
  }

  // Define o fundo inicial
  background(bgColor);
}

//--------------------------------------------------
// handleUserInteraction - Chamada quando o usuário clica/toca
//--------------------------------------------------
function handleUserInteraction() {
    console.log("Botão/Mensagem clicado! Tentando iniciar o áudio..."); // Log 4
    if (!userInteracted) {
        userInteracted = true; // Marca que o usuário interagiu

        // Tenta iniciar o contexto de áudio do navegador (necessário após interação)
        // userStartAudio() é uma função do p5.js que lida com isso
        userStartAudio().then(() => {
            console.log("Contexto de áudio iniciado com sucesso pela interação.");
            // Se o contexto de áudio iniciou, inicializa os componentes p5.sound
            initializeAudioComponents();
        }).catch((err) => {
            // Se houver erro ao iniciar o contexto (ex: navegador bloqueou)
            console.error("Erro ao iniciar contexto de áudio após interação:", err);
            alert("Não foi possível iniciar o áudio. Verifique as permissões do navegador (pode ser necessário permitir áudio para este site) ou tente recarregar a página.");
            userInteracted = false; // Reseta a flag para permitir nova tentativa
        });
    } else {
        console.log("Interação já detectada, áudio deve estar iniciando ou já iniciado.");
    }
}

//--------------------------------------------------
// initializeAudioComponents - Inicializa os componentes p5.sound
//--------------------------------------------------
function initializeAudioComponents() {
    console.log("Inicializando componentes p5.sound...");

    try {
        // Inicializa a entrada de áudio (microfone)
        mic = new p5.AudioIn();

        // Tenta iniciar o microfone. O callback de sucesso é chamado se funcionar.
        // O callback de erro é chamado se houver problema (ex: permissão negada).
        mic.start(() => {
            // --- SUCESSO AO INICIAR MICROFONE ---
            console.log("Microfone iniciado com sucesso.");

            // Inicializa Amplitude para medir volume
            amplitude = new p5.Amplitude();
            amplitude.setInput(mic);
            amplitude.smooth(0.8); // Suavização para leituras mais estáveis

            // Inicializa FFT para análise de frequência
            fft = new p5.FFT(0.8, 1024); // Smoothing, número de bins (potência de 2)
            fft.setInput(mic);

            // --- Configuração da Resposta Sonora da Obra ---
            osc = new p5.Oscillator('sine'); // Tipo de onda: 'sine', 'triangle', 'sawtooth', 'square'
            noise = new p5.Noise('pink'); // Tipos: 'white', 'pink', 'brown'
            noise.amp(0); // Inicia sem volume
            reverb = new p5.Reverb();
            delay = new p5.Delay();

            // Conexões de áudio (importante para não criar feedback do microfone)
            // Conecta o oscilador ao delay, depois à reverb e então à saída principal
            // delay.process() args: source, delayTime (s), feedback (0-1), lowPassFreq (Hz)
            delay.process(osc, 0.5, 0.5, 2300);
            // reverb.process() args: source, reverbTime (s), decayRate (%)
            reverb.process(delay, 3, 2); // Aplica reverb ao som com delay
            // reverb.process(noise, 2, 1.5); // Aplica reverb ao ruído também (opcional)

            // Inicia geradores de som (mas sem volume inicial, controlado no draw)
            osc.start();
            osc.amp(0); // Garante que comece silencioso
            noise.start();

            // --- ATUALIZA ESTADO E UI ---
            audioStarted = true; // Marca que o áudio está pronto
            restingState = false; // Sai do estado de repouso inicial
            lastSoundTime = millis(); // Reseta o timer de silêncio

            // Esconde a mensagem inicial adicionando uma classe ao body (controlado pelo CSS)
            document.body.classList.add('audio-started');
            console.log("Componentes de áudio inicializados. Obra pronta."); // Log 5

        }, (err) => {
            // --- ERRO AO INICIAR MICROFONE ---
            console.error("Erro ao iniciar o microfone:", err);
            alert("Não foi possível acessar o microfone. Verifique as permissões na barra de endereço do navegador e permita o acesso para este site.");
            userInteracted = false; // Permite tentar novamente clicando no botão
            document.body.classList.remove('audio-started'); // Garante que a mensagem volte se falhar
        });

    } catch (error) {
        // Captura outros erros que podem ocorrer ao criar objetos p5.sound
        console.error("Erro ao criar objetos p5.sound:", error);
        alert("Ocorreu um erro inesperado ao configurar o áudio.");
        userInteracted = false;
        document.body.classList.remove('audio-started');
    }
}


//--------------------------------------------------
// DRAW - Loop principal de desenho e atualização
//--------------------------------------------------
function draw() {
  // Se o áudio não foi iniciado ainda, apenas mostra o fundo e sai
  if (!audioStarted) {
    background(bgColor);
    // Poderia adicionar texto indicando para clicar no botão
    // fill(100); // Cinza
    // textAlign(CENTER, CENTER);
    // text("Aguardando interação para iniciar...", width/2, height - 50);
    return; // Não executa o resto do draw
  }

  // --- Análise de Áudio ---
  let vol = amplitude.getLevel(); // Volume atual (0 a 1.0)
  fft.analyze(); // Calcula o espectro de frequência

  // Calcula a energia em diferentes bandas de frequência (0 a 255)
  let bass = fft.getEnergy("bass");       // Graves (~20-250 Hz)
  let lowMid = fft.getEnergy("lowMid");   // Médios-Graves (~250-500 Hz)
  let mid = fft.getEnergy("mid");         // Médios (~500-2000 Hz)
  let highMid = fft.getEnergy("highMid"); // Médios-Agudos (~2000-4000 Hz)
  let treble = fft.getEnergy("treble");   // Agudos (~4000-6000+ Hz)
  let centroid = fft.getCentroid();     // Frequência "média" ponderada pela amplitude (Hz)

  // Mapeia a energia total (aproximada pelo volume) para 0-1
  // O valor 0.5 aqui é um palpite, ajuste conforme a sensibilidade do microfone
  let totalEnergy = map(vol, 0, 0.5, 0, 1, true); // O 'true' limita o valor entre 0 e 1

  // --- Lógica de Silêncio e Estado de Repouso ---
  if (vol > silenceThreshold) {
    // Se há som acima do limiar
    lastSoundTime = millis(); // Atualiza o tempo do último som detectado
    if (restingState) {
      // Se estava em repouso, sai dele
      restingState = false;
      console.log("Saindo do estado de repouso.");
      // Não precisa mais iniciar o osc aqui, já foi iniciado
    }
  } else {
    // Se está abaixo do limiar de silêncio
    // Verifica se passou tempo suficiente em silêncio para entrar em repouso
    if (!restingState && millis() - lastSoundTime > 2000) { // 2000 ms = 2 segundos
      restingState = true;
      console.log("Entrando em estado de repouso.");
      // Transição suave para o silêncio na resposta sonora
      osc.amp(0, 0.5); // Diminui amplitude do oscilador em 0.5 segundos
      noise.amp(0, 0.5); // Diminui amplitude do ruído em 0.5 segundos
    }
  }

  // --- Atualização Visual ---
  // Fundo: muda levemente o brilho com a energia total
  let bgBrightness = map(totalEnergy, 0, 1, 5, 15); // Brilho do fundo (5 a 15)
  // Usar alpha baixo no background cria o efeito de rastro/fade das formas
  background(hue(bgColor), saturation(bgColor), bgBrightness, 0.1); // Fundo com leve rastro

  // Atualiza e desenha as partículas
  particles.forEach(p => {
    p.update(vol, bass, mid, treble, restingState); // Passa os dados de áudio e estado
    p.display(lowFreqColor, midFreqColor, highFreqColor); // Passa as cores base
  });

  // Desenha traços baseados no histórico de energia (opcional, descomente se quiser)
  // let midEnergy = map(mid, 0, 255, 0, 1);
  // energyHistory.push(midEnergy);
  // if (energyHistory.length > HISTORY_LENGTH) {
  //   energyHistory.shift(); // Remove o valor mais antigo
  // }
  // drawEnergyTrace(energyHistory, midFreqColor); // Função para desenhar o traço

  // --- Atualização Sonora (Resposta da Obra) ---
  if (!restingState) {
    // Controla o Oscilador (Tom principal)
    // Mapeia centroid (frequência média) para frequência audível do oscilador
    let oscFreq = map(centroid, 0, 10000, 100, 1200, true); // Ajuste a faixa de frequência (100-1200 Hz)
    // Mapeia volume de entrada para volume do oscilador (resposta)
    let oscVol = map(vol, silenceThreshold, 0.5, 0, 0.3, true); // Ajuste a sensibilidade (0.5) e volume máx (0.3)
    osc.freq(oscFreq, 0.1); // Suaviza a mudança de frequência (0.1s)
    osc.amp(oscVol, 0.1);   // Suaviza a mudança de volume (0.1s)

    // Controla o Ruído (Textura sonora)
    // Mapeia energia dos agudos para volume do ruído
    let noiseVol = map(treble, 100, 255, 0, 0.05, true); // Ativado por agudos mais fortes, volume baixo (0.05)
    noise.amp(noiseVol, 0.2); // Suaviza mudança de volume do ruído (0.2s)

    // Controla Efeitos (Eco e Reverberação)
    // Mapeia energia dos graves para feedback do delay (mais grave = mais eco)
    let delayFeedback = map(bass, 0, 255, 0.3, 0.7, true);
    // Mapeia médios-graves para tempo do delay (som mais grave = eco mais lento)
    let delayTime = map(lowMid, 0, 255, 0.1, 0.8, true);
    delay.feedback(delayFeedback);
    delay.delayTime(delayTime);

    // Mapeia energia total para intensidade da reverberação (som mais forte = mais reverb)
    let reverbMix = map(totalEnergy, 0, 1, 0.2, 0.8, true); // Controla o 'wet' (mix) do reverb
    reverb.drywet(reverbMix);

  }
   // Não precisamos de um 'else' aqui para desligar os sons,
   // pois a transição para 'restingState' já inicia o fade out.
}

//--------------------------------------------------
// WINDOW RESIZED - Ajusta o canvas ao redimensionar a janela
//--------------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Poderia ser necessário reajustar posições ou resetar elementos visuais aqui,
  // dependendo da complexidade da visualização.
  // Ex: particles.forEach(p => p.reset()); // Se as partículas precisarem se reposicionar
  console.log("Janela redimensionada. Canvas ajustado.");
}

//--------------------------------------------------
// CLASSE PARTICLE - Define os elementos visuais
//--------------------------------------------------
class Particle {
  constructor() {
    // Inicializa propriedades no reset para facilitar reinicialização
    this.reset();
    // Propriedades que não mudam a cada reset
    this.baseSize = random(5, 15); // Tamanho base aleatório
    this.maxSize = this.baseSize * 5; // Tamanho máximo que pode atingir
    this.color = color(0, 0, 100); // Cor inicial (branco) - será alterada no display
  }

  // Reinicia a partícula para um estado inicial
  reset() {
    // Posição inicial aleatória dentro da tela
    this.pos = createVector(random(width), random(height));
    // Velocidade inicial pequena e em direção aleatória
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.5));
    // Aceleração inicial zero
    this.acc = createVector(0, 0);
    // Tempo de vida inicial (para fade out)
    this.lifespan = 255; // Começa totalmente "viva"
    this.size = this.baseSize; // Reseta para o tamanho base
    this.active = false; // Começa inativa até o som começar
  }

  // Aplica uma força ao vetor de aceleração da partícula
  applyForce(force) {
    this.acc.add(force);
  }

  // Atualiza o estado da partícula (movimento, tamanho, vida)
  update(vol, bass, mid, treble, isResting) {

    if (isResting) {
        // Comportamento no estado de repouso
        if (this.lifespan > 0) { // Só atualiza se ainda estiver viva
            this.vel.mult(0.95); // Desacelera gradualmente
            this.lifespan -= 1; // Diminui o tempo de vida
            this.size = lerp(this.size, this.baseSize * 0.5, 0.1); // Encolhe suavemente

            // Atualiza posição mesmo em repouso para completar movimento e fade out
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0); // Limpa aceleração
            this.edges(); // Continua verificando bordas
        }
    } else {
        // Comportamento quando há som (não está em repouso)
        // Se a partícula "morreu" (lifespan <= 0), reinicia ela
        if (this.lifespan <= 0) {
            this.reset();
            this.active = true; // Marca como ativa novamente
        }

        // Mapeia o volume para o tamanho da partícula (com interpolação suave)
        let targetSize = map(vol, 0, 0.5, this.baseSize * 0.5, this.maxSize, true);
        this.size = lerp(this.size, targetSize, 0.2); // lerp suaviza a transição

        // --- Aplica forças baseadas nas frequências (exemplo) ---
        // Mapeia energia das bandas para magnitude da força
        let bassForce = map(bass, 0, 255, 0, 0.1);
        let trebleForce = map(treble, 0, 255, 0, 0.2);

        // Cria vetores de força (ex: graves empurram para baixo, agudos para cima)
        let bassVec = createVector(0, bassForce); // Força vertical para baixo
        let trebleVec = createVector(0, -trebleForce); // Força vertical para cima
        // Adiciona alguma força lateral baseada nos médios
        let midForceX = map(mid, 0, 255, -0.1, 0.1); // Força horizontal pequena
        let midVec = createVector(midForceX, 0);

        // Aplica as forças calculadas
        this.applyForce(bassVec);
        this.applyForce(trebleVec);
        this.applyForce(midVec);

        // --- Atualiza movimento (Física básica) ---
        this.vel.add(this.acc); // Adiciona aceleração à velocidade
        this.pos.add(this.vel); // Adiciona velocidade à posição
        this.acc.mult(0); // Reseta a aceleração para o próximo quadro

        // Limita a velocidade máxima para evitar que fiquem muito rápidas
        this.vel.limit(5);

        // Diminui o tempo de vida gradualmente
        this.lifespan -= 0.5;

        // Verifica as bordas da tela (efeito de loop/wrap around)
        this.edges();
    }
  }

  // Desenha a partícula na tela
  display(lowCol, midCol, highCol) {
    // Só desenha se a partícula ainda estiver "viva"
    if (this.lifespan > 0) {
        // --- Define a cor baseada na posição Y (simulando mapeamento de frequência) ---
        let yRatio = constrain(this.pos.y / height, 0, 1); // Garante que yRatio esteja entre 0 e 1
        let interpColor;
        // Interpola entre as cores base (Agudo -> Médio -> Grave) de cima para baixo
        if (yRatio < 0.33) {
            interpColor = lerpColor(highCol, midCol, map(yRatio, 0, 0.33, 0, 1));
        } else if (yRatio < 0.66) {
            interpColor = lerpColor(midCol, lowCol, map(yRatio, 0.33, 0.66, 0, 1));
        } else {
            interpColor = lowCol; // Abaixo de 0.66, usa a cor grave
        }

        // Define a opacidade (alpha) baseada no tempo de vida restante
        let alpha = map(this.lifespan, 0, 255, 0, 1); // Mapeia 0-255 para 0-1

        // Desenha a partícula (uma elipse neste caso)
        noStroke(); // Sem contorno
        // Usa a cor interpolada com a opacidade calculada
        fill(hue(interpColor), saturation(interpColor), brightness(interpColor), alpha * 0.8); // Multiplica alpha para um fade extra
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
  }

  // Verifica se a partícula saiu da tela e a reposiciona do lado oposto
  edges() {
    if (this.pos.x > width + this.size) this.pos.x = -this.size; // Saiu pela direita -> entra pela esquerda
    else if (this.pos.x < -this.size) this.pos.x = width + this.size; // Saiu pela esquerda -> entra pela direita
    if (this.pos.y > height + this.size) this.pos.y = -this.size; // Saiu por baixo -> entra por cima
    else if (this.pos.y < -this.size) this.pos.y = height + this.size; // Saiu por cima -> entra por baixo
  }

  // Método auxiliar para verificar se a partícula "morreu" (opcional, usado no update)
  isDead() {
    return this.lifespan < 0;
  }
}

//--------------------------------------------------
// Função auxiliar para desenhar traços (opcional)
//--------------------------------------------------
function drawEnergyTrace(history, traceColor) {
  push(); // Isola as configurações de estilo (cor, stroke, fill)
  noFill(); // Não preenche a forma
  stroke(traceColor); // Define a cor do traço
  strokeWeight(2); // Define a espessura do traço
  beginShape(); // Começa a desenhar uma forma conectada
  // Itera pelo histórico de energia
  for (let i = 0; i < history.length; i++) {
    // Mapeia o índice do histórico para a posição X na tela
    let x = map(i, 0, history.length - 1, 0, width);
    // Mapeia o valor da energia (0-1) para a posição Y na tela
    // Inverte o mapeamento Y para que valores maiores fiquem mais altos
    let y = map(history[i], 0, 1, height * 0.8, height * 0.2);
    vertex(x, y); // Adiciona um vértice à forma
  }
  endShape(); // Termina de desenhar a forma
  pop(); // Restaura as configurações de estilo anteriores
}
