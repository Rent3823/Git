// --- utilidades generales ---
export function normalizaRut(rut) {
    let r = rut.trim().toUpperCase();
    r = r.replace(/[^\dkK\-]/g, '');
    return r;
}
export function primeros4Rut(rut){
    let core = rut.split('-')[0];
    return core.substring(0, 4);
}
export function showError(id, msg){
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = '';
}
export function showSuccess(id, msg){
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = '';
    setTimeout(()=>{ el.style.display='none';}, 3200);
}

