// --- CONFIGURACIÓN DE TROPAS ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 10, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 25, vel: 1.0 },
    mago:    { costo: 5, vida: 100, dano: 40, vel: 0.8 },
    ninja:   { costo: 6, vida: 150, dano: 60, vel: 1.5 } 
};

// --- PREGUNTAS ---
const preguntasNivel1 = [
    { q: "Un duende te ofrece un mapa del tesoro, pero pide la llave de tu fortaleza por 'solo un minuto'. ¿Qué haces?", opciones: ["Le doy la llave rápido", "Lo ignoro, es una trampa", "Le doy una copia mágica"], correcta: 1 },
    { q: "El herrero te regala una espada gratis, pero esta te obliga a decirle a quién vas a visitar. ¿Qué haces?", opciones: ["La uso, ¡es gratis!", "La destruyo, no respeto privacidad", "Se la doy a mi enemigo"], correcta: 1 },
    { q: "Encuentras un pergamino tirado que dice 'Hechizos_Infinitos.exe'. ¿Qué haces?", opciones: ["Lo abro inmediatamente", "Lo quemo, es un virus mágico", "Se lo leo a mis tropas"], correcta: 1 },
    { q: "Un cuervo te pide tu 'Palabra Secreta' para entregarte un paquete del rey...", opciones: ["Le doy mi palabra secreta", "Le doy una palabra falsa", "Me niego, el rey no pide eso"], correcta: 2 }
];

// --- VARIABLES GLOBALES ---
let baseHealth = 100;
let magicEnergy = 10;
let frames = 0;
let juegoPausado = true; 
let juegoIniciado = false;
let seleccionado = null;
let guardianesActivos = [];
let enemigosActivos = [];
let jefeActivo = null; 
let jefeYaSalio = false;
let jefeDerrotado = false;
const ANCHO_VIRTUAL = 1000;

// EL TIEMPO DEL JEFE
// Cambia esto a 3600 (1 minuto) cuando vayas a presentar el juego. Ahorita está en 1200 (20 segs) para probar.
const TIEMPO_JEFE = 1200; 

// SISTEMA CORTAFUEGOS (1 por carril)
let cortafuegos = [true, true, true]; 
let enemigoEnPuerta = null; 
let tipoPreguntaActual = ""; 

// --- ELEMENTOS DOM ---
const uiVida = document.getElementById('base-health');
const uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn');
const carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal');
const tituloTrivia = document.getElementById('trivia-titulo');
const btnCofre = document.getElementById('cofre-btn');
const pantallaTitulo = document.getElementById('level-title-screen');

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

// --- CINEMÁTICA DE INICIO ---
setTimeout(() => {
    pantallaTitulo.style.opacity = '0'; 
    setTimeout(() => {
        pantallaTitulo.style.display = 'none'; 
        juegoPausado = false;
        juegoIniciado = true;
        actualizarInterfaz();
        requestAnimationFrame(gameLoop); 
    }, 800);
}, 3000);

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
    lane.addEventListener('click', () => {
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
        dano: esJefe ? 100 : 15, 
        vel: esJefe ? 0.3 : 0.8,
        x: ANCHO_VIRTUAL - 50, lane: carrilRandom + 1, esGuardian: false, tieneEscudo: esJefe, esJefe: esJefe
    };
    
    enemigosActivos.push(enemigoObj);
    
    if (esJefe) {
        jefeActivo = enemigoObj;
        jefeYaSalio = true;
        btnCofre.classList.remove('oculto');
    }
}

// --- SISTEMA DE PREGUNTAS (COFRE Y CORTAFUEGOS) ---
function abrirModalPregunta(tipo) {
    tipoPreguntaActual = tipo;
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    
    if(tipo === 'cofre') {
        tituloTrivia.textContent = "✨ ¡El Cofre de la Sabiduría! ✨";
        tituloTrivia.style.color = "#f1c40f";
    } else {
        tituloTrivia.textContent = "🚨 ¡CORTAFUEGOS DE EMERGENCIA! 🚨";
        tituloTrivia.style.color = "#e74c3c";
    }

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
}

btnCofre.addEventListener('click', () => {
    if(!juegoPausado) abrirModalPregunta('cofre');
});

