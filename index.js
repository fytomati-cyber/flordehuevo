// ==========================================
// 1. ESTADO INICIAL Y CONFIGURACIÓN
// ==========================================
let precios = JSON.parse(localStorage.getItem("precios")) || { super: 3500, mediano: 4500, grande: 5500, extra: 6500 };
let stock = JSON.parse(localStorage.getItem("stock")) || { super: 100, mediano: 100, grande: 100, extra: 100 };
let ventas = JSON.parse(localStorage.getItem("ventas")) || []; // Ventas del día
let ventasDiarias = JSON.parse(localStorage.getItem("ventasDiarias")) || []; // Historial permanente

let grafico;
let tamanoSeleccionadoRapido = 'super';

// Referencias al DOM
const tablaVentasBody = document.querySelector('#tablaVentas tbody');
const tablaHistorialBody = document.querySelector("#historialVentas tbody");

// ==========================================
// 2. FUNCIONES DE INTERFAZ (RENDER)
// ==========================================

function renderTodo() {
    // Actualizar Panel de Stock
    document.getElementById('st-super').textContent = stock.super;
    document.getElementById('st-mediano').textContent = stock.mediano;
    document.getElementById('st-grande').textContent = stock.grande;
    document.getElementById('st-extra').textContent = stock.extra;

    // Renderizar Tabla de Ventas del Día
    tablaVentasBody.innerHTML = "";
    let acumCant = 0;
    let acumPesos = 0;

    ventas.forEach((v, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${v.tamano.toUpperCase()}</td>
            <td>${v.cantidad}</td>
            <td>$${v.subtotal}</td>
            <td><button onclick="eliminarVenta(${index})" style="background:#e63946; color:white; border:none; padding:5px; border-radius:5px; cursor:pointer;">🗑️</button></td>
        `;
        tablaVentasBody.appendChild(fila);
        acumCant += v.cantidad;
        acumPesos += v.subtotal;
    });

    document.getElementById('total').textContent = acumCant;
    document.getElementById('totalVentas').textContent = `$${acumPesos}`;

    // Renderizar Historial (últimas 10) y Gráfico
    renderHistorial();
    actualizarGrafico();
}

function renderHistorial() {
    tablaHistorialBody.innerHTML = "";
    // Solo las últimas 10 ventas, con la más reciente arriba
    const ultimasDiez = ventasDiarias.slice(-10).reverse(); 

    ultimasDiez.forEach(v => {
        const fila = document.createElement("tr");
        if (v.eliminado) {
            fila.classList.add('fila-eliminada'); // Asegúrate de tener esta clase en tu CSS
        }

        fila.innerHTML = `
            <td>${v.fecha}</td>
            <td>${v.tamaño.toUpperCase()} ${v.eliminado ? '(ELIMINADO)' : ''}</td>
            <td>${v.cantidad}</td>
            <td>$${v.total}</td>
        `;
        tablaHistorialBody.appendChild(fila);
    });
}

// ==========================================
// 3. LÓGICA DE NEGOCIO Y OPERACIONES
// ==========================================

function seleccionarTamano(tamano, elemento) {
    tamanoSeleccionadoRapido = tamano;
    document.querySelectorAll('.btn-cat').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
}

function ventaRapida(cant) {
    const tamano = tamanoSeleccionadoRapido;
    
    if (stock[tamano] < cant) {
        alert("¡No hay suficiente stock! 🥚");
        return;
    }

    const subtotal = precios[tamano] * cant;
    const nuevaVenta = { tamano, cantidad: cant, subtotal };
    
    stock[tamano] -= cant;
    ventas.push(nuevaVenta);
    
    // Registro permanente
    ventasDiarias.push({
        fecha: new Date().toLocaleString(),
        tamaño: tamano,
        cantidad: cant,
        total: subtotal,
        eliminado: false
    });

    guardarYRefrescar();
}

function eliminarVenta(index) {
    const v = ventas[index];
    
    // Devolver Stock
    stock[v.tamano] += v.cantidad; 

    // Registrar eliminación en el historial permanente (en rojo/negativo)
    ventasDiarias.push({
        fecha: new Date().toLocaleString(),
        tamaño: v.tamano,
        cantidad: -v.cantidad,
        total: -v.subtotal,
        eliminado: true
    });

    // Quitar de la lista del día
    ventas.splice(index, 1);
    guardarYRefrescar();
}

function cerrarCaja() {
    if (confirm("¿Cerrar caja hoy? Se vaciará la tabla del día y el gráfico, pero el historial se mantiene.")) {
        ventas = [];
        localStorage.setItem("ventas", JSON.stringify(ventas));
        renderTodo();
        alert("Caja diaria reseteada. ✅");
    }
}

function guardarYRefrescar() {
    localStorage.setItem("ventas", JSON.stringify(ventas));
    localStorage.setItem("stock", JSON.stringify(stock));
    localStorage.setItem("ventasDiarias", JSON.stringify(ventasDiarias));
    localStorage.setItem("precios", JSON.stringify(precios));
    renderTodo();
}

// ==========================================
// 4. GRÁFICOS Y EVENTOS
// ==========================================

function actualizarGrafico() {
    const ctx = document.getElementById('graficoVentas').getContext('2d');
    const conteo = { super: 0, mediano: 0, grande: 0, extra: 0 };
    ventas.forEach(v => conteo[v.tamano] += v.cantidad);

    if (grafico) grafico.destroy();
    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Super', 'Mediano', 'Grande', 'Extra'],
            datasets: [{
                label: 'Cartones Vendidos Hoy',
                data: [conteo.super, conteo.mediano, conteo.grande, conteo.extra],
                backgroundColor: ['#f4a261', '#e76f51', '#2a9d8f', '#264653']
            }]
        },
        options: { responsive: true }
    });
}

// Eventos de botones y formularios
document.getElementById('btnCierreCaja').addEventListener('click', cerrarCaja);

document.getElementById('mostrarConfig').addEventListener('click', () => {
    const menuConfig = document.getElementById('configuracion');
    menuConfig.style.display = menuConfig.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('configMenu').addEventListener('submit', (e) => {
    e.preventDefault();
    precios.super = parseInt(document.getElementById('precioSuper').value) || precios.super;
    stock.super = parseInt(document.getElementById('inputStSuper').value) || stock.super;
    precios.mediano = parseInt(document.getElementById('precioMediano').value) || precios.mediano;
    stock.mediano = parseInt(document.getElementById('inputStMediano').value) || stock.mediano;
    precios.grande = parseInt(document.getElementById('precioGrande').value) || precios.grande;
    stock.grande = parseInt(document.getElementById('inputStGrande').value) || stock.grande;
    precios.extra = parseInt(document.getElementById('precioExtra').value) || precios.extra;
    stock.extra = parseInt(document.getElementById('inputStExtra').value) || stock.extra;
    
    guardarYRefrescar();
    alert("Datos actualizados correctamente ✅");
});

document.getElementById("descargarExcel").addEventListener("click", () => {
    if (ventasDiarias.length === 0) {
        alert("No hay ventas en el historial 📉");
        return;
    }
    const hoja = XLSX.utils.json_to_sheet(ventasDiarias);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Historial Completo");
    XLSX.writeFile(libro, "Historial_Huevos_Flor.xlsx");
});

// Inicio de la aplicación
renderTodo();
