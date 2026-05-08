// --- CONFIGURACIÓN DE TROPAS ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 10, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 25, vel: 1.0 },
    mago:    { costo: 5, vida: 100, dano: 40, vel: 0.8 },
    ninja:   { costo: 6, vida: 150, dano: 60, vel: 1.5 } 
};

// --- PREGUNTAS NIVEL 1: CIBERSEGURIDAD DISFRAZADA ---
const preguntasNivel1 = [
    { 
        q: "Un duende te ofrece un mapa del tesoro, pero pide la llave de tu fortaleza por 'solo un minuto' para copiarlo. ¿Qué haces?", 
        opciones: ["Le doy la llave rápido", "Lo ignoro, es una trampa", "Le doy una copia mágica"], 
        correcta: 1 
    },
    { 
        q: "El herrero te regala una espada gratis, pero esta te obliga a decirle en voz alta a quién vas a visitar. ¿Qué haces?", 
        opciones: ["La uso, ¡es gratis!", "La destruyo, no respeto mi privacidad", "Se la doy a mi enemigo"], 
        correcta: 1 
    }
];

// --- VARIABLES GLOBALES ---
let baseHealth = 100;
let enemyBaseHealth = 200; // Vida del castillo enemigo
let magicEnergy = 10;
let frames = 0;
let juegoPausado = false;
let seleccionado = null;
let guardianesActivos = [];
let enemigosActivos = [];
let jefeActivo = null; // Para rastrear al jefe
const ANCHO_VIRTUAL = 1000;

// --- ELEMENTOS DOM ---
const uiVida = document.getElementById('base-health');
const uiVidaEnemiga = document.getElementById('enemy-base-health');
const uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn');
const carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal');
const preguntaTexto = document.getElementById('pregunta-texto');
const contenedorRespuestas = document.getElementById('respuestas-container');
const btnCofre = document.getElementById('cofre-btn');

function actualizarInterfaz() {
    uiVida.textContent = Math.floor(baseHealth);
    uiVidaEnemiga.textContent = Math.floor(enemyBaseHealth);
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

// --- INVOCACIÓN DE TROPAS (NUESTRAS) ---
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
            
            // Nuestras tropas siempre nacen a la izquierda (x = 50)
            const personajeObj = {
                visual: crearVisual(lane, true, false),
                vida: datos.vida, vidaMax: datos.vida,
                dano: datos.dano, vel: datos.vel,
                x: 50, lane: index + 1, esGuardian: true
            };

            guardianesActivos.push(personajeObj);
            seleccionado = null;
            botones.forEach(b => b.classList.remove('selected'));
            carriles.forEach(l => l.classList.remove('selectable'));
            actualizarInterfaz();
        }
    });
});

function crearVisual(padre, esGuardian, esJefe) {
    const div = document.createElement('div');
    div.classList.add('entidad');
    let clasesAdicionales = esGuardian ? '' : 'enemigo-visual';
    if (esJefe) clasesAdicionales += ' jefe-visual escudo-activo'; // El jefe nace con escudo

    div.innerHTML = `
        <div class="health-bar-container"><div class="health-bar-fill"></div></div>
        <div class="imagen-personaje ${clasesAdicionales}"></div>
    `;
    padre.appendChild(div);
    return div;
}

// --- ENEMIGOS Y EL JEFE ---
function spawnEnemigo(esJefe = false) {
    const carrilRandom = Math.floor(Math.random() * 3);
    const padre = carriles[carrilRandom];
    
    // Si es jefe es más fuerte y tiene escudo
    const enemigoObj = {
        visual: crearVisual(padre, false, esJefe),
        vida: esJefe ? 800 : 100,
        vidaMax: esJefe ? 800 : 100,
        dano: esJefe ? 30 : 15,
        vel: esJefe ? 0.3 : 0.8, // El jefe camina lento
        x: ANCHO_VIRTUAL - 50, // Nacen a la derecha
        lane: carrilRandom + 1,
        esGuardian: false,
        tieneEscudo: esJefe // Propiedad especial
    };
    
    enemigosActivos.push(enemigoObj);
    
    if (esJefe) {
        jefeActivo = enemigoObj;
        btnCofre.classList.remove('oculto'); // Aparece el cofre cuando sale el jefe
    }
}

