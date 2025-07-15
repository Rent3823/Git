// Estado global y persistencia
import { normalizaRut } from './utils.js';

// Notice: all mutation to these must happen via storage.js!
export let usuariosAutorizados = [];     // [{nombre, rut, cargo }]
export let registrosSolicitudes = [];    // [{nombre, rut, cargo, servicio, fecha, hora}]
export let usuarioActual = null;

export function cargarUsuariosDesdeExcel(data) {
    usuariosAutorizados = [];
    data.forEach((row) => {
        if(row['RUT'] && row['NOMBRE'] && row['CARGO']){
            usuariosAutorizados.push({
                nombre: (row['NOMBRE']||'').toString().trim(),
                rut: normalizaRut(row['RUT']),
                cargo: (row['CARGO']||'').toString().trim()
            });
        }
    });
}

export function usuarioPorRut(rut){
    rut = normalizaRut(rut);
    const ADMIN_RUT = '16322387-2';
    if (rut === ADMIN_RUT) return {nombre: 'Administrador', rut, cargo: 'Administrador'};
    return usuariosAutorizados.find(u => normalizaRut(u.rut) === rut) || null;
}

export function puedeSolicitarHoy(rut, servicio) {
    const hoy = (new Date()).toISOString().substr(0,10);
    return !registrosSolicitudes.some(r =>
        normalizaRut(r.rut) === normalizaRut(rut) &&
        r.servicio === servicio &&
        r.fecha === hoy
    );
}

export function registrarSolicitud(usuario, servicio) {
    const now = new Date();
    const fecha = now.toISOString().substr(0,10);
    const hora  = now.toTimeString().substr(0,5);
    const reg = {
        nombre: usuario.nombre,
        rut: usuario.rut,
        cargo: usuario.cargo,
        servicio,
        fecha,
        hora
    };
    registrosSolicitudes.push(reg);
    try { localStorage.setItem('registrosSolicitudes', JSON.stringify(registrosSolicitudes)); } catch(e){}
}

export function setUsuarioActual(user) {
    usuarioActual = user;
}

export function getUsuarioActual() {
    return usuarioActual;
}

export function saveUsuariosAutorizados() {
    try { localStorage.setItem('usuariosAutorizados', JSON.stringify(usuariosAutorizados)); } catch(e){}
}

export function saveAll() {
    saveUsuariosAutorizados();
    try { localStorage.setItem('registrosSolicitudes', JSON.stringify(registrosSolicitudes)); } catch(e){}
}

// Load from localStorage
export function loadLocalData() {
    try {
        let usuarios = JSON.parse(localStorage.getItem('usuariosAutorizados')||'[]');
        usuariosAutorizados = usuarios.map(u => ({
            nombre: u.nombre,
            rut: normalizaRut(u.rut),
            cargo: u.cargo
        }));
    } catch(e) { usuariosAutorizados = []; }
    try {
        registrosSolicitudes = JSON.parse(localStorage.getItem('registrosSolicitudes')||'[]');
    } catch(e) { registrosSolicitudes = []; }
}