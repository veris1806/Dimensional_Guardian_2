// --- CONFIGURACIÓN: DEVS VS BUGS ---
const dicG = {
    html: { costo: 3, vida: 300, dano: 10, vel: 0 },   // Escudo estático
    css:  { costo: 4, vida: 100, dano: 25, vel: 1.5 }, // Lanza estilos
    js:   { costo: 5, vida: 100, dano: 40, vel: 2 }    // Daño masivo rápido
};

// --- PREGUNTAS NIVEL 1 (Básico Web) ---
const preguntasNivel1 = [
    { q: "¿Qué significa HTML?", opciones: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language"], correcta: 0 },
    { q: "¿Qué etiqueta se usa para crear un enlace?", opciones: ["<link>", "<a>", "<href>"], correcta: 1 },
    { q: "¿En CSS, cómo se selecciona un ID?", opciones: [".nombre", "*nombre", "#nombre"], correcta: 2 }
];

// --- VARIABLES ---
let baseHealth = 100;
let magicEnergy = 10;
let oleada = 1;
let frames = 0;
let juegoPausado = false;
let seleccionado = null;

let guardianesActivos = [];
let enemigosActivos = [];

const ANCHO_VIRTUAL = 1000; // Todo el juego calcula en base a 1000px de ancho

// --- ELEMENTOS DOM ---
const uiVida = document.getElementById('base-health');
const uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn');
const carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal');
const preguntaTexto = document.getElementById('pregunta-texto');
const contenedorRespuestas = document.getElementById('respuestas-container');

function actualizarInterfaz() {
    uiVida.textContent = Math.floor(baseHealth);
    uiEnergia.textContent = magicEnergy;

    botones.forEach(btn => {
        const tipo = btn.getAttribute('data-type');
        if (magicEnergy >= dicG[tipo].costo) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// --- SELECCIÓN E INVOCACIÓN ---
botones.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled') || juegoPausado) return;
        botones.forEach(b => b.classList.remove('selected'));
        seleccionado = btn.getAttribute('data-type');
        btn.classList.add('selected');
        carriles.forEach(l => l.classList.add('selectable'));
    });
});

carriles.forEach((lane, index) => {
    lane.addEventListener('click', (e) => {
        if (!seleccionado || juegoPausado) return;
        const datos = dicG[seleccionado];
        
        if (magicEnergy >= datos.costo) {
            magicEnergy -= datos.costo;
            
            // Calculamos la posición X en base al porcentaje del contenedor
            const rect = lane.getBoundingClientRect();
            const porcentajeClick = (e.clientX - rect.left) / rect.width;
            const xInicial = porcentajeClick * ANCHO_VIRTUAL; // Posición virtual

            const personajeObj = {
                visual: crearVisual(lane, true),
                vida: datos.vida,
                vidaMax: datos.vida,
                dano: datos.dano,
                vel: datos.vel,
                x: xInicial,
                lane: index + 1
            };

            guardianesActivos.push(personajeObj);
            seleccionado = null;
            botones.forEach(b => b.classList.remove('selected'));
            carriles.forEach(l => l.classList.remove('selectable'));
            actualizarInterfaz();
        }
    });
});

function crearVisual(padre, esGuardian) {
    const div = document.createElement('div');
    div.classList.add('entidad');
    div.innerHTML = `
        <div class="health-bar-container"><div class="health-bar-fill"></div></div>
        <div class="imagen-personaje ${esGuardian ? '' : 'enemigo-visual'}"></div>
    `;
    padre.appendChild(div);
    return div;
}

// --- SISTEMA DE TRIVIA ---
function lanzarTrivia() {
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    
    // Escoger pregunta aleatoria del nivel 1
    const indice = Math.floor(Math.random() * preguntasNivel1.length);
    const preguntaObj = preguntasNivel1[indice];
    
    preguntaTexto.textContent = preguntaObj.q;
    contenedorRespuestas.innerHTML = '';
    
    preguntaObj.opciones.forEach((opcion, i) => {
        const btn = document.createElement('button');
        btn.classList.add('btn-respuesta');
        btn.textContent = opcion;
        btn.onclick = () => procesarRespuesta(i === preguntaObj.correcta);
        contenedorRespuestas.appendChild(btn);
    });
}

function procesarRespuesta(esCorrecta) {
    if (esCorrecta) {
        alert("¡Correcto! Has ganado 8 tazas de café ☕");
        magicEnergy += 8;
    } else {
        alert("Incorrecto. El código falló. No ganas café.");
    }
    actualizarInterfaz();
    modalTrivia.classList.add('oculto');
    juegoPausado = false;
    requestAnimationFrame(gameLoop); // Reanudar juego
}

// --- ENEMIGOS (Bugs) ---
function spawnEnemigo() {
    const carrilRandom = Math.floor(Math.random() * 3);
    const padre = carriles[carrilRandom];
    
    const enemigoObj = {
        visual: crearVisual(padre, false),
        vida: 100,
        vidaMax: 100,
        dano: 15,
        vel: 0.8,
        x: ANCHO_VIRTUAL - 50, // Nace al borde derecho virtual
        lane: carrilRandom + 1
    };
    enemigosActivos.push(enemigoObj);
}

// --- BUCLE PRINCIPAL ---
function gameLoop() {
    if (juegoPausado) return; // Si hay trivia, el juego se congela
    frames++;
    
    // Ganas 1 de café lentamente
    if (frames % 180 === 0 && magicEnergy < 20) {
        magicEnergy++;
        actualizarInterfaz();
    }

    // Spawn de enemigos
    if (frames % 200 === 0) spawnEnemigo();

    // Evento de Trivia cada cierto tiempo (ej. cada 800 frames)
    if (frames % 800 === 0) lanzarTrivia();

    // Movimiento y colisiones
    [...guardianesActivos, ...enemigosActivos].forEach(entidad => {
        // Traducimos el X virtual a porcentaje real para CSS
        entidad.visual.style.left = (entidad.x / ANCHO_VIRTUAL * 100) + '%';
    });

    // Colisiones (lógica similar a la tuya, ajustada para la resolución virtual)
    guardianesActivos.forEach((g, i) => {
        let enCombate = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 40) {
                enCombate = true;
                e.vida -= g.dano / 60;
                g.vida -= e.dano / 60;
                
                e.visual.querySelector('.health-bar-fill').style.width = (e.vida / e.vidaMax) * 100 + "%";
                g.visual.querySelector('.health-bar-fill').style.width = (g.vida / g.vidaMax) * 100 + "%";
            }
        });

        if (!enCombate) g.x += g.vel;

        if (g.vida <= 0 || g.x > ANCHO_VIRTUAL) {
            g.visual.remove();
            guardianesActivos.splice(i, 1);
        }
    });

    enemigosActivos.forEach((e, i) => {
        let enCombate = false;
        guardianesActivos.forEach(g => {
            if (e.lane === g.lane && Math.abs(e.x - g.x) < 40) enCombate = true;
        });

        if (!enCombate) e.x -= e.vel;

        if (e.x <= 0) {
            baseHealth -= 5;
            actualizarInterfaz();
            e.visual.remove();
            enemigosActivos.splice(i, 1);
        } else if (e.vida <= 0) {
            e.visual.remove();
            enemigosActivos.splice(i, 1);
        }
    });

    if (baseHealth <= 0) {
        alert("¡El servidor colapsó por exceso de Bugs! (Game Over)");
        location.reload();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// INICIAR JUEGO
actualizarInterfaz();
requestAnimationFrame(gameLoop);
