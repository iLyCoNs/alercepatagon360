// =================================================================
// KpranoKiller Motor Maestro - Herramientas 2030
// Modulo autonomo: Alt+A registrado en DOMContentLoaded.
// No depende de arq2_setup() ni de Pannellum.
// =================================================================
(function () {
    use strict;
    var kpkOpen = false;
    var kpkActiveTool = null;

    var KPK_GUIDE = {
        lote-libre:       Clic en cada esquina del terreno. Cierra acercandote al origen o con Enter.,
        calle-curva-arq2: Clic a lo largo del eje de la calle. Enter para finalizar con curvas suaves.,
        relleno-auto:     Dibuja el contorno. Al cerrar, se asigna numero automaticamente.,
        fila-variable:    Dibuja contorno de TODA la hilera. El modal dividira en lotes proporcionales.,
        kprano-capsule:   Clic en cualquier punto de la foto para anclar una Capsula Espacial 3D.,
        eraser:           Clic sobre cualquier elemento para eliminarlo del mapa.,
        costura:          Lote que comparte borde con uno existente. El borde compartido se marca solo.
    };

    function kpk_buildPanel() {
        var p = document.createElement(div);
        p.id = kpk-panel;
        p.innerHTML = [
            '<div class=kpk-panel-header>',
            '  <div class=kpk-traffic>',
            '    <span class=kpk-dot kpk-dot-close id=kpk-close-btn></span>',
            '    <span class=kpk-dot kpk-dot-min></span>',
            '    <span class=kpk-dot kpk-dot-max></span>',
            '  </div>',
            '  <span class=kpk-panel-title>KpranoKiller</span>',
            '  <span class=kpk-panel-badge>PRO</span>',
            '</div>',
            '<div class=kpk-status-bar id=kpk-status>',
            '  <span class=kpk-status-dot id=kpk-status-dot></span>',
            '  <span id=kpk-status-text>Selecciona una herramienta</span>',
            '</div>',
            '<div class=kpk-divider></div>',
            '<div class=kpk-group-label>Diseno de Terreno</div>',
            '<div class=kpk-tools-grid>',
            '  <button class=kpk-tool data-tool=lote-libre title=Lote libre a mano alzada>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z/><path d=M13 13l6 6/></svg>',
            '    <span>Lote</span>',
            '  </button>',
            '  <button class=kpk-tool data-tool=calle-curva-arq2 title=Calle con curvas suaves>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M3 17c3-3 5-5 8-5s5 2 9 2/><path d=M3 7c3 3 5 5 8 5s5-2 9-2/></svg>',
            '    <span>Calle</span>',
            '  </button>',
            '  <button class=kpk-tool data-tool=relleno-auto title=Lote numerado automatico>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><rect x=3 y=3 width=18 height=18 rx=2/><path d=M9 3v18M15 3v18M3 9h18M3 15h18/></svg>',
            '    <span>Auto</span>',
            '  </button>',
            '  <button class=kpk-tool data-tool=fila-variable title=Hilera de lotes proporcionales>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><rect x=2 y=7 width=20 height=10 rx=1/><line x1=8 y1=7 x2=8 y2=17/><line x1=14 y1=7 x2=14 y2=17/></svg>',
            '    <span>Hilera</span>',
            '  </button>',
            '</div>',
            '<div class=kpk-group-label>Smart Points</div>',
            '<div class=kpk-tools-grid>',
            '  <button class=kpk-tool kpk-tool-highlight data-tool=kprano-capsule title=Capsula 3D anclada a la foto>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z/><circle cx=12 cy=10 r=3/></svg>',
            '    <span>Capsula</span>',
            '  </button>',
            '</div>',
            '<div class=kpk-group-label>Edicion</div>',
            '<div class=kpk-tools-grid>',
            '  <button class=kpk-tool kpk-tool-danger data-tool=eraser title=Borrar elementos>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M20 20H7L3 16l13-13 4 4-6.5 6.5/><path d=M6 15l3 5/></svg>',
            '    <span>Borrar</span>',
            '  </button>',
            '  <button class=kpk-tool data-tool=costura title=Lote que comparte borde>',
            '    <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M12 2L2 7l10 5 10-5-10-5z/><path d=M2 17l10 5 10-5/><path d=M2 12l10 5 10-5/></svg>',
            '    <span>Costura</span>',
            '  </button>',
            '</div>',
            '<div class=kpk-divider></div>',
            '<div class=kpk-guide-box id=kpk-guide-box>',
            '  <p id=kpk-guide-text>Elige una herramienta para comenzar a disenar sobre la foto 360.</p>',
            '</div>',
            '<button class=kpk-save-btn onclick=typeof GlobalCloudSave===\'function\'&&GlobalCloudSave()>',
            '  <svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><path d=M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z/><polyline points=17 21 17 13 7 13 7 21/><polyline points=7 3 7 8 15 8/></svg>',
            '  Guardar en Nube',
            '</button>'
        ].join(");
 return p;
 }

 function kpk_buildFAB() {
 var btn = document.createElement(button);
 btn.id = kpk-fab;
 btn.title = KpranoKiller - Panel Diseno (Alt+A);
 btn.innerHTML = '<svg viewBox=0 0 24 24 fill=none stroke=currentColor stroke-width=1.5><polygon points=12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2/><line x1=12 y1=8 x2=12 y2=13/><line x1=12 y1=16.5 x2=12.01 y2=16.5/></svg>';
 return btn;
 }

 function kpk_init() {
 var panel = kpk_buildPanel();
 var fab = kpk_buildFAB();
 document.body.appendChild(panel);
 document.body.appendChild(fab);

 document.getElementById(kpk-close-btn).addEventListener(click, function(){ kpk_toggle(false); });
 fab.addEventListener(click, function(){ kpk_toggle(); });

 document.querySelectorAll(.kpk-tool[data-tool]).forEach(function(btn){
 btn.addEventListener(click, function(){ kpk_setTool(btn.dataset.tool); });
 });

 // ALT+A — Unico listener, registrado aqui, ejecutado siempre al cargar la pagina
 document.addEventListener(keydown, function(e){
 if (e.altKey && (e.key === a || e.key === A) && !e.ctrlKey && !e.metaKey) {
 var tag = document.activeElement && document.activeElement.tagName;
 if (tag === INPUT || tag === TEXTAREA || tag === SELECT) return;
 e.preventDefault();
 kpk_toggle();
 }
 });

 console.log([KpranoKiller] Motor listo. Alt+A = abrir/cerrar panel.);
 }

 function kpk_toggle(force) {
 kpkOpen = (typeof force === boolean) ? force : !kpkOpen;
 var panel = document.getElementById(kpk-panel);
 var fab = document.getElementById(kpk-fab);
 if (!panel) return;

 panel.classList.toggle(kpk-panel-open, kpkOpen);
 if (fab) fab.classList.toggle(kpk-fab-active, kpkOpen);

 // Sincronizar con motor arq2
 window.isArquitecto2Active = kpkOpen;
 document.body.classList.toggle(arq2-active, kpkOpen);
 if (typeof arq2_toggleArquitecto2 === function) {
 try { arq2_toggleArquitecto2(kpkOpen); } catch(e){}
 }

 if (!kpkOpen) {
 kpk_setStatus(idle, Selecciona una herramienta);
 document.querySelectorAll(.kpk-tool).forEach(function(b){ b.classList.remove(kpk-tool-active); });
 }
 }

 function kpk_setTool(tool) {
 kpkActiveTool = tool;
 document.querySelectorAll(.kpk-tool).forEach(function(b){ b.classList.remove(kpk-tool-active); });
 var btn = document.querySelector(.kpk-tool[data-tool=" + tool + "]);
 if (btn) btn.classList.add(kpk-tool-active);

 var guide = document.getElementById(kpk-guide-text);
 if (guide) guide.textContent = KPK_GUIDE[tool] || Herramienta activa.;

 kpk_setStatus(active, Activo:  + tool);

 if (typeof arq2_setTool === function) {
 try { arq2_setTool(tool); } catch(e){}
 } else {
 window.arq2Tool = tool;
 }
 }

 function kpk_setStatus(state, msg) {
 var dot = document.getElementById(kpk-status-dot);
 var text = document.getElementById(kpk-status-text);
 if (!dot || !text) return;
 dot.className = kpk-status-dot;
 if (state === active) dot.classList.add(kpk-status-active);
 if (state === warning) dot.classList.add(kpk-status-warning);
 if (state === error) dot.classList.add(kpk-status-error);
 text.textContent = msg || ;
 }

 window.kpk_toggle = kpk_toggle;
 window.kpk_setTool = kpk_setTool;
 window.kpk_setStatus = kpk_setStatus;

 if (document.readyState === loading) {
 document.addEventListener(DOMContentLoaded, kpk_init);
 } else {
 kpk_init();
 }
})();
