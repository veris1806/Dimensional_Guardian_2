// CONFIGURACIÓN DE TROPAS
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 15, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 30, vel: 0.8 },
    mago:    { costo: 5, vida: 100, dano: 50, vel: 0.7 },
    ninja:   { costo: 6, vida: 150, dano: 70, vel: 1.2 } 
};

const preguntasNivel1 = [
    { q: '¿Qué es un Troyano en ciberseguridad?', opciones: ["Un virus que se disfraza de programa útil", "Un antivirus potente", "Un hardware para el servidor"], correcta: 0, mensaje: 'Correcto. Los troyanos engañan al usuario para entrar al sistema.' },
    { q: '¿Cuál es la mejor defensa contra ataques desconocidos?', opciones: ["Dar mis contraseñas", "Mantener el software actualizado", "Apagar el firewall"], correcta: 1, mensaje: 'Las actualizaciones parchan agujeros de seguridad.' }
];

// VARIABLES DE ESTADO
let baseHealth = 100, magicEnergy = 10, frames = 0, juegoPausado = true, seleccionado = null;
let guardianesActivos = [], enemigosActivos = [], jefeActivo = null, jefeDerrotado = false;
const ANCHO_VIRTUAL = 1000, LIMITE_BASE = 120;

const uiVida = document.getElementById('base-health'), uiEnergia = document.getElementById('magic-energy');
const botones = document.querySelectorAll('.guardian-btn'), carriles = document.querySelectorAll('.lane');
const modalTrivia = document.getElementById('trivia-modal'), btnCofre = document.getElementById('cofre-btn');
const customAlert = document.getElementById('custom-alert'), alertBtn = document.getElementById('alert-btn');

function actualizarInterfaz() {
    uiVida.textContent = Math.floor(baseHealth);
    uiEnergia.textContent = magicEnergy;
    botones.forEach(btn => {
        const tipo = btn.getAttribute('data-type');
        btn.classList.toggle('disabled', magicEnergy < dicG[tipo].costo);
    });
}

function mostrarAlerta(titulo, mensaje, esError, callback) {
    document.getElementById('alert-title').textContent = titulo;
    document.getElementById('alert-text').textContent = mensaje;
    customAlert.classList.remove('oculto');
    alertBtn.onclick = () => { customAlert.classList.add('oculto'); if(callback) callback(); };
}

// INICIO DEL JUEGO
setTimeout(() => {
    document.getElementById('level-title-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('level-title-screen').style.display = 'none';
        juegoPausado = false;
        requestAnimationFrame(gameLoop);
    }, 800);
}, 2000);

// SELECCIÓN E INVOCACIÓN
botones.forEach(btn => {
    btn.addEventListener('click', () => {
        if (juegoPausado) return;
        botones.forEach(b => b.classList.remove('selected'));
        seleccionado = btn.getAttribute('data-type');
        btn.classList.add('selected');
        carriles.forEach(l => l.classList.add('selectable'));
    });
});

carriles.forEach((lane, index) => {
    lane.addEventListener('click', () => {
        if (!seleccionado || juegoPausado || magicEnergy < dicG[seleccionado].costo) return;
        const d = dicG[seleccionado];
        magicEnergy -= d.costo;
        guardianesActivos.push({
            visual: crearVisual(lane, true, false, seleccionado),
            vida: d.vida, vidaMax: d.vida, dano: d.dano, vel: d.vel, x: LIMITE_BASE, lane: index + 1
        });
        seleccionado = null;
        botones.forEach(b => b.classList.remove('selected'));
        carriles.forEach(l => l.classList.remove('selectable'));
        actualizarInterfaz();
    });
});

function crearVisual(padre, esGuardian, esJefe, tipo) {
    const div = document.createElement('div');
    div.classList.add('entidad');
    let clase = esGuardian ? tipo : 'bug';
    div.innerHTML = `<div class="health-bar-container"><div class="health-bar-fill"></div></div><div class="imagen-personaje ${clase}"></div>`;
    if(esJefe) div.style.transform = "scale(1.8) translateY(-50%)";
    padre.appendChild(div);
    return div;
}

function spawnEnemigo(esJefe = false) {
    const lIdx = Math.floor(Math.random() * 3);
    const eObj = {
        visual: crearVisual(carriles[lIdx], false, esJefe),
        vida: esJefe ? 800 : 100, vidaMax: esJefe ? 800 : 100,
        dano: esJefe ? 50 : 15, vel: esJefe ? 0.2 : 0.7,
        x: ANCHO_VIRTUAL - 50, lane: lIdx + 1, esJefe: esJefe
    };
    enemigosActivos.push(eObj);
    if(esJefe) { jefeActivo = eObj; btnCofre.classList.remove('oculto'); }
}

function gameLoop() {
    if (juegoPausado) return;
    frames++;
    if (frames % 180 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }
    if (!jefeDerrotado && frames % 240 === 0) spawnEnemigo(false);
    if (frames === 1200) spawnEnemigo(true);

    [...guardianesActivos, ...enemigosActivos].forEach(ent => {
        ent.visual.style.left = (ent.x / ANCHO_VIRTUAL * 100) + '%';
    });

    guardianesActivos.forEach((g, i) => {
        let enC = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 60) {
                enC = true; e.vida -= g.dano / 60; g.vida -= e.dano / 60;
                e.visual.querySelector('.health-bar-fill').style.width = (e.vida/e.vidaMax)*100 + "%";
                g.visual.querySelector('.health-bar-fill').style.width = (g.vida/g.vidaMax)*100 + "%";
            }
        });
        if (!enC) g.x += g.vel;
        if (g.vida <= 0) { g.visual.remove(); guardianesActivos.splice(i, 1); }
    });

    for (let i = enemigosActivos.length - 1; i >= 0; i--) {
        let e = enemigosActivos[i], enC = false;
        guardianesActivos.forEach(g => { if (e.lane === g.lane && Math.abs(e.x - g.x) < 60) enC = true; });
        if (!enC) e.x -= e.vel;
        if (e.x <= LIMITE_BASE) { baseHealth -= 0.2; actualizarInterfaz(); }
        if (e.vida <= 0) {
            if(e === jefeActivo) { jefeDerrotado = true; btnCofre.classList.add('oculto'); }
            e.visual.remove(); enemigosActivos.splice(i, 1);
        }
    }

    if (baseHealth <= 0) { mostrarAlerta("GAME OVER", "Servidor hackeado.", true, () => location.reload()); }
    else if (jefeDerrotado && enemigosActivos.length === 0) { mostrarAlerta("VICTORIA", "Bugs eliminados.", false, () => location.reload()); }
    else { requestAnimationFrame(gameLoop); }
}

// LOGICA TRIVIA (Sencilla para el ejemplo)
btnCofre.addEventListener('click', () => {
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    const p = preguntasNivel1[0];
    document.getElementById('pregunta-texto').textContent = p.q;
    const cont = document.getElementById('respuestas-container');
    cont.innerHTML = '';
    p.opciones.forEach((op, idx) => {
        const b = document.createElement('button');
        b.className = 'btn-respuesta'; b.textContent = op;
        b.onclick = () => {
            modalTrivia.classList.add('oculto');
            if(idx === p.correcta) {
                if(jefeActivo) jefeActivo.vida -= 300;
                mostrarAlerta("¡GOLPE CRÍTICO!", p.mensaje, false, () => { juegoPausado = false; requestAnimationFrame(gameLoop); });
            } else {
                mostrarAlerta("ERROR", "El Troyano se fortalece.", true, () => { juegoPausado = false; requestAnimationFrame(gameLoop); });
            }
        };
        cont.appendChild(b);
    });
});
