import { usuarioPorRut, setUsuarioActual } from './storage.js';
import { normalizaRut, primeros4Rut, showError } from './utils.js';

export function initAuth({onUserLogin, onAdminLogin}) {
    const ADMIN_RUT = '16322387-2';

    // Wait for input elements to exist before setting up event listeners
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(() => {
        const loginForm = document.getElementById('login-form');
        const rutInput = document.getElementById('rut-input');
        const passwordInput = document.getElementById('password-input');
        const loginError = document.getElementById('login-error');
        const logoutBtnUser = document.getElementById('logout-btn-user');
        // The admin logout button might not be in the DOM yet: delegated via render
        let logoutBtnAdmin = document.getElementById('logout-btn-admin');

        function cerrarSesion(){
            setUsuarioActual(null);
            document.getElementById('login-box').style.display = '';
            document.getElementById('user-box').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'none';
            if(rutInput) rutInput.value = '';
            if(passwordInput) passwordInput.value = '';
            if(loginError) loginError.style.display = 'none';
        }

        if (loginForm) {
            loginForm.addEventListener('submit', function(e){
                e.preventDefault();
                const rut = normalizaRut(rutInput.value);
                const password = passwordInput.value;
                if (loginError) loginError.style.display = 'none';

                if (!rut.match(/^\d{7,8}-[\dkK]$/)) {
                    showError('login-error', "Formato de RUT inválido.");
                    return;
                }

                let usuario = usuarioPorRut(rut);
                if(!usuario){
                    showError('login-error', "Usuario no autorizado.");
                    return;
                }
                if(password !== primeros4Rut(rut)){
                    showError('login-error', "Contraseña incorrecta.");
                    return;
                }
                setUsuarioActual(usuario);
                if(usuario.rut === ADMIN_RUT){
                    onAdminLogin();
                }else{
                    onUserLogin(usuario);
                }
            });
        }

        if (logoutBtnUser) {
            logoutBtnUser.addEventListener('click', function(e){
                e.preventDefault();
                cerrarSesion();
            });
        }

        // Since admin logout button is dynamically rendered, observe for it
        function addAdminLogoutHandler() {
            let btn = document.getElementById('logout-btn-admin');
            if (btn && !btn.dataset.bound) {
                btn.addEventListener('click', function(e){
                    e.preventDefault();
                    cerrarSesion();
                });
                btn.dataset.bound = "1";
            }
        }
        // Observe for mutations in admin-panel and attach handler as needed
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            const observer = new MutationObserver(addAdminLogoutHandler);
            observer.observe(adminPanel, { childList: true, subtree: true });
        }
        // Try to add event in case admin panel was already rendered
        addAdminLogoutHandler();
    });
}