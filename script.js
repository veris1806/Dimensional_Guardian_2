// --- CONFIGURACIÓN DE TROPAS (Nuevos nombres IT) ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 10, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 25, vel: 1.0 },
    mago:    { costo: 5, vida: 100, dano: 40, vel: 0.8 },
    ninja:   { costo: 6, vida: 150, dano: 60, vel: 1.5 } 
};

// --- PREGUNTAS (Adaptadas a Ciberseguridad/IT) ---
const preguntasNivel1 = [
    { q: "En CSS, ¿cómo se selecciona un ID?", opciones: [".nombre", "*nombre", "#nombre"], correcta: 2 },
    { q: "Un duende te ofrece un mapa, pero pide la contraseña de tu castillo...", opciones: ["Se la doy rápido", "Le doy una contraseña falsa", "Me niego, es phishing"], correcta: 2 },
    { q: "Te llega un correo urgente de 'Net-flix-Soporte.xyz' pidiendo tu tarjeta...", opciones: ["Es una estafa, lo borro", "Actualizo mis datos", "Lo reenvío a mis amigos"], correcta: 0 },
    { q: "Encuentras un pergamino que dice 'Instalar_Hechizos.exe' tirado...", opciones: ["Lo abro, ¡magia!", "Lo quemo, es malware", "Se lo leo a mis tropas"], correcta: 1 }
];

// --- VARIABLES GLOBALES ---
let baseHealth = 100;
let magicEnergy = 10;
let frames = 0;
let juegoPausado = true; // Empieza pausado por la pantalla de título
let juegoIniciado = false;
let seleccionado = null;
let guardianesActivos = [];
let enemigosActivos = [];
let jefeActivo = null; 
let jefeDerrotado = false;
const ANCHO_VIRTUAL = 1000;

// EL TIEMPO DEL JEFE (Ajustado a 20 segs para probar rápido. Ponlo en 3600 para el juego real)
const TIEMPO_JEFE = 1200; 

// SISTEMA CORTAFUEGOS (Podadoras tácticas)
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

// --- CINEMÁTICA DE INICIO (Intacta) ---
setTimeout(() => {
    pantallaTitulo.style.opacity = '0'; 
    setTimeout(() => {
        pantallaTitulo.style.display = 'none'; 
        juegoPausado = false;
        juegoIniciado = true;
        actualizarInterfaz();
        requestAnimationFrame(gameLoop); // Arranca el juego
    }, 800);
}, 3000); // 3 segundos de espera

// --- INVOCACIÓN DE TROPAS (Arreglada) ---
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
        btnCofre.classList.remove('oculto');
    }
}

// --- SISTEMA DE PREGUNTAS (Cofre y Cortafuegos) ---
function abrirModalPregunta(tipo) {
    tipoPreguntaActual = tipo;
    juegoPausado = true; // PAUSA EL JUEGO
    modalTrivia.classList.remove('oculto');
    
    if(tipo === 'cofre') {
        tituloTrivia.textContent = "✨ ¡El Cofre de la Sabiduría! ✨";
        tituloTrivia.style.color = "#f1c40f";
    } else {
        tituloTrivia.textContent = "🚨 ¡Apareció un Bug Educativo! 🚨";
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
    juegoPausado = false; // BLINDAJE: SE DESPAUSA SÍ O SÍ

    if (tipoPreguntaActual === 'cofre') {
        if (esCorrecta && jefeActivo) {
            alert("¡Bug Arreglado! El escudo del Jefe se ha roto.");
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
            magicEnergy = Math.min(20, magicEnergy + 2); // Premio extra
        } else {
            alert("¡ERROR DE CORTAFUEGOS! El Bug llega al Servidor.");
            baseHealth -= enemigoEnPuerta.dano;
            enemigoEnPuerta.vida = 0; 
        }
        actualizarInterfaz();
        enemigoEnPuerta = null;
    }
    
    requestAnimationFrame(gameLoop);
}

// --- BUCLE PRINCIPAL (Blindado) ---
function gameLoop() {
    if (juegoPausado || !juegoIniciado) return; // Si está en trivia, se para aquí.
    frames++;
    
    // Energía pasiva: 1 cada 3 segundos aprox
    if (frames % 180 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }

    // Enemigos normales salen SIEMPRE hasta que el jefe muera
    if (!jefeDerrotado && frames % 180 === 0) spawnEnemigo(false);
    
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

        // Choque contra la base (PODADORAS)
        if (e.x <= 0) { 
            if (cortafuegos[e.lane - 1] && !e.esJefe) {
                cortafuegos[e.lane - 1] = false; 
                document.getElementById(`cf-${e.lane}`).classList.add('gastado'); 
                enemigoEnPuerta = e;
                abrirModalPregunta('cortafuegos');
                return; // PAUSA EL LOOP AQUÍ para que respondas
            } else {
                baseHealth -= e.dano; 
                e.vida = 0; 
                actualizarInterfaz(); 
            }
        }
        
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
        alert("¡Tu servidor cayó! Game Over."); location.reload();
    } else if (jefeDerrotado && enemigosActivos.length === 0) {
        alert("¡Sobreviviste a la oleada de Bugs y derrotaste al Jefe! NIVEL COMPLETADO."); location.reload(); 
    } else {
        requestAnimationFrame(gameLoop);
    }
}
