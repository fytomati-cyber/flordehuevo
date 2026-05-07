// --- Variables principales ---
const form = document.getElementById('ventaForm');
const tablaVentasBody = document.getElementById('tablaVentas').querySelector('tbody');
const totalCartones = document.getElementById('total');
const totalVentas = document.getElementById('totalVentas');
const configForm = document.getElementById('configMenu');
const filtroSelect = document.getElementById('filtroTamano');

let acumuladoCartones = 0;
let acumuladoVentas = 0;

// --- 1. Cargar precios desde LocalStorage o usar valores por defecto ---
let precios = JSON.parse(localStorage.getItem("precios")) || {
  chico: 3500,
  mediano: 4500,
  grande: 5500,
  jumbo: 6500
};

// Botón configuración
const boton = document.getElementById("mostrarConfig");
const menu = document.getElementById("configuracion");
boton.addEventListener("click", () => {
  menu.style.display = (menu.style.display === "none") ? "block" : "none";
  boton.textContent = (menu.style.display === "block") ? "Ocultar Configuración" : "Configuración";
});

// Mostrar valores en el formulario de configuración
document.getElementById("precioChico").value = precios.chico;
document.getElementById("precioMediano").value = precios.mediano;
document.getElementById("precioGrande").value = precios.grande;
document.getElementById("precioJumbo").value = precios.jumbo;

// --- 2. Guardar cambios de configuración ---
configForm.addEventListener("submit", function(e) {
  e.preventDefault();
  precios.chico = parseInt(document.getElementById("precioChico").value);
  precios.mediano = parseInt(document.getElementById("precioMediano").value);
  precios.grande = parseInt(document.getElementById("precioGrande").value);
  precios.jumbo = parseInt(document.getElementById("precioJumbo").value);
  localStorage.setItem("precios", JSON.stringify(precios));
  alert("Configuración guardada correctamente ✅");
});

// --- 3. Cargar ventas del día ---
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
ventas.forEach(v => agregarFilaVentas(v.tamano, v.cantidad, v.subtotal));

// Función para agregar fila a tabla de ventas
function agregarFilaVentas(tamano, cantidad, subtotal) {
  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${tamano}</td>
    <td>${cantidad}</td>
    <td>$${subtotal}</td>
    <td><button class="eliminar" style="background-color:#e63946;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️ Eliminar</button></td>
  `;
  tablaVentasBody.appendChild(fila);

  acumuladoCartones += cantidad;
  acumuladoVentas += subtotal;

  totalCartones.textContent = acumuladoCartones;
  totalVentas.textContent = `$${acumuladoVentas}`;
}

// --- Registrar nueva venta ---
form.addEventListener('submit', function(event) {
  event.preventDefault();

  const tamanoSeleccionado = document.querySelector('input[name="tamano"]:checked');
  const cantidad = parseInt(document.getElementById('cantidad').value);

  if (!tamanoSeleccionado || cantidad <= 0) return;

  const tamano = tamanoSeleccionado.value.toLowerCase();
  const precioUnitario = precios[tamano];
  const subtotal = precioUnitario * cantidad;

  // Guardar en ventas del día
  const venta = { tamano, cantidad, subtotal };
  ventas.push(venta);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  agregarFilaVentas(tamano, cantidad, subtotal);
  registrarVentaHistorial(tamano, cantidad, precioUnitario);

  form.reset();
});

// --- Eliminar ventas ---
tablaVentasBody.addEventListener('click', function(event) {
  if (event.target.classList.contains('eliminar')) {
    const fila = event.target.closest('tr');
    const tamano = fila.children[0].textContent.toLowerCase();
    const cantidad = parseInt(fila.children[1].textContent);
    const subtotal = parseInt(fila.children[2].textContent.replace('$',''));

    acumuladoCartones -= cantidad;
    acumuladoVentas -= subtotal;

    totalCartones.textContent = acumuladoCartones;
    totalVentas.textContent = `$${acumuladoVentas}`;

    // Actualizar ventas del día
    ventas = ventas.filter(v => !(v.tamano === tamano && v.cantidad === cantidad && v.subtotal === subtotal));
    localStorage.setItem("ventas", JSON.stringify(ventas));

    fila.remove();
  }
});

// --- 4. Historial de ventas diarias ---
const historialVentas = JSON.parse(localStorage.getItem("ventasDiarias")) || [];
const tablaHistorialBody = document.querySelector("#historialVentas tbody");

// Mostrar historial guardado al iniciar
historialVentas.forEach(v => agregarFilaHistorial(v));

function registrarVentaHistorial(tamano, cantidad, precioUnitario) {
  const venta = {
    fecha: new Date().toLocaleDateString(),
    tamaño: tamano,
    cantidad: cantidad,
    total: cantidad * precioUnitario
  };

  historialVentas.push(venta);
  localStorage.setItem("ventasDiarias", JSON.stringify(historialVentas));
  agregarFilaHistorial(venta);
}

function agregarFilaHistorial(venta) {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>${venta.fecha}</td>
    <td>${venta.tamaño}</td>
    <td>${venta.cantidad}</td>
    <td>$${venta.total}</td>
  `;
  tablaHistorialBody.appendChild(fila);
}

// --- 5. Filtro por tamaño ---
filtroSelect.addEventListener("change", () => {
  const tamano = filtroSelect.value;
  tablaVentasBody.innerHTML = "";
  acumuladoCartones = 0;
  acumuladoVentas = 0;

  let filtradas = ventas;
  if (tamano !== "todos") {
    filtradas = ventas.filter(v => v.tamano === tamano.toLowerCase());
  }
  filtradas.forEach(v => agregarFilaVentas(v.tamano, v.cantidad, v.subtotal));
});

// Botón de descarga
const btnDescargar = document.getElementById("descargarExcel");

btnDescargar.addEventListener("click", () => {
  // Obtener historial desde LocalStorage
  const historialVentas = JSON.parse(localStorage.getItem("ventasDiarias")) || [];

  if (historialVentas.length === 0) {
    alert("No hay ventas registradas en el historial 📉");
    return;
  }

  // Convertir a hoja de Excel
  const hoja = XLSX.utils.json_to_sheet(historialVentas);

  // Crear libro y añadir hoja
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Historial Ventas");

  // Descargar archivo
  XLSX.writeFile(libro, "Historial_Ventas.xlsx");
});

