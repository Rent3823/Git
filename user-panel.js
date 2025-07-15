import { getUsuarioActual, registrarSolicitud, puedeSolicitarHoy } from "./storage.js";
import { showError } from "./utils.js";

export function renderUserPanel(usuario) {
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('user-box').style.display = '';
    document.getElementById('user-name').textContent = usuario.nombre;

    // Render formulario de solicitud de servicio
    const solicitudSection = document.getElementById('solicitud-section');
    solicitudSection.innerHTML = `
        <form id="solicitud-form">
            <div class="input-group">
                <label>¿Qué servicio deseas solicitar?</label>
                <select id="servicio-select" required>
                    <option value="">Seleccione...</option>
                    <option value="Desayuno">Desayuno</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Cena">Cena</option>
                </select>
            </div>
            <button type="submit">Solicitar Servicio</button>
        </form>
        <div id="solicitud-error" class="error-message" style="display:none;"></div>
        <div id="ticket-container"></div>
    `;

    document.getElementById('solicitud-form').addEventListener('submit', function(e){
        e.preventDefault();
        const usuario = getUsuarioActual();
        const servicio = document.getElementById('servicio-select').value;
        if(!servicio){
            showError('solicitud-error', "Seleccione un servicio.");
            return;
        }
        if(!puedeSolicitarHoy(usuario.rut, servicio)){
            showError('solicitud-error', "Solo puede solicitar " + servicio + " una vez al día.");
            return;
        }
        registrarSolicitud(usuario, servicio);
        mostrarTicket(usuario, servicio, "ticket-container");
        document.getElementById('solicitud-error').style.display = 'none';
        document.getElementById('solicitud-form').reset();

        // Notificar admin panel si está presente
        window.dispatchEvent(new Event('actualizar-admin-panel'));
    });
}

function mostrarTicket(usuario, servicio, target="ticket-container") {
    const now = new Date();
    const fecha = now.toLocaleDateString();
    const hora = now.toTimeString().substr(0,5);
    document.getElementById(target).innerHTML = `
        <div class="ticket">
            <div class="ticket-title">Ticket Digital ${servicio}</div>
            <b>Nombre:</b> ${usuario.nombre}<br>
            <b>RUT:</b> ${usuario.rut}<br>
            <b>Cargo:</b> ${usuario.cargo}<br>
            <b>Servicio:</b> ${servicio}<br>
            <b>Fecha:</b> ${fecha}<br>
            <b>Hora:</b> ${hora}
        </div>
    `;
}