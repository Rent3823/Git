import { usuariosAutorizados, registrosSolicitudes, registrarSolicitud, puedeSolicitarHoy, cargarUsuariosDesdeExcel, getUsuarioActual, saveUsuariosAutorizados, saveAll } from "./storage.js";
import { showError, showSuccess } from "./utils.js";

export function renderAdminPanel() {
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('user-box').style.display = 'none';
    document.getElementById('admin-panel').style.display = '';

    // Render the admin HTML
    document.getElementById('admin-panel').innerHTML = `
        <button class="logout-btn" id="logout-btn-admin">Cerrar sesión</button>
        <div class="brand-header">
            <img src="/W-Santiago (1).png" alt="Logo W Santiago">
        </div>
        <h1 class="title">Panel Administración</h1>
        <div class="box" style="max-width:440px; margin: 10px auto 20px auto; box-shadow:0 3px 19px #dceffd60;">
            <div style="font-size:1.04rem; font-weight:500; margin-bottom:7px; text-align:center;">
                Solicitud de alimento (Administrador)
            </div>
            <form id="admin-solicitud-form">
                <div class="input-group">
                    <label>¿Qué servicio deseas solicitar?</label>
                    <select id="admin-servicio-select" required>
                        <option value="">Seleccione...</option>
                        <option value="Desayuno">Desayuno</option>
                        <option value="Almuerzo">Almuerzo</option>
                        <option value="Cena">Cena</option>
                    </select>
                </div>
                <button type="submit">Solicitar Servicio</button>
            </form>
            <div id="admin-solicitud-error" class="error-message" style="display:none;"></div>
            <div id="admin-ticket-container"></div>
        </div>
        <div class="dashboard-section">
            <div class="dashboard-title">Dashboard de Consumos</div>
            <div class="dashboard-totals" id="dashboard-totals"></div>
            <div class="dashboard-list-section">
                <h4>Trabajadores que han consumido <span id="dashboard-servicio-tipo">Desayuno</span> hoy:</h4>
                <select id="dashboard-servicio-select" style="margin-bottom:10px; border:1px solid #d4e0f1;">
                    <option value="Desayuno">Desayuno</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Cena">Cena</option>
                </select>
                <ul class="dashboard-list" id="dashboard-list">
                </ul>
            </div>
        </div>
        <div>
            <form id="upload-form">
                <label>Subir listado de autorizados (Excel):</label>
                <input type="file" id="excel-input" accept=".xlsx,.xls" required>
                <button style="margin-top:7px;" type="submit">Cargar Lista</button>
            </form>
            <div class="success-message" id="admin-success" style="display:none;"></div>
            <div class="error-message" id="admin-error" style="display:none;"></div>
        </div>
        <div class="summary-box" style="display:none;" id="admin-summary"></div>
        <div style="margin:12px 0;">
            <button id="download-excel-btn" disabled>Descargar registros (Excel)</button>
        </div>
        <table id="resume-table" style="display:none;">
            <thead>
            <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Cargo</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
            </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    `;

    registrarEventHandlers();
    recargarTablaAdmin();
    recargarDashboardAdmin();
    // Permite actualización de otros módulos
    window.addEventListener('actualizar-admin-panel', ()=>{
        recargarDashboardAdmin();
        recargarTablaAdmin();
    });
}

