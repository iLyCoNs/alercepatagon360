// =======================================================================
// KPK Draw HUD v2 — Motor de feedback visual del lápiz (60 FPS)
// Sistema 100% independiente: divs HTML + SVG canvas propio.
// NUNCA es afectado por refreshAllHotspots() ni syncSVGElements().
// =======================================================================
(function () {
    'use strict';

    var container  = null;  // #panorama-container
    var hudSvg     = null;  // <svg> exclusivo para líneas
    var hudLayer   = null;  // <div> contenedor de nodos
    var polyEl     = null;  // <polyline> persistente
    var guideEl    = null;  // <line> guía fantasma
    var nodePool   = [];    // pool de <div.kpk-hud-node>
    var isRunning  = false;
    var prevCount  = 0;     // cantidad de nodos en el frame anterior
    var wasEmpty   = true;  // estado del frame anterior

    var NODE_RADIUS = 7;    // mitad del tamaño en px (14px div)

    // ── Construir infraestructura DOM ───────────────────────────────
    function buildHUD() {
        container = document.getElementById('panorama-container');
        if (!container) return false;

        if (!document.getElementById('kpk-hud-layer')) {
            hudLayer = document.createElement('div');
            hudLayer.id = 'kpk-hud-layer';
            container.appendChild(hudLayer);
        } else {
            hudLayer = document.getElementById('kpk-hud-layer');
        }

        if (!document.getElementById('kpk-hud-svg')) {
            hudSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            hudSvg.id = 'kpk-hud-svg';
            container.appendChild(hudSvg);

            // Polilínea persistente
            polyEl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyEl.setAttribute('class', 'kpk-hud-polyline');
            polyEl.style.display = 'none';
            hudSvg.appendChild(polyEl);

            // Línea guía persistente
            guideEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            guideEl.setAttribute('class', 'kpk-hud-guide');
            guideEl.style.display = 'none';
            hudSvg.appendChild(guideEl);
        } else {
            hudSvg  = document.getElementById('kpk-hud-svg');
            polyEl  = hudSvg.querySelector('.kpk-hud-polyline');
            guideEl = hudSvg.querySelector('.kpk-hud-guide');
        }

        return true;
    }

    // ── Obtener / crear nodo del pool ────────────────────────────────
    function getNode(idx) {
        if (idx < nodePool.length) return nodePool[idx];
        var nd = document.createElement('div');
        nd.className = 'kpk-hud-node';
        nd.style.display = 'none';
        hudLayer.appendChild(nd);
        nodePool.push(nd);
        return nd;
    }

    // ── Ocultar nodos sobrantes ──────────────────────────────────────
    function hideExcessNodes(from) {
        for (var k = from; k < nodePool.length; k++) {
            nodePool[k].style.display = 'none';
        }
    }

    // ── Limpiar todo el HUD ──────────────────────────────────────────
    function clearHUD() {
        hideExcessNodes(0);
        if (polyEl)  polyEl.style.display  = 'none';
        if (guideEl) guideEl.style.display = 'none';
        wasEmpty = true;
        prevCount = 0;
    }

    // ── Obtener puntos activos (lee globals del motor arq2) ──────────
    function getActivePts() {
        if (!window.isArquitecto2Active) return null;
        var tool = window.arq2Tool;
        if (!tool) return null;
        // Herramientas que usan arq2LinePoints
        var useArq2 = (tool === 'lote-libre' || tool === 'lote-organico' ||
                       tool === 'fila-variable' || tool === 'costura' ||
                       tool === 'relleno-auto');
        if (useArq2 && typeof arq2LinePoints !== 'undefined' && arq2LinePoints.length > 0) {
            return arq2LinePoints;
        }
        return null;
    }

    // ── Proyectar punto pitch/yaw a pantalla (relativo al container) ─
    function project(pitch, yaw, getCam, cx, cy_screen, f) {
        var cam = getCam(pitch, yaw);
        if (!cam || cam.z <= 0.0001) return null;
        return {
            x: cx + (cam.x / cam.z) * f,
            y: cy_screen - (cam.y / cam.z) * f
        };
    }

    // ── Frame de render (60 FPS via rAF) ────────────────────────────
    function renderFrame() {
        requestAnimationFrame(renderFrame);

        // Asegurar que el HUD exista (puede haberse destruido)
        if (!hudLayer || !hudSvg) { buildHUD(); return; }

        var pts = getActivePts();

        if (!pts || pts.length === 0) {
            if (!wasEmpty) clearHUD();
            return;
        }
        wasEmpty = false;

        // Obtener contexto de cámara
        var camCtx = (typeof arq2_getCameraContext === 'function') ? arq2_getCameraContext() : null;
        if (!camCtx) return;

        var getCam = camCtx.getCam;
        var cx = camCtx.cx, cy_screen = camCtx.cy_screen, f = camCtx.f;

        // ── Proyectar todos los puntos ──
        var projected = new Array(pts.length);
        var polyPoints = [];
        for (var i = 0; i < pts.length; i++) {
            var pt = pts[i];
            if (!pt || pt.length < 2) { projected[i] = null; continue; }
            var s = project(pt[0], pt[1], getCam, cx, cy_screen, f);
            projected[i] = s;
            if (s) polyPoints.push(s.x.toFixed(1) + ',' + s.y.toFixed(1));
        }

        // ── Sincronizar nodos div ──
        for (var i = 0; i < pts.length; i++) {
            var nd = getNode(i);
            var s = projected[i];
            if (!s) { nd.style.display = 'none'; continue; }
            nd.style.display = '';
            nd.style.left = (s.x - NODE_RADIUS) + 'px';
            nd.style.top  = (s.y - NODE_RADIUS) + 'px';
            // Clases de rol (solo reasignar cuando cambien)
            var wantFirst = (i === 0);
            var wantLast  = (i === pts.length - 1) && (i !== 0);
            var hasFirst  = nd.classList.contains('kpk-hud-first');
            var hasLast   = nd.classList.contains('kpk-hud-last');
            if (wantFirst !== hasFirst) nd.classList.toggle('kpk-hud-first', wantFirst);
            if (wantLast  !== hasLast)  nd.classList.toggle('kpk-hud-last', wantLast);
        }
        hideExcessNodes(pts.length);
        prevCount = pts.length;

        // ── Polilínea entre vértices ──
        if (polyPoints.length >= 2) {
            polyEl.setAttribute('points', polyPoints.join(' '));
            polyEl.style.display = '';
        } else {
            polyEl.style.display = 'none';
        }

        // ── Línea guía fantasma (último punto → cursor) ──
        var lastS = projected[pts.length - 1];
        if (lastS && window.lastMouseX !== undefined && window.lastMouseY !== undefined) {
            var rect = container.getBoundingClientRect();
            var mx = window.lastMouseX - rect.left;
            var my = window.lastMouseY - rect.top;
            guideEl.setAttribute('x1', lastS.x.toFixed(1));
            guideEl.setAttribute('y1', lastS.y.toFixed(1));
            guideEl.setAttribute('x2', mx.toFixed(1));
            guideEl.setAttribute('y2', my.toFixed(1));
            guideEl.style.display = '';
        } else {
            guideEl.style.display = 'none';
        }
    }

    // ── Arranque ─────────────────────────────────────────────────────
    function start() {
        if (isRunning) return;
        if (!buildHUD()) {
            setTimeout(start, 600);
            return;
        }
        isRunning = true;
        renderFrame();
        console.log('[KPK HUD v2] Motor de feedback del lápiz iniciado. ✓');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 1200); });
    } else {
        setTimeout(start, 1200);
    }

    window.KpkDrawHud = { start: start, clear: clearHUD };

})();
