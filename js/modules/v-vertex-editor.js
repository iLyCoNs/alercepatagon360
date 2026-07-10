// ============================================================
// v-vertex-editor.js — Motor de Edición de Vértices + Fusión
// Herramienta: editar-vertices (panel KPK)
// Arquitectura: layer-vertex-handles (SVG top layer) + drag via draggingVertex global
// ============================================================
'use strict';

window.VertexEditor = (function () {

    // ── Estado ────────────────────────────────────────────────────────────────
    var _active = false;
    var _selectedLotes = [];      // max 2 lineIds
    var _fusionBtnEl = null;

    var HANDLE_LAYER = 'kpk-vertex-edit-layer';
    var HANDLE_CLASS = 'kpk-vertex-edit';

    // ── API Pública ───────────────────────────────────────────────────────────
    function activate() {
        _active = true;
        _selectedLotes = [];
        _ensureLayer();
        _injectFusionButton();
        _updateFusionBtn();
        var svg = document.getElementById('loteo-svg');
        if (svg) svg.classList.add('vertex-edit-mode');
        // Listener de selección en el SVG (capture para interceptar antes que eraser)
        document.addEventListener('pointerdown', _onDocPointerDown, true);
    }

    function deactivate() {
        _active = false;
        document.removeEventListener('pointerdown', _onDocPointerDown, true);
        // Limpiar handles
        _clearLayer();
        // Quitar selecciones
        _clearSelections();
        // Ocultar botón fusión
        if (_fusionBtnEl) _fusionBtnEl.style.display = 'none';
        var svg = document.getElementById('loteo-svg');
        if (svg) svg.classList.remove('vertex-edit-mode');
        // Cancelar cualquier drag en curso
        window.draggingVertex = null;
    }

    function isActive() { return _active; }

    // ── Renderizado de Handles (llamado desde updateSVGPaths cada frame) ──────
    function renderHandles(getCamFn, cx, cy_screen, f) {
        if (!_active) return;
        var layer = document.getElementById(HANDLE_LAYER);
        if (!layer) { _ensureLayer(); layer = document.getElementById(HANDLE_LAYER); }
        if (!layer) return;

        // Solo lotes orgánicos guardados
        var lotes = (window.allDrawnLines || []).filter(function (l) {
            return (l.tipo === 'lote-organico' || l.tipo === 'fila-variable-lote') &&
                   l.puntos && l.puntos.length >= 3;
        });

        var totalPts = lotes.reduce(function (s, l) { return s + l.puntos.length; }, 0);
        var handles = Array.from(layer.querySelectorAll('.' + HANDLE_CLASS));

        // Crear faltantes
        while (handles.length < totalPts) {
            var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', HANDLE_CLASS);
            c.setAttribute('r', '8');
            c.style.cursor = 'grab';
            layer.appendChild(c);
            handles.push(c);
        }
        // Eliminar sobrantes
        while (handles.length > totalPts) {
            var last = handles.pop();
            if (last && last.parentNode) last.parentNode.removeChild(last);
        }

        var hi = 0;
        lotes.forEach(function (line) {
            var isSelected = _selectedLotes.indexOf(line.id) >= 0;
            line.puntos.forEach(function (pt, idx) {
                var h = handles[hi++];
                if (!h) return;
                var cam = getCamFn(pt[0], pt[1]);
                if (cam && cam.z > 0.0001) {
                    var sx = cx + (cam.x / cam.z) * f;
                    var sy = cy_screen - (cam.y / cam.z) * f;
                    h.setAttribute('cx', String(sx));
                    h.setAttribute('cy', String(sy));
                    h.dataset.lineId = line.id;
                    h.dataset.vtxIdx = String(idx);
                    h.dataset.first = idx === 0 ? 'true' : 'false';
                    h.style.display = '';
                    // Estado: dragging / selected / normal
                    var dv = window.draggingVertex;
                    if (dv && dv.type === 'vertex-edit' && dv.lineId === line.id && dv.idx === idx) {
                        h.setAttribute('class', HANDLE_CLASS + ' kpk-ve-dragging');
                    } else if (isSelected) {
                        h.setAttribute('class', HANDLE_CLASS + ' kpk-ve-selected');
                    } else if (idx === 0) {
                        h.setAttribute('class', HANDLE_CLASS + ' kpk-ve-first');
                    } else {
                        h.setAttribute('class', HANDLE_CLASS);
                    }
                } else {
                    h.style.display = 'none';
                    h.dataset.lineId = line.id;
                    h.dataset.vtxIdx = String(idx);
                }
            });
        });
    }

    // ── Eventos de Pointer ────────────────────────────────────────────────────
    function _onDocPointerDown(e) {
        if (!_active) return;
        // ¿Clic en handle de vértice?
        var h = e.target.closest && e.target.closest('.' + HANDLE_CLASS);
        if (h) {
            e.stopPropagation();
            e.preventDefault();
            var lineId = h.dataset.lineId;
            var idx = parseInt(h.dataset.vtxIdx, 10);
            // Registrar en el global draggingVertex que usa v-panorama.js
            window.draggingVertex = {
                type: 'vertex-edit',
                lineId: lineId,
                idx: idx,
                el: h,
                startX: e.clientX,
                startY: e.clientY
            };
            h.setAttribute('class', HANDLE_CLASS + ' kpk-ve-dragging');
            return;
        }
        // ¿Clic en el fill o perímetro de un lote (para selección)?
        var loteEl = e.target.closest && e.target.closest('.lote-interactivo');
        if (loteEl && loteEl.dataset.lineId) {
            // Solo si NO hay drag en curso y NO es el eraser
            if (!window.draggingVertex) {
                e.stopPropagation();
                _toggleSelectLote(loteEl.dataset.lineId);
            }
        }
    }

    // ── Selección de Lotes ────────────────────────────────────────────────────
    function _toggleSelectLote(lineId) {
        var idx = _selectedLotes.indexOf(lineId);
        if (idx >= 0) {
            _selectedLotes.splice(idx, 1);
            _setLoteHighlight(lineId, false);
        } else {
            if (_selectedLotes.length >= 2) {
                var evicted = _selectedLotes.shift();
                _setLoteHighlight(evicted, false);
            }
            _selectedLotes.push(lineId);
            _setLoteHighlight(lineId, true);
        }
        _updateFusionBtn();
    }

    function _setLoteHighlight(lineId, on) {
        var svg = document.getElementById('loteo-svg');
        if (!svg) return;
        var g = svg.querySelector('[data-line-id="' + lineId + '"].lote-interactivo');
        if (!g) return;
        if (on) g.classList.add('kpk-lote-selected');
        else g.classList.remove('kpk-lote-selected');
    }

    function _clearSelections() {
        _selectedLotes.slice().forEach(function (id) { _setLoteHighlight(id, false); });
        _selectedLotes = [];
        _updateFusionBtn();
    }

    // ── Botón Fusionar ────────────────────────────────────────────────────────
    function _injectFusionButton() {
        if (document.getElementById('kpk-fusion-btn')) return;
        var btn = document.createElement('button');
        btn.id = 'kpk-fusion-btn';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M8 6H3v12h5M16 6h5v12h-5M12 3v18M9 9l3-3 3 3M9 15l3 3 3-3"/></svg><span>Fusionar Lotes</span>';
        btn.title = 'Combinar los 2 lotes seleccionados con línea divisoria punteada';
        btn.style.display = 'none';
        btn.addEventListener('click', function () { fusionar(); });
        // Inyectar junto al panel KPK o al body
        var panel = document.getElementById('kpk-panel');
        if (panel) panel.appendChild(btn);
        else document.body.appendChild(btn);
        _fusionBtnEl = btn;
    }

    function _updateFusionBtn() {
        var btn = _fusionBtnEl || document.getElementById('kpk-fusion-btn');
        if (!btn) return;
        btn.style.display = (_active && _selectedLotes.length === 2) ? 'flex' : 'none';
    }

    // ── Algoritmo de Fusión ───────────────────────────────────────────────────
    function fusionar() {
        if (_selectedLotes.length !== 2) return;
        var idA = _selectedLotes[0], idB = _selectedLotes[1];
        var lineA = (window.allDrawnLines || []).find(function (l) { return l.id === idA; });
        var lineB = (window.allDrawnLines || []).find(function (l) { return l.id === idB; });
        if (!lineA || !lineA.puntos || !lineB || !lineB.puntos) return;

        var ptsA = lineA.puntos;
        var ptsB = lineB.puntos;

        // 1. Encontrar los dos pares de vértices más cercanos entre A y B
        var pairs = [];
        ptsA.forEach(function (a, ai) {
            ptsB.forEach(function (b, bj) {
                pairs.push({ ai: ai, bj: bj, d: Math.hypot(a[0] - b[0], a[1] - b[1]) });
            });
        });
        pairs.sort(function (x, y) { return x.d - y.d; });

        var p1 = pairs[0];           // Par más cercano
        var p2 = null;
        // Buscar segundo par sin compartir índice con p1
        for (var k = 1; k < pairs.length; k++) {
            if (pairs[k].ai !== p1.ai && pairs[k].bj !== p1.bj) {
                p2 = pairs[k];
                break;
            }
        }
        if (!p2) p2 = pairs[Math.min(1, pairs.length - 1)];

        // 2. La línea divisoria es el segmento entre los dos pares
        var divPtA1 = ptsA[p1.ai], divPtB1 = ptsB[p1.bj];
        var divPtA2 = ptsA[p2.ai], divPtB2 = ptsB[p2.bj];
        // Usar el punto medio de cada par como vértice del divisor
        var divStart = [(divPtA1[0] + divPtB1[0]) / 2, (divPtA1[1] + divPtB1[1]) / 2];
        var divEnd   = [(divPtA2[0] + divPtB2[0]) / 2, (divPtA2[1] + divPtB2[1]) / 2];

        // 3. Construir polígono fusionado: rotar A desde p1.ai, luego B desde p1.bj
        function rotateAt(arr, start) {
            var n = arr.length;
            return Array.from({ length: n }, function (_, i) { return arr[(start + i) % n]; });
        }
        var rotA = rotateAt(ptsA, p1.ai);
        var rotB = rotateAt(ptsB, p1.bj);
        // Concatenar: A completo, luego B (el punto de unión ya está en A[0]=B[0] aprox.)
        var mergedPts = rotA.concat(rotB);

        // 4. Crear nuevo lote fusionado
        var newId = 'lote_fusion_' + Date.now();
        var newLote = {
            id: newId,
            tipo: 'lote-organico',
            puntos: mergedPts,
            loteStatus: lineA.loteStatus || lineB.loteStatus || 'disponible',
            loteLabel: lineA.loteLabel || lineB.loteLabel || '',
            color: lineA.color || lineB.color || null,
            fusionDivider: [divStart, divEnd]  // los 2 puntos del divisor punteado
        };

        // 5. Eliminar originales (del más alto índice primero)
        var idxA = allDrawnLines.findIndex(function (l) { return l.id === idA; });
        var idxB = allDrawnLines.findIndex(function (l) { return l.id === idB; });
        var removeFirst = idxA > idxB ? idxA : idxB;
        var removeSecond = idxA > idxB ? idxB : idxA;
        allDrawnLines.splice(removeFirst, 1);
        allDrawnLines.splice(removeSecond, 1);
        allDrawnLines.push(newLote);

        // 6. Limpiar DOM de los originales
        var svg = document.getElementById('loteo-svg');
        if (svg) {
            [idA, idB].forEach(function (rid) {
                svg.querySelectorAll('[data-line-id="' + rid + '"]').forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
                if (window.DOMCache && window.DOMCache.paths) delete window.DOMCache.paths[rid];
            });
        }

        // 7. Reset selección y rebuild
        _selectedLotes = [];
        _updateFusionBtn();
        if (typeof syncSVGElements === 'function') syncSVGElements();
        if (typeof updateSVGPaths === 'function') updateSVGPaths();
        if (typeof saveToLocal === 'function') saveToLocal();
        // Auto-save nube con delay
        if (typeof GlobalCloudSave === 'function') setTimeout(function () { GlobalCloudSave(true); }, 1200);

        console.log('[VertexEditor] Fusión completada →', newId);
    }

    // ── Helpers DOM ───────────────────────────────────────────────────────────
    function _ensureLayer() {
        var svg = document.getElementById('loteo-svg');
        if (!svg) return;
        if (!document.getElementById(HANDLE_LAYER)) {
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.id = HANDLE_LAYER;
            svg.appendChild(g);  // siempre encima de todo
        }
    }

    function _clearLayer() {
        var layer = document.getElementById(HANDLE_LAYER);
        if (layer && layer.parentNode) {
            // Vaciar, no eliminar (se reutiliza al reactivar)
            while (layer.firstChild) layer.removeChild(layer.firstChild);
        }
    }

    // ── Exposición ────────────────────────────────────────────────────────────
    return {
        activate: activate,
        deactivate: deactivate,
        isActive: isActive,
        renderHandles: renderHandles,
        fusionar: fusionar
    };

})();
