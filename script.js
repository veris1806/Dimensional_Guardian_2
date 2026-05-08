// --- CONFIGURACIÓN ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 12, vel: 0.6 },
    arquero: { costo: 4, vida: 110, dano: 28, vel: 1.1 },
    mago:    { costo: 5, vida: 110, dano: 45, vel: 0.9 },
    ninja:   { costo: 6, vida: 160, dano: 65, vel: 1.6 } 
};

const preguntasNivel1 = [
    { q: 'Un duende te ofrece un programa llamado "Hack_Oro_Infinito.exe", pero te pide apagar los escudos de tu servidor para instalarlo. ¿Qué haces?', opciones: ["¡Lo instalo rápido, quiero oro!", "Lo rechazo, es una trampa.", "Lo instalo, pero solo un minuto."], correcta: 1, mensaje: 'Los programas piratas suelen ocultar virus Troyanos.' },
    { q: 'Un guardia sin uniforme te pide la contraseña de tu base argumentando que necesita "revisar el sistema". ¿Qué haces?', opciones: ["¡No! Eres un impostor.", "Se la doy, parece urgente.", "Se la doy, pero luego la cambio."], correcta: 0, mensaje: 'El soporte técnico real nunca te pide tu contraseña.' },
    { q: 'Recibes un mensaje de un mago desconocido prometiendo "Poder Absoluto" si haces clic en su portal mágico. ¿Qué haces?', opciones: ["¡Cruzo el portal rápido!", "Lo ignoro, es una estafa.", "Mando a mis tropas primero."], correcta: 1, mensaje: 'Nunca hagas clic en enlaces desconocidos.' },
    { q: 'Te llega un pergamino mágico de un remitente desconocido que dice "Ábreme". ¿Qué haces?', opciones: ["Lo abro para ver qué dice.", "Lo destruyo, es un virus.", "Lo guardo para leerlo luego."], correcta: 1, mensaje: 'Los virus suelen disfrazarse de archivos adjuntos.' }
];

let baseHealth = 100, magicEnergy = 10, frames = 0, juegoPausado = true, juegoIniciado = false;
let seleccionado = null, guardianesActivos = [], enemigosActivos = [], jefeActivo = null, jefeDerrotado = false;
const ANCHO_VIRTUAL = 1000, LIMITE_BASE = 120, TIEMPO_JEFE = 1200;

let preguntasRestantes = [], jefePreguntasCorrectas = 0, jefePreguntasIncorrectas = 0;
let preguntaActualObj = null, callbackAlerta = null;

const uiVida = document.getElementById('base-health'), uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn'), carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal'), btnCofre = document.getElementById('cofre-btn');
const pantallaTitulo = document.getElementById('level-title-screen');
const customAlert = document.getElementById('custom-alert'), alertBox = document.getElementById('alert-box');
const alertTitle = document.getElementById('alert-title'), alertText = document.getElementById('alert-text'), alertBtn = document.getElementById('alert-btn');

function actualizarInterfaz() {
    uiVida.textContent = Math.floor(baseHealth);
    uiEnergia.textContent = magicEnergy;
    botones.forEach(btn => {
        const tipo = btn.getAttribute('data-type');
        btn.classList.toggle('disabled', magicEnergy < dicG[tipo].costo);
    });
}

function mostrarAlerta(titulo, mensaje, esError, callback) {
    alertTitle.textContent = titulo;
    alertText.textContent = mensaje;
    if (esError) { alertBox.classList.add('error'); alertTitle.className = 'rojo'; }
    else { alertBox.classList.remove('error'); alertTitle.className = 'verde'; }
    callbackAlerta = callback;
    customAlert.classList.remove('oculto');
}

alertBtn.addEventListener('click', () => {
    customAlert.classList.add('oculto');
    if (callbackAlerta) { callbackAlerta(); callbackAlerta = null; }
});

setTimeout(() => {
    pantallaTitulo.style.opacity = '0'; 
    setTimeout(() => {
        pantallaTitulo.style.display = 'none'; 
        juegoPausado = false; juegoIniciado = true;
        actualizarInterfaz();
        requestAnimationFrame(gameLoop); 
    }, 800);
}, 3000); 

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
    lane.addEventListener('click', () => {
        if (!seleccionado || juegoPausado) return;
        const datos = dicG[seleccionado];
        if (magicEnergy >= datos.costo) {
            magicEnergy -= datos.costo;
            guardianesActivos.push({
                visual: crearVisual(lane, true, false, seleccionado),
                vida: datos.vida, vidaMax: datos.vida, dano: datos.dano, vel: datos.vel,
                x: LIMITE_BASE, lane: index + 1, esGuardian: true
            });
            seleccionado = null;
            botones.forEach(b => b.classList.remove('selected'));
            carriles.forEach(l => l.classList.remove('selectable'));
            actualizarInterfaz();
        }
    });
});

function crearVisual(padre, esGuardian, esJefe, tipo = '') {
    const div = document.createElement('div');
    div.classList.add('entidad');
    let claseImagen = esGuardian ? tipo : 'bug';
    div.innerHTML = `
        <div class="health-bar-container"><div class="health-bar-fill"></div></div>
        <div class="imagen-personaje ${claseImagen}"></div>
    `;
    if (esJefe) div.style.transform = "scale(2.5) translateY(-50%)";
    padre.appendChild(div);
    return div;
}

