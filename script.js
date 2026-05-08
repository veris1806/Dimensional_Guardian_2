// --- CONFIGURACIÓN ---
const dicG = {
    tanque:  { costo: 3, vida: 300, dano: 15, vel: 0.5 },
    arquero: { costo: 4, vida: 100, dano: 30, vel: 0.8 },
    mago:    { costo: 5, vida: 100, dano: 50, vel: 0.7 },
    ninja:   { costo: 6, vida: 150, dano: 70, vel: 1.2 } 
};

const preguntasCiber = [
    { 
        q: '¿Qué es un ataque de Phishing?', 
        opciones: ["Un correo falso para robar datos", "Un virus que rompe el monitor", "Una técnica de pesca"], 
        correcta: 0, 
        mensaje: '¡Exacto! El phishing busca engañar al usuario para robar sus claves.' 
    },
    { 
        q: '¿Qué significa que una contraseña sea segura?', 
        opciones: ["Que es muy corta", "Que tiene letras, números y símbolos", "Que es mi nombre"], 
        correcta: 1, 
        mensaje: '¡Bien hecho! Las contraseñas complejas son tu primera línea de defensa.' 
    }
];

// --- VARIABLES ---
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
    document.getElementById('alert-title').style.color = esError ? "#e74c3c" : "#2ecc71";
    customAlert.classList.remove('oculto');
    alertBtn.onclick = () => { customAlert.classList.add('oculto'); if(callback) callback(); };
}

// INICIO LOGICA
setTimeout(() => {
    document.getElementById('level-title-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('level-title-screen').style.display = 'none';
        juegoPausado = false;
        requestAnimationFrame(gameLoop);
    }, 800);
}, 2000);

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
    if(esJefe) div.style.transform = "scale(2) translateY(-50%)";
    padre.appendChild(div);
    return div;
}

function spawnEnemigo(esJefe = false) {
    const lIdx = Math.floor(Math.random() * 3);
    const eObj = {
        visual: crearVisual(carriles[lIdx], false, esJefe),
        vida: esJefe ? 1000 : 100, vidaMax: esJefe ? 1000 : 100,
        dano: esJefe ? 40 : 15, vel: esJefe ? 0.2 : 0.7,
        x: ANCHO_VIRTUAL - 50, lane: lIdx + 1, esJefe: esJefe
    };
    enemigosActivos.push(eObj);
    if(esJefe) { jefeActivo = eObj; btnCofre.classList.remove('oculto'); }
}

function gameLoop() {
    if (juegoPausado) return;
    frames++;
    if (frames % 180 === 0 && magicEnergy < 20) { magicEnergy++; actualizarInterfaz(); }
    if (!jefeDerrotado && frames % 300 === 0) spawnEnemigo(false);
    if (frames === 1500 && !jefeDerrotado) spawnEnemigo(true);

    [...guardianesActivos, ...enemigosActivos].forEach(ent => {
        ent.visual.style.left = (ent.x / ANCHO_VIRTUAL * 100) + '%';
    });

    guardianesActivos.forEach((g, i) => {
        let enC = false;
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 50) {
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
        guardianesActivos.forEach(g => { if (e.lane === g.lane && Math.abs(e.x - g.x) < 50) enC = true; });
        if (!enC) e.x -= e.vel;
        if (e.x <= LIMITE_BASE) { baseHealth -= 0.1; actualizarInterfaz(); }
        if (e.vida <= 0) {
            if(e === jefeActivo) { jefeDerrotado = true; btnCofre.classList.add('oculto'); }
            e.visual.remove(); enemigosActivos.splice(i, 1);
        }
    }

    if (baseHealth <= 0) { mostrarAlerta("GAME OVER", "El Servidor ha sido hackeado. ¡Inténtalo de nuevo!", true, () => location.reload()); }
    else if (jefeDerrotado && enemigosActivos.length === 0) { mostrarAlerta("VICTORIA", "¡Has defendido el servidor con éxito!", false, () => location.reload()); }
    else { requestAnimationFrame(gameLoop); }
}

btnCofre.addEventListener('click', () => {
    juegoPausado = true;
    modalTrivia.classList.remove('oculto');
    const p = preguntasCiber[Math.floor(Math.random() * preguntasCiber.length)];
    document.getElementById('pregunta-texto').textContent = p.q;
    const cont = document.getElementById('respuestas-container');
    cont.innerHTML = '';
    p.opciones.forEach((op, idx) => {
        const b = document.createElement('button');
        b.className = 'btn-respuesta'; b.textContent = op;
        b.onclick = () => {
            modalTrivia.classList.add('oculto');
            if(idx === p.correcta) {
                if(jefeActivo) jefeActivo.vida -= 400;
                mostrarAlerta("¡ATAQUE EXITOSO!", p.mensaje, false, () => { juegoPausado = false; requestAnimationFrame(gameLoop); });
            } else {
                mostrarAlerta("FALLO DE SEGURIDAD", "El virus se ha fortalecido.", true, () => { juegoPausado = false; requestAnimationFrame(gameLoop); });
            }
        };
        cont.appendChild(b);
    });
});