// --- SISTEMA DEL COFRE Y TRIVIA ---
btnCofre.addEventListener('click', () => {
    if(juegoPausado) return;
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    
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
});

function procesarRespuesta(esCorrecta) {
    modalTrivia.classList.add('oculto');
    juegoPausado = false;
    btnCofre.classList.add('oculto'); // Desaparece el cofre

    if (esCorrecta && jefeActivo) {
        alert("¡Respuesta Correcta! El escudo del Jefe se ha roto.");
        jefeActivo.tieneEscudo = false;
        jefeActivo.visual.querySelector('.imagen-personaje').classList.remove('escudo-activo');
    } else {
        alert("¡Fallaste! El Jefe sigue siendo casi invencible.");
    }
    requestAnimationFrame(gameLoop);
}

// --- BUCLE PRINCIPAL (El Choque de Clanes) ---
function gameLoop() {
    if (juegoPausado) return;
    frames++;
    
    // Ganar energía
    if (frames % 150 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }

    // Spawn normal
    if (frames % 250 === 0 && frames < 2000) spawnEnemigo(false);
    
    // Spawn del Jefe (Momento Crítico)
    if (frames === 2000) spawnEnemigo(true);

    // Mover y dibujar entidades
    [...guardianesActivos, ...enemigosActivos].forEach(entidad => {
        entidad.visual.style.left = (entidad.x / ANCHO_VIRTUAL * 100) + '%';
    });

    // Colisiones
    guardianesActivos.forEach((g, i) => {
        let enCombate = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 50) {
                enCombate = true;
                
                // Si el enemigo tiene escudo (Jefe), recibe poquísimo daño
                let danoAEnemigo = e.tieneEscudo ? (g.dano * 0.1) : g.dano;
                
                e.vida -= danoAEnemigo / 60; 
                g.vida -= e.dano / 60;
                
                e.visual.querySelector('.health-bar-fill').style.width = (e.vida / e.vidaMax) * 100 + "%";
                g.visual.querySelector('.health-bar-fill').style.width = (g.vida / g.vidaMax) * 100 + "%";
            }
        });

        // Tropas avanzan a la derecha
        if (!enCombate) g.x += g.vel;

        // Si llegan a la base enemiga
        if (g.x > ANCHO_VIRTUAL) {
            enemyBaseHealth -= g.dano;
            g.vida = 0; // Se sacrifica al golpear la base
            actualizarInterfaz();
        }

        if (g.vida <= 0) {
            g.visual.remove();
            guardianesActivos.splice(i, 1);
        }
    });

    enemigosActivos.forEach((e, i) => {
        let enCombate = false;
        guardianesActivos.forEach(g => {
            if (e.lane === g.lane && Math.abs(e.x - g.x) < 50) enCombate = true;
        });

        // Enemigos avanzan a la izquierda
        if (!enCombate) e.x -= e.vel;

        // Si llegan a tu base
        if (e.x <= 0) {
            baseHealth -= 20;
            e.vida = 0;
            actualizarInterfaz();
        }

        if (e.vida <= 0) {
            if (e === jefeActivo) jefeActivo = null; // Si muere el jefe
            e.visual.remove();
            enemigosActivos.splice(i, 1);
        }
    });

    // Condiciones de Victoria/Derrota
    if (baseHealth <= 0) {
        alert("¡Tu fortaleza cayó! Game Over.");
        location.reload();
    } else if (enemyBaseHealth <= 0) {
        alert("¡Destruiste la base enemiga! Nivel 1 Completado.");
        location.reload(); // Aquí luego mandaremos al nivel 2
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// Iniciar
actualizarInterfaz();
requestAnimationFrame(gameLoop);