function registrarEventHandlers() {
    // Logout
    document.getElementById('logout-btn-admin').addEventListener('click', (e)=>{
        e.preventDefault();
        // Redirigido a auth.js, pero aquí limpiamos
        document.getElementById('admin-panel').style.display = 'none';
    });
    // Solicitud alimento admin
    document.getElementById('admin-solicitud-form').addEventListener('submit', function(e){
        e.preventDefault();
        const admin = getUsuarioActual();
        const servicio = document.getElementById('admin-servicio-select').value;
        if(!servicio){
            showError('admin-solicitud-error', "Seleccione un servicio.");
            return;
        }
        if(!puedeSolicitarHoy(admin.rut, servicio)){
            showError('admin-solicitud-error', "Solo puede solicitar " + servicio + " una vez al día.");
            return;
        }
        registrarSolicitud(admin, servicio);
        mostrarTicket(admin, servicio, "admin-ticket-container");
        document.getElementById('admin-solicitud-error').style.display = 'none';
        document.getElementById('admin-solicitud-form').reset();
        recargarDashboardAdmin();
        recargarTablaAdmin();
    });
    // Upload excel
    document.getElementById('upload-form').addEventListener('submit', function(e){
        e.preventDefault();
        const fileInput = document.getElementById('excel-input');
        const errorBox = document.getElementById('admin-error');
        const successBox = document.getElementById('admin-success');
        errorBox.style.display = 'none';
        successBox.style.display = 'none';

        if(fileInput.files.length === 0){
            showError('admin-error', "Seleccione un archivo.");
            return;
        }
        const f = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(evt){
            try {
                const data = new Uint8Array(evt.target.result);
                // XLSX global de CDN
                const wb = XLSX.read(data, {type:'array'});
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, {defval:""});
                cargarUsuariosDesdeExcel(json);
                saveUsuariosAutorizados();
                document.getElementById('admin-summary').textContent = `Lista cargada: ${usuariosAutorizados.length} usuarios autorizados.`;
                document.getElementById('admin-summary').style.display = '';
                showSuccess('admin-success', "Lista cargada exitosamente.");
            } catch(e){
                showError('admin-error', "Archivo inválido o formato no soportado.");
                return;
            }
        }
        reader.readAsArrayBuffer(f);
    });

    document.getElementById('download-excel-btn').addEventListener('click', function(){
        // Exportar registrosSolicitudes a Excel
        if(registrosSolicitudes.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(registrosSolicitudes,{
            header: ['nombre', 'rut', 'cargo', 'servicio', 'fecha', 'hora'],
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        XLSX.writeFile(wb, "registros-casinow.xlsx");
    });

    document.getElementById("dashboard-servicio-select").addEventListener('change', recargarDashboardAdmin);
}

function recargarDashboardAdmin(){
    const ahora = new Date();
    const hoy = ahora.toISOString().substr(0,10);
    let totales = {Desayuno:0, Almuerzo:0, Cena:0};
    let todayByTipo = {
        Desayuno: [], Almuerzo: [], Cena: []
    };
    registrosSolicitudes.forEach(r=>{
        if(totales[r.servicio]!=null) totales[r.servicio]++;
        if(r.fecha === hoy && todayByTipo[r.servicio]) todayByTipo[r.servicio].push(r);
    });

    // Visualización de totales dashboard
    const iconos = {Desayuno:'🥐', Almuerzo:'🍛', Cena:'🍽️'};
    const dashboardTotals = document.getElementById("dashboard-totals");
    dashboardTotals.innerHTML = '';
    for(const k of ['Desayuno','Almuerzo','Cena']){
        const d = document.createElement('div');
        d.className = 'dashboard-total';
        d.innerHTML = `${iconos[k]} <br>${k}<br><span style="font-size:1.5rem">${totales[k]}</span>`;
        dashboardTotals.appendChild(d);
    }

    // Dashboard seleccionable de trabajadores
    const dashboardServicioSelect = document.getElementById("dashboard-servicio-select");
    const tipo = dashboardServicioSelect.value || 'Desayuno';
    document.getElementById("dashboard-servicio-tipo").textContent = tipo;
    const ul = document.getElementById("dashboard-list");
    ul.innerHTML = '';
    let todayList = todayByTipo[tipo].sort((a,b)=>a.nombre.localeCompare(b.nombre));
    if(!todayList.length){
        const li = document.createElement('li');
        li.textContent = "Sin consumos registrados hoy.";
        ul.appendChild(li);
        return;
    }
    todayList.forEach(reg=>{
        const li = document.createElement('li');
        li.textContent = `${reg.nombre} (${reg.rut}) - ${reg.hora}`;
        ul.appendChild(li);
    });
}

function recargarTablaAdmin() {
    // Muestra resumen + tabla registros
    const table = document.getElementById('resume-table');
    const tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    if(registrosSolicitudes.length === 0){
        table.style.display = 'none';
        document.getElementById('download-excel-btn').disabled = true;
        document.getElementById('admin-summary').style.display = '';
        document.getElementById('admin-summary').textContent = "Sin registros de solicitudes aún.";
        return;
    }
    registrosSolicitudes.slice().reverse().forEach(reg=>{
        const tr = document.createElement('tr');
        tr.innerHTML =
            `<td>${reg.nombre}</td><td>${reg.rut}</td><td>${reg.cargo}</td><td>${reg.servicio}</td><td>${reg.fecha}</td><td>${reg.hora}</td>`;
        tbody.appendChild(tr);
    });
    table.style.display = '';
    document.getElementById('download-excel-btn').disabled = false;
    // Contar solicitudes por tipo
    const totales = {Desayuno:0, Almuerzo:0, Cena:0};
    registrosSolicitudes.forEach(r => { if(totales[r.servicio]!=null) totales[r.servicio]++; });
    document.getElementById('admin-summary').innerHTML =
        `<b>Totales de solicitudes</b>:<br>
        🥐 Desayuno: <b>${totales.Desayuno}</b> | 🍛 Almuerzo: <b>${totales.Almuerzo}</b> | 🍽️ Cena: <b>${totales.Cena}</b>`;
    document.getElementById('admin-summary').style.display = '';
}

function mostrarTicket(usuario, servicio, target="admin-ticket-container") {
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