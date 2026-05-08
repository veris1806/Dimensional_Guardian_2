// --- CONFIGURACIÓN DE TROPAS ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 10, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 25, vel: 1.0 },
    mago:    { costo: 5, vida: 100, dano: 40, vel: 0.8 },
    ninja:   { costo: 6, vida: 150, dano: 60, vel: 1.5 } 
};

const preguntasNivel1 = [
    { q: "Un duende te ofrece un mapa del tesoro, pero pide la llave de tu fortaleza por 'solo un minuto' para copiarlo. ¿Qué haces?", opciones: ["Le doy la llave rápido", "Lo ignoro, es una trampa", "Le doy una copia mágica"], correcta: 1 },
    { q: "El herrero te regala una espada gratis, pero esta te obliga a decirle en voz alta a quién vas a visitar. ¿Qué haces?", opciones: ["La uso, ¡es gratis!", "La destruyo, no respeto privacidad", "Se la doy a mi enemigo"], correcta: 1 }
];

// --- VARIABLES GLOBALES ---
let baseHealth = 100;
let enemyBaseHealth = 200; 
let magicEnergy = 10;
let frames = 0;
let juegoPausado = true; // Empieza pausado por la pantalla de título
let juegoIniciado = false;
let seleccionado = null;
let guardianesActivos = [];
let enemigosActivos = [];
let jefeActivo = null; 
const ANCHO_VIRTUAL = 1000;

// EL TIEMPO DEL JEFE (1 Minuto = 3600 frames aprox a 60fps)
const TIEMPO_JEFE = 3600; 

// --- ELEMENTOS DOM ---
const uiVida = document.getElementById('base-health');
const uiVidaEnemiga = document.getElementById('enemy-base-health');
const uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn');
const carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal');
const btnCofre = document.getElementById('cofre-btn');
const pantallaTitulo = document.getElementById('level-title-screen');

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

// --- CINEMÁTICA DE INICIO ---
setTimeout(() => {
    pantallaTitulo.style.opacity = '0'; // Se desvanece
    setTimeout(() => {
        pantallaTitulo.style.display = 'none'; // Desaparece
        juegoPausado = false;
        juegoIniciado = true;
        actualizarInterfaz();
        requestAnimationFrame(gameLoop); // Arranca el juego
    }, 800);
}, 3000); // 3 segundos de espera

// --- INVOCACIÓN DE TROPAS ---
botones.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled') || juegoPausado || !juegoIniciado) return;
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
            
            const personajeObj = {
                visual: crearVisual(lane, true, false),
                vida: datos.vida, vidaMax: datos.vida, dano: datos.dano, vel: datos.vel,
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
    if (esJefe) clasesAdicionales += ' jefe-visual escudo-activo';

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
    
    const enemigoObj = {
        visual: crearVisual(padre, false, esJefe),
        vida: esJefe ? 800 : 100, vidaMax: esJefe ? 800 : 100,
        dano: esJefe ? 30 : 15, vel: esJefe ? 0.3 : 0.8,
        x: ANCHO_VIRTUAL - 50, lane: carrilRandom + 1, esGuardian: false, tieneEscudo: esJefe 
    };
    
    enemigosActivos.push(enemigoObj);
    
    if (esJefe) {
        jefeActivo = enemigoObj;
        btnCofre.classList.remove('oculto');
    }
}

// --- SISTEMA DEL COFRE ---
btnCofre.addEventListener('click', () => {
    if(juegoPausado) return;
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    
    const preguntaObj = preguntasNivel1[Math.floor(Math.random() * preguntasNivel1.length)];
    document.getElementById('pregunta-texto').textContent = preguntaObj.q;
    const cont = document.getElementById('respuestas-container');
    cont.innerHTML = '';
    
    preguntaObj.opciones.forEach((opcion, i) => {
        const btn = document.createElement('button');
        btn.classList.add('btn-respuesta');
        btn.textContent = opcion;
        btn.onclick = () => procesarRespuesta(i === preguntaObj.correcta);
        cont.appendChild(btn);
    });
});

function procesarRespuesta(esCorrecta) {
    modalTrivia.classList.add('oculto');
    juegoPausado = false;
    btnCofre.classList.add('oculto');

    if (esCorrecta && jefeActivo) {
        alert("¡Respuesta Correcta! El escudo del Jefe se ha roto.");
        jefeActivo.tieneEscudo = false;
        jefeActivo.visual.querySelector('.imagen-personaje').classList.remove('escudo-activo');
    } else {
        alert("¡Fallaste! El Jefe sigue siendo casi invencible.");
    }
    requestAnimationFrame(gameLoop);
}

// --- BUCLE PRINCIPAL ---
function gameLoop() {
    if (juegoPausado || !juegoIniciado) return;
    frames++;
    
    // Gana 1 de energía cada 2.5 segundos (150 frames)
    if (frames % 150 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }

    // Enemigos normales salen alternados por carriles cada 2.5 segundos (antes del jefe)
    if (frames % 150 === 0 && frames < TIEMPO_JEFE) spawnEnemigo(false);
    
    // El Jefe sale al minuto exacto (frame 3600)
    if (frames === TIEMPO_JEFE) spawnEnemigo(true);

    [...guardianesActivos, ...enemigosActivos].forEach(entidad => {
        entidad.visual.style.left = (entidad.x / ANCHO_VIRTUAL * 100) + '%';
    });

    guardianesActivos.forEach((g, i) => {
        let enCombate = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 50) {
                enCombate = true;
                e.vida -= (e.tieneEscudo ? (g.dano * 0.1) : g.dano) / 60; 
                g.vida -= e.dano / 60;
                e.visual.querySelector('.health-bar-fill').style.width = (e.vida / e.vidaMax) * 100 + "%";
                g.visual.querySelector('.health-bar-fill').style.width = (g.vida / g.vidaMax) * 100 + "%";
            }
        });

        if (!enCombate) g.x += g.vel;

        if (g.x > ANCHO_VIRTUAL) { enemyBaseHealth -= g.dano; g.vida = 0; actualizarInterfaz(); }
        if (g.vida <= 0) { g.visual.remove(); guardianesActivos.splice(i, 1); }
    });

    enemigosActivos.forEach((e, i) => {
        let enCombate = false;
        guardianesActivos.forEach(g => {
            if (e.lane === g.lane && Math.abs(e.x - g.x) < 50) enCombate = true;
        });

        if (!enCombate) e.x -= e.vel;

        if (e.x <= 0) { baseHealth -= 20; e.vida = 0; actualizarInterfaz(); }
        if (e.vida <= 0) {
            if (e === jefeActivo) jefeActivo = null;
            e.visual.remove(); enemigosActivos.splice(i, 1);
        }
    });

    if (baseHealth <= 0) {
        alert("¡Tu fortaleza cayó! Game Over."); location.reload();
    } else if (enemyBaseHealth <= 0) {
        alert("¡Destruiste la base enemiga! Nivel 1 Completado."); location.reload(); 
    } else {
        requestAnimationFrame(gameLoop);
    }
}
