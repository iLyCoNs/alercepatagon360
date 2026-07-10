// v-kpk-stubs.js — Stubs de funciones eliminadas en migracion Pannellum a Three.js
// Cargado ANTES que v-franja-curva.js para evitar ReferenceError que bloquea arq2_setup
if (typeof window.setupDevModes === 'undefined') {
    window.setupDevModes = function () { console.log('[stubs] setupDevModes OK'); };
}
if (typeof window.togglePinsMode === 'undefined') {
    window.togglePinsMode = function (active) { window.isDevModePinsActive = !!active; };
}
if (typeof window.toggleDrawMode === 'undefined') {
    window.toggleDrawMode = function (active) { window.isDevModeDrawActive = !!active; };
}
if (typeof window.initPannellum === 'undefined') {
    window.initPannellum = function () { console.log('[stubs] initPannellum OK (Three.js activo)'); };
}
console.log('[v-kpk-stubs] Stubs instalados.');