function procesarRespuesta(esCorrecta) {
    modalTrivia.classList.add('oculto');
    juegoPausado = false;

    if (tipoPreguntaActual === 'cofre') {
        if (esCorrecta && jefeActivo) {
            alert("¡Respuesta Correcta! El escudo del Jefe se ha roto.");
            jefeActivo.tieneEscudo = false;
            jefeActivo.visual.querySelector('.imagen-personaje').classList.remove('escudo-activo');
            btnCofre.classList.add('oculto'); 
        } else if (jefeActivo) {
            alert("¡Fallaste! El Cofre tardará 3 segundos en recargarse.");
            btnCofre.style.pointerEvents = 'none';
            btnCofre.style.opacity = '0.5';
            btnCofre.querySelector('.powerup-text').textContent = "Cargando...";
            setTimeout(() => {
                if (jefeActivo) { 
                    btnCofre.style.pointerEvents = 'auto';
                    btnCofre.style.opacity = '1';
                    btnCofre.querySelector('.powerup-text').textContent = "¡Cofre!";
                }
            }, 3000); 
        }
    } 
    else if (tipoPreguntaActual === 'cortafuegos' && enemigoEnPuerta) {
        if (esCorrecta) {
            alert("¡CORTAFUEGOS ACTIVADO! El enemigo ha sido desintegrado y absorbiste su energía.");
            enemigoEnPuerta.vida = 0; 
            magicEnergy = Math.min(20, magicEnergy + 2); // Premio extra por acertar
        } else {
            alert("¡ERROR DE CORTAFUEGOS! La base recibe daño directo.");
            baseHealth -= enemigoEnPuerta.dano;
            enemigoEnPuerta.vida = 0; 
        }
        actualizarInterfaz();
        enemigoEnPuerta = null;
    }
    
    requestAnimationFrame(gameLoop);
}

// --- BUCLE PRINCIPAL ---
function gameLoop() {
    if (juegoPausado || !juegoIniciado) return;
    frames++;
    
    // Energía pasiva: 1 punto cada 3 segundos aprox (180 frames)
    if (frames % 180 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }

    // Generar enemigos constantes (Incluso si el jefe está)
    if (!jefeDerrotado && frames % 180 === 0) spawnEnemigo(false);
    
    // Generar al Jefe
    if (frames === TIEMPO_JEFE && !jefeYaSalio) spawnEnemigo(true);

    // Mover visualmente a todos
    [...guardianesActivos, ...enemigosActivos].forEach(entidad => {
        entidad.visual.style.left = (entidad.x / ANCHO_VIRTUAL * 100) + '%';
    });

    // Lógica de Guardianes
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

        if (g.x > ANCHO_VIRTUAL) { g.vida = 0; } 
        if (g.vida <= 0) { g.visual.remove(); guardianesActivos.splice(i, 1); }
    });

    // Lógica de Enemigos
    for (let i = enemigosActivos.length - 1; i >= 0; i--) {
        let e = enemigosActivos[i];
        let enCombate = false;
        
        guardianesActivos.forEach(g => {
            if (e.lane === g.lane && Math.abs(e.x - g.x) < 50) enCombate = true;
        });

        if (!enCombate) e.x -= e.vel;

        // Choque contra tu base
        if (e.x <= 0) { 
            if (cortafuegos[e.lane - 1] && !e.esJefe) {
                cortafuegos[e.lane - 1] = false; 
                document.getElementById(`cf-${e.lane}`).classList.add('gastado'); // Oculta el letrero visual
                enemigoEnPuerta = e;
                abrirModalPregunta('cortafuegos');
                return; // PAUSA EL LOOP AQUÍ para que respondas
            } else {
                baseHealth -= e.dano; 
                e.vida = 0; 
                actualizarInterfaz(); 
            }
        }
        
        // Muerte del enemigo
        if (e.vida <= 0) {
            // Recompensa de energía (absorbes su rastro si lo mataste tú)
            if (e.x > 0) { 
                magicEnergy = Math.min(20, magicEnergy + 2);
                actualizarInterfaz();
            }

            if (e === jefeActivo) {
                jefeActivo = null;
                jefeDerrotado = true;
                btnCofre.classList.add('oculto');
            }
            e.visual.remove(); 
            enemigosActivos.splice(i, 1);
        }
    }

    // Condiciones Finales
    if (baseHealth <= 0) {
        alert("¡Tu fortaleza cayó! Game Over."); location.reload();
    } else if (jefeDerrotado && enemigosActivos.length === 0) {
        alert("¡Sobreviviste a la oleada y derrotaste al Jefe! NIVEL COMPLETADO."); location.reload(); 
    } else {
        requestAnimationFrame(gameLoop);
    }
}