function spawnEnemigo(esJefe = false) {
    const carrilRandom = Math.floor(Math.random() * 3);
    const enemigoObj = {
        visual: crearVisual(carriles[carrilRandom], false, esJefe),
        vida: esJefe ? 900 : 100, vidaMax: esJefe ? 900 : 100,
        dano: esJefe ? 40 : 15, vel: esJefe ? 0.2 : 0.8,
        x: ANCHO_VIRTUAL - 50, lane: carrilRandom + 1, esGuardian: false, esJefe: esJefe
    };
    enemigosActivos.push(enemigoObj);
    if (esJefe) {
        jefeActivo = enemigoObj;
        jefePreguntasCorrectas = 0; jefePreguntasIncorrectas = 0;
        preguntasRestantes = [...preguntasNivel1].sort(() => Math.random() - 0.5);
        btnCofre.classList.remove('oculto'); 
    }
}

function abrirModalPregunta() {
    juegoPausado = true; modalTrivia.classList.remove('oculto');
    preguntaActualObj = preguntasRestantes.pop();
    document.getElementById('pregunta-texto').textContent = preguntaActualObj.q;
    const cont = document.getElementById('respuestas-container');
    cont.innerHTML = '';
    preguntaActualObj.opciones.forEach((opcion, i) => {
        const btn = document.createElement('button');
        btn.classList.add('btn-respuesta');
        btn.textContent = opcion;
        btn.onclick = () => procesarRespuesta(i === preguntaActualObj.correcta);
        cont.appendChild(btn);
    });
}

btnCofre.addEventListener('click', () => { if(!juegoPausado) abrirModalPregunta(); });

function procesarRespuesta(esCorrecta) {
    modalTrivia.classList.add('oculto'); btnCofre.classList.add('oculto'); 
    if (esCorrecta) {
        jefePreguntasCorrectas++;
        if (jefeActivo) jefeActivo.vida -= (jefeActivo.vidaMax / 3);
        if (jefePreguntasCorrectas >= 3) {
            if(jefeActivo) jefeActivo.vida = 0; 
            mostrarAlerta("✨ ¡Impacto Crítico!", "¡Correcto! " + preguntaActualObj.mensaje, false, () => {
                juegoPausado = false; requestAnimationFrame(gameLoop);
            });
        } else {
            mostrarAlerta("✅ ¡Ataque Exitoso!", "¡Correcto! (Progreso: " + jefePreguntasCorrectas + "/3).", false, () => {
                juegoPausado = false; requestAnimationFrame(gameLoop);
                setTimeout(() => { if (jefeActivo) btnCofre.classList.remove('oculto'); }, 3000);
            });
        }
    } else {
        jefePreguntasIncorrectas++;
        if (jefePreguntasIncorrectas >= 2) {
            mostrarAlerta("💥 ¡Brecha Crítica!", "Los Troyanos vencieron.", true, () => location.reload());
        } else {
            mostrarAlerta("❌ ¡Ataque Fallido!", "Respuesta incorrecta.", true, () => {
                juegoPausado = false; requestAnimationFrame(gameLoop);
                setTimeout(() => { if (jefeActivo) btnCofre.classList.remove('oculto'); }, 3000);
            });
        }
    }
}

function gameLoop() {
    if (juegoPausado || !juegoIniciado) return; 
    frames++;
    if (frames % 180 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }
    if (!jefeDerrotado && frames % 180 === 0) spawnEnemigo(false);
    if (frames === TIEMPO_JEFE) spawnEnemigo(true);

    [...guardianesActivos, ...enemigosActivos].forEach(ent => {
        ent.visual.style.left = (ent.x / ANCHO_VIRTUAL * 100) + '%';
        const bar = ent.visual.querySelector('.health-bar-fill');
        if (bar) bar.style.width = Math.max(0, (ent.vida/ent.vidaMax)*100) + "%";
    });

    guardianesActivos.forEach((g, i) => {
        let enC = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 65) {
                enC = true; e.vida -= g.dano / 60; g.vida -= e.dano / 60;
            }
        });
        if (!enC) g.x += g.vel;
        if (g.x > ANCHO_VIRTUAL || g.vida <= 0) { g.visual.remove(); guardianesActivos.splice(i, 1); }
    });

    for (let i = enemigosActivos.length - 1; i >= 0; i--) {
        let e = enemigosActivos[i], enC = false;
        guardianesActivos.forEach(g => { if (e.lane === g.lane && Math.abs(e.x - g.x) < 65) enC = true; });
        if (!enC) e.x -= e.vel;
        if (e.x <= LIMITE_BASE) { baseHealth -= 0.2; actualizarInterfaz(); e.vida = 0; }
        if (e.vida <= 0) {
            if (e === jefeActivo) { jefeActivo = null; jefeDerrotado = true; btnCofre.classList.add('oculto'); }
            e.visual.remove(); enemigosActivos.splice(i, 1);
        }
    }

    if (baseHealth <= 0) { mostrarAlerta("💀 Servidor Caído", "Game Over.", true, () => location.reload()); }
    else if (jefeDerrotado && enemigosActivos.length === 0) { mostrarAlerta("🏆 ¡Victoria!", "Nivel Completado.", false, () => location.reload()); }
    else { requestAnimationFrame(gameLoop); }
}
