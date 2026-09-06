/**
 * PUNTO DE ENTRADA: DOMContentLoaded
 * Garantiza que todo el árbol HTML esté construido en la memoria del navegador antes
 * de intentar seleccionar elementos. Previene el error común "Cannot set properties of null".
 */
document.addEventListener("DOMContentLoaded", () => {

    // BLOQUE 1: SISTEMA DE NOTIFICACIONES FLOTANTES (TOAST)
    // ROL: Reemplazar el alert() nativo del navegador por una interfaz moderna,
    // accesible y no bloqueante para confirmar acciones o reportar errores.

    function mostrarToast(mensaje, icono = '🔔') {
        // 1.1 Localizar o generar el contenedor raíz en el body
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // 1.2 Crear el nodo visual de la notificación
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
        container.appendChild(toast);

        // 1.3 Animación de entrada (espera 15ms para que el navegador registre el nodo en el DOM)
        setTimeout(() => toast.classList.add('show'), 15);

        // 1.4 Ciclo de vida y destrucción automática:
        // A los 3 segundos inicia la transición de salida; a los 3.4 segundos se borra de la memoria.
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }


    // BLOQUE 2: CONTROL DE ACCESO BASADO EN ROLES (RBAC) Y PERSISTENCIA DE SESIÓN
    // ROL: Simular la autenticación en el cliente leyendo localStorage, reflejar
    // la sesión en la barra de navegación y proteger vistas restringidas.

    // 2.1 Recuperar estado guardado en el navegador (si no existe, rol por defecto: Invitado)
    let rolActual = localStorage.getItem('usuario_rol') || 'Invitado';
    let nombreUsuario = localStorage.getItem('usuario_nombre') || '';

    // 2.2 Actualización dinámica del menú de navegación
    const nav = document.querySelector('.nav');
    if (nav) {
        // Limpiar identificador previo si ya existía
        const oldBadge = document.querySelector('.user-badge');
        if (oldBadge) oldBadge.remove();

        // Si el usuario inició sesión, inyectar píldora con nombre, rol y botón de cierre
        if (rolActual !== 'Invitado') {
            const badge = document.createElement('span');
            badge.className = 'user-badge';
            badge.innerHTML = `👤 ${nombreUsuario} (${rolActual}) <a href="#" id="btn-logout" style="color:#ef4444; margin-left:8px; text-decoration:none;">Salir</a>`;
            nav.appendChild(badge);

            // Manejador para cerrar sesión: limpia el almacenamiento y vuelve a la portada
            const btnLogout = document.querySelector('#btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.clear();
                    mostrarToast('Sesión cerrada correctamente', '👋');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                });
            }
        }
    }

    // 2.3 Protección de ruta privada: cuenta.html
    // Restricción de negocio: la cuenta corriente solo la pueden ver Contratistas y Administradores.
    if (window.location.pathname.includes('cuenta.html')) {
        if (rolActual !== 'Contratista' && rolActual !== 'Administrador') {
            mostrarToast('Acceso restringido: Exclusivo para Contratistas y Administradores.', '⛔');
            // Redirige al login tras mostrar el mensaje flotante
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return; // Detiene la ejecución del resto del script en esta página
        }
    }


    // BLOQUE 3: CATÁLOGO DE PRODUCTOS (FILTRADO Y AGREGAR A LA ORDEN)
    // ROL: Optimizar la consulta de stock permitiendo búsquedas en tiempo real
    // sin recargas y dando confirmación visual al añadir materiales.

    if (window.location.pathname.includes('catalogo.html')) {
        const inputBuscar = document.querySelector('input[placeholder="Buscar producto..."]');
        
        // 3.1 Búsqueda incremental: se ejecuta con cada tecla presionada ('input')
        if (inputBuscar) {
            inputBuscar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const filas = document.querySelectorAll('table tr');

                filas.forEach((fila, idx) => {
                    if (idx === 0) return; // Omitir la fila de encabezados (<th>)
                    const texto = fila.textContent.toLowerCase();
                    // Oculta la fila mediante CSS si no coincide con el texto buscado
                    fila.style.display = texto.includes(query) ? '' : 'none';
                });
            });
        }

        // 3.2 Escucha de clics en botones de agregar (excluyendo los que están disabled por falta de stock)
        const botonesAgregar = document.querySelectorAll('table button:not([disabled])');
        botonesAgregar.forEach((btn) => {
            btn.addEventListener('click', function() {
                const fila = this.closest('tr');
                const producto = fila.cells[1].textContent.trim(); // Celda del nombre
                mostrarToast(`Agregaste <strong>${producto}</strong> al pedido`, '🧱');
            });
        });
    }


    // BLOQUE 4: CARRITO DE COMPRAS (CÁLCULOS DINÁMICOS Y CHECKOUT)
    // ROL: Gestionar operaciones aritméticas de precios, eliminación de ítems
    // del DOM y validación de reglas de despacho a domicilio.

    if (window.location.pathname.includes('carrito.html')) {
        const tabla = document.querySelector('table');
        const h2Total = document.querySelector('h2');

        // 4.1 Función matemática: calcula subtotales por fila y total general
        function recalcularTotal() {
            let total = 0;
            const filas = tabla.querySelectorAll('tr');

            filas.forEach((fila, idx) => {
                if (idx === 0) return; // Omitir encabezados
                const celdaPrecio = fila.cells[1];
                const inputCant = fila.cells[2].querySelector('input');
                const celdaSubtotal = fila.cells[3];

                if (celdaPrecio && inputCant && celdaSubtotal) {
                    // Sanitización: remueve signo '$' y puntos separadores de miles para operar numéricamente
                    const precio = parseInt(celdaPrecio.textContent.replace('$', '').replace(/\./g, '').trim(), 10) || 0;
                    const cantidad = parseInt(inputCant.value, 10) || 0;
                    const subtotal = precio * cantidad;

                    // Formatea de vuelta con separador de miles local chileno (es-CL)
                    celdaSubtotal.textContent = `$${subtotal.toLocaleString('es-CL')}`;
                    total += subtotal;
                }
            });

            // Refleja el monto acumulado en el título de resumen
            if (h2Total && h2Total.textContent.includes('Total:')) {
                h2Total.textContent = `Total: $${total.toLocaleString('es-CL')}`;
            }
        }

        // 4.2 Escucha cambios manuales de cantidad en cada input numérico
        const inputsCantidad = document.querySelectorAll('table input[type="number"]');
        inputsCantidad.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value < 1) input.value = 1; // Evita cantidades menores a 1
                recalcularTotal();
            });
        });

        // 4.3 Botones para remover filas de la tabla
        const botonesQuitar = document.querySelectorAll('table button');
        botonesQuitar.forEach(btn => {
            btn.classList.add('btn-danger'); // Aplica color rojo de peligro
            btn.addEventListener('click', function() {
                const fila = this.closest('tr');
                const nombre = fila.cells[0].textContent.trim();
                fila.remove();      // Elimina el elemento del árbol DOM
                recalcularTotal();  // Vuelve a sumar el total tras la eliminación
                mostrarToast(`Se quitó ${nombre}`, '🗑️');
            });
        });

        // 4.4 Validación y confirmación del pedido
        const btnConfirmar = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirmar Pedido'));
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => {
                const despachoRadio = document.querySelector('#despacho');
                const inputDir = document.querySelector('input[placeholder="Calle, numero, comuna"]');

                // Regla condicional: si se elige despacho a domicilio, la dirección es obligatoria
                if (despachoRadio && despachoRadio.checked) {
                    if (inputDir && inputDir.value.trim() === '') {
                        inputDir.classList.add('campo-error');
                        mostrarToast('Indica la dirección para el despacho', '⚠️');
                        return;
                    }
                }
                if (inputDir) inputDir.classList.remove('campo-error');

                mostrarToast('¡Pedido confirmado con éxito!', '✅');
                setTimeout(() => { window.location.href = 'pedidos.html'; }, 1800);
            });
        }
    }


    // BLOQUE 5: VALIDACIÓN DE FORMULARIOS (LOGIN, REGISTRO Y CONTACTO)
    // ROL: Asegurar integridad de datos, evitar envíos accidentales con
    // preventDefault(), validar sintaxis con Regex y aplicar estilos visuales de error.
    

    const formulario = document.querySelector('form');
    if (!formulario) return; // Si la página actual no tiene formulario, termina la ejecución

    // 5.A FORMULARIO DE LOGIN (login.html)

    if (window.location.pathname.includes('login.html')) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault(); // Detiene el refresco de pantalla nativo
            
            const inputCorreo = document.querySelector('#correo');
            const inputClave = document.querySelector('#clave');
            let hayError = false;

            // Validación de campos no vacíos con .trim()
            [inputCorreo, inputClave].forEach(campo => {
                if (!campo.value.trim()) {
                    campo.classList.add('campo-error');
                    hayError = true;
                } else {
                    campo.classList.remove('campo-error');
                }
            });

            if (hayError) {
                mostrarToast('Por favor completa tus credenciales', '⚠️');
                return;
            }

            // Simulación de credenciales por palabra clave en el correo:
            const valCorreo = inputCorreo.value.toLowerCase().trim();
            let rolAsignado = 'Particular';
            if (valCorreo.includes('admin')) rolAsignado = 'Administrador';
            else if (valCorreo.includes('vendedor')) rolAsignado = 'Vendedor';
            else if (valCorreo.includes('contratista') || valCorreo.includes('maestro')) rolAsignado = 'Contratista';

            // Guardar rol y usuario en almacenamiento local
            localStorage.setItem('usuario_rol', rolAsignado);
            localStorage.setItem('usuario_nombre', valCorreo.split('@')[0]);

            mostrarToast(`¡Bienvenido! Rol: ${rolAsignado}`, '👷‍♂️');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        });
    }

    // 5.B FORMULARIO DE REGISTRO (registro.html)
    
    if (window.location.pathname.includes('registro.html')) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.querySelector('#nombre');
            const correo = document.querySelector('#correo');
            const telefono = document.querySelector('#telefono');
            const direccion = document.querySelector('#direccion');
            const clave = document.querySelector('#clave');
            const clave2 = document.querySelector('#clave2');
            const tipo = document.querySelector('#tipo');

            let hayError = false;
            const campos = [nombre, correo, telefono, direccion, clave, clave2];

            // Revisión de campos obligatorios
            campos.forEach(c => {
                if (!c.value.trim()) {
                    c.classList.add('campo-error');
                    hayError = true;
                } else {
                    c.classList.remove('campo-error');
                }
            });

            // Validación de estructura de correo con Expresión Regular
            const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (correo.value.trim() && !regexCorreo.test(correo.value.trim())) {
                correo.classList.add('campo-error');
                mostrarToast('El correo no tiene un formato válido', '⚠️');
                return;
            }

            // Validación de coincidencia exacta entre contraseña y confirmación
            if (clave.value !== clave2.value) {
                clave.classList.add('campo-error');
                clave2.classList.add('campo-error');
                mostrarToast('Las contraseñas no coinciden', '❌');
                return;
            }

            if (hayError) {
                mostrarToast('Todos los campos son obligatorios', '⚠️');
                return;
            }

            // Persistencia del perfil recién creado
            localStorage.setItem('usuario_rol', tipo.value);
            localStorage.setItem('usuario_nombre', nombre.value.trim());

            mostrarToast('Cuenta creada con éxito', '✅');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        });
    }

    
    // 5.C FORMULARIO DE CONTACTO (contacto.html)

    if (window.location.pathname.includes('contacto.html')) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.querySelector('#nombre');
            const correo = document.querySelector('#correo');
            const mensaje = document.querySelector('#mensaje');
            let hayError = false;

            // Validación de campos vacíos
            [nombre, correo, mensaje].forEach(c => {
                if (!c.value.trim()) {
                    c.classList.add('campo-error');
                    hayError = true;
                } else {
                    c.classList.remove('campo-error');
                }
            });

            // Validación de formato de correo
            const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (correo.value.trim() && !regexCorreo.test(correo.value.trim())) {
                correo.classList.add('campo-error');
                mostrarToast('Ingresa un correo válido', '⚠️');
                return;
            }

            if (hayError) {
                mostrarToast('Por favor completa todos los campos', '⚠️');
                return;
            }

            // Envío exitoso y reseteo de campos
            mostrarToast('Mensaje enviado. Te responderemos a la brevedad', '✉️');
            formulario.reset();
        });
    }
});