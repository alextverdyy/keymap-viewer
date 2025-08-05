

import "external-svg-loader";
require('@mdi/font/css/materialdesignicons.min.css');

document.addEventListener('DOMContentLoaded', async () => {
	// Cargar el módulo de configuración dinámicamente
	let keymapConfig;
	try {
		keymapConfig = await import('./keymapConfig.js');
	} catch (e) {
		console.error("No se pudo cargar keymapConfig.js:", e);
		return; // Salir si no se puede cargar la configuración
	}



	const { ZMK_KEYCODE_MAP, MOD_ICON_MAP, getFullIconPath } = keymapConfig;
	const keyboardContainer = document.getElementById('keyboard-container');
	const legendContainer = document.getElementById('legend-container');

	// MAPA COMPLETO DE KEYCODES A SÍMBOLOS Y ICONOS
	const KEY_DISPLAY_MAP = {
		// Modificadores (con preferencia a iconos)
		'LCTL': { text: 'Ctrl' }, 'RCTL': { text: 'Ctrl' },
		'LALT': { text: 'Alt' }, 'RALT': { text: 'Alt' },
		'LGUI': { text: 'Gui' }, 'RGUI': { text: 'Gui' },
		'LSHFT': { text: 'Shift' }, 'RSHFT': { text: 'Shift' },
		'CAPS': { text: '⇪' },

		// Letras y Números (se mostrarán tal cual)
		'A': { text: 'A' }, 'B': { text: 'B' }, 'C': { text: 'C' }, 'D': { text: 'D' }, 'E': { text: 'E' }, 'F': { text: 'F' }, 'G': { text: 'G' }, 'H': { text: 'H' }, 'I': { text: 'I' }, 'J': { text: 'J' }, 'K': { text: 'K' }, 'L': { text: 'L' }, 'M': { text: 'M' }, 'N': { text: 'N' }, 'O': { text: 'O' }, 'P': { text: 'P' }, 'Q': { text: 'Q' }, 'R': { text: 'R' }, 'S': { text: 'S' }, 'T': { text: 'T' }, 'U': { text: 'U' }, 'V': { text: 'V' }, 'W': { text: 'W' }, 'X': { text: 'X' }, 'Y': { text: 'Y' }, 'Z': { text: 'Z' },
		'N1': { text: '1' }, 'N2': { text: '2' }, 'N3': { text: '3' }, 'N4': { text: '4' }, 'N5': { text: '5' }, 'N6': { text: '6' }, 'N7': { text: '7' }, 'N8': { text: '8' }, 'N9': { text: '9' }, 'N0': { text: '0' },

		// Símbolos
		'COMMA': { text: ',' }, 'DOT': { text: '.' }, 'SEMI': { text: ';' }, 'SQT': { text: "'" }, 'GRAVE': { text: '`' },
		'MINUS': { text: '-' }, 'EQUAL': { text: '=' }, 'BSLH': { text: '\\' }, 'FSLH': { text: '/' },
		'LBKT': { text: '[' }, 'RBKT': { text: ']' }, 'LPAR': { text: '(' }, 'RPAR': { text: ')' },
		'EXCL': { text: '!' }, 'AT': { text: '@' }, 'HASH': { text: '#' }, 'DLLR': { text: '$' }, 'PRCNT': { text: '%' }, 'CARET': { text: '^' }, 'AMPS': { text: '&' }, 'STAR': { text: '*' }, 'PIPE': { text: '|' },

		// Teclas de Acción (con preferencia a iconos)
		'RET': { icon: 'mdi-keyboard-return' }, 'ENTER': { icon: 'mdi-keyboard-return' },
		'ESC': { icon: 'mdi-keyboard-esc' },
		'BSPC': { icon: 'mdi-backspace' },
		'DEL': { icon: 'mdi-backspace-reverse' },
		'TAB': { icon: 'mdi-keyboard-tab' },
		'SPACE': { icon: 'mdi-keyboard-space' },

		// Otras
		'C_VOL_UP': { icon: 'mdi-volume-high' },
		'C_VOL_DN': { icon: 'mdi-volume-low' },
		'C_PP': { icon: 'mdi-play-pause' },
		'C_MUTE': { icon: 'mdi-volume-mute' },
		'BOOTLOADER': { icon: 'mdi-code-block-tags' },
		'SYS_RESET': { icon: 'mdi-restart' },
		'BT': { icon: 'mdi-bluetooth' },
		'none': { text: '' },
		'trans': { text: '' },
		'___': { text: '' },
	};

	const LABEL_POSITIONS = ['tl', 'tr', 'bl', 'br', 'b'];

	import('./keymap_data.json')
		.then(data => {
			renderKeyboard(data);
			renderLegend(data.layer_order);
		})
		.catch(error => {
			console.error('Error fatal:', error);
			keyboardContainer.innerHTML = `<p style="color: red;">Error al cargar. Revisa la consola (F12).</p><pre>${error.stack}</pre>`;
		});

	function renderKeyboard(data) {
		const { layout, keymap, layer_order, sensors } = data;
		const scale = 70;
		const sensorRefs = sensors.map(s => s.ref);

		layout.forEach((keyDef, index) => {
			const keycap = document.createElement('div');
			keycap.className = 'keycap';

			const x = (keyDef.x || 0) * scale;
			const y = (keyDef.y || 0) * scale;
			const width = (keyDef.w || 1) * scale - 4;
			const height = (keyDef.h || 1) * scale - 4;
			keycap.style.left = `${x}px`;
			keycap.style.top = `${y}px`;
			keycap.style.width = `${width}px`;
			keycap.style.height = `${height}px`;
			if (keyDef.r) {
				const rx = keyDef.rx ? keyDef.rx * scale : x + width / 2;
				const ry = keyDef.ry ? keyDef.ry * scale : y + height / 2;
				keycap.style.transformOrigin = `${rx - x}px ${ry - y}px`;
				keycap.style.transform = `rotate(${keyDef.r}deg)`;
			}

			if (keyDef.label && sensorRefs.includes(keyDef.label)) {
				keycap.classList.add('encoder');
			}

			let isHrm = false;
			let pos_idx = 0;

			layer_order.forEach((layerName, layerIndex) => {
				const binding = keymap[layerName]?.[index];
				const binding_base = keymap[layer_order[0]]?.[index];
				if (!binding || !binding.behavior || binding.original === '___' || binding.behavior === 'trans') return;
				if (['hml', 'hmr'].includes(binding_base.behavior)) isHrm = true;

				const position = (layerIndex === 0) ? 'center' : (pos_idx < LABEL_POSITIONS.length ? LABEL_POSITIONS[pos_idx++] : null);
				if (position) {
					const label = createLabel(binding, position, layerName);
					if (layerIndex > 0) {
						label.style.color = `var(--layer-color-${layerIndex}, #6c757d)`;
					}
					// label.innerHTML = `${label.innerHTML} ${index}`;
					keycap.appendChild(label);
				}
			});

			if (isHrm) keycap.classList.add('is-hrm');
			keyboardContainer.appendChild(keycap);
		});
	}

	function createLabel(binding, position, layerName = '') {
		const label = document.createElement('div');
		label.className = `label label-${position}`;

		const behavior = binding.behavior;
		const params = binding.params || [];
		let keycode = '';

		if (['hml', 'hmr'].includes(behavior)) {
			const holdMod = params[0];
			const tapKey = params[1];

			const mainLabel = document.createElement('div');
			mainLabel.className = 'label-main-content';
			mainLabel.innerHTML = getDisplayContent(tapKey);
			label.appendChild(mainLabel);

			const holdLabel = document.createElement('div');
			holdLabel.className = 'label label-b';
			holdLabel.innerHTML = getDisplayContent(holdMod);
			label.appendChild(holdLabel);

		} else {
			if (behavior === 'kp' || behavior === 'bootloader' || behavior === 'sys_reset') {
				keycode = params[0] || behavior;
			} else if (['lt', 'hll', 'hlr'].includes(behavior)) {
				keycode = params[1];
			} else if (behavior === 'bt') {
				keycode = 'BT';
			} else {
				keycode = binding.original;
			}
			label.innerHTML = getDisplayContent(keycode);
		}

		if (layerName) label.title = `${layerName}: ${binding.original}`;

		return label;
	}


	function normalizeKeycode(raw) {
		if (!raw) return { text: "", html: "", icon: null };

		let key = raw.replace(/^&/, '').trim().toUpperCase();

		// 🔹 Detectar modificadores tipo RG(PLUS), LS(TAB), LA(F4), etc.
		const modMatch = key.match(/^([LR][CSAG])\((.+)\)$/i);
		if (modMatch) {
			const modKey = modMatch[1].toUpperCase();
			const modInfo = MOD_ICON_MAP[modKey] || { text: modKey, html: modKey, icon: null };
			const inner = normalizeKeycode(modMatch[2]);

			// Combinar iconos si ambos existen
			let combinedIcon = modInfo.icon;
			if (modInfo.icon && inner.icon) {
				// Lógica para combinar iconos si es necesario
				// Por ahora, usamos el del modificador
			}

			return {
				text: modInfo.text + inner.text,
				html: modInfo.html + inner.html,
				icon: combinedIcon
			};
		}

		// 🔹 Manejar keycodes compuestos como &sk LCTRL, &mkp LCLK, &mt GLOBE MAC_REDO
		if (key.includes(' ')) {
			const parts = key.split(' ');
			const firstPart = parts[0];

			if (ZMK_KEYCODE_MAP[firstPart]) {
				const first = ZMK_KEYCODE_MAP[firstPart];
				const restParts = parts.slice(1);
				let restText = '';
				let restHtml = '';
				let restIcon = null; // Tomamos el icono del primer elemento significativo

				// Procesar cada parte restante
				for (let i = 0; i < restParts.length; i++) {
					const partNormalized = normalizeKeycode(restParts[i]);
					restText += (i > 0 ? ' ' : '') + partNormalized.text;
					restHtml += (i > 0 ? ' ' : '') + partNormalized.html;
					if (!restIcon && partNormalized.icon) {
						restIcon = partNormalized.icon;
					}
				}

				return {
					text: first.text + ' ' + restText,
					html: first.html + ' ' + restHtml,
					icon: first.icon || restIcon // Priorizamos el icono del comportamiento
				};
			}
		}

		// 🔹 Buscar en ZMK_KEYCODE_MAP
		if (ZMK_KEYCODE_MAP[key]) return ZMK_KEYCODE_MAP[key];

		// 🔹 Fallback - letras y números simples
		if (/^[A-Z0-9]$/.test(key)) {
			return { text: key, html: key, icon: null };
		}

		// 🔹 Fallback final
		return { text: raw, html: raw, icon: null };
	}


	function getDisplayContent(keycode, fallbackText = null, displayMode = 'html') {
		if (!keycode || typeof keycode !== 'string') return fallbackText || '';

		const { text, html, icon } = normalizeKeycode(keycode);

		if (icon) {
			displayMode = 'icon';
		}

		// 🔹 Log más claro
		// console.log(`raw: ${keycode} ---- Text: ${text} --- HTML: ${html} --- Icon: ${icon}`);


		// 🔹 Mostrar según el modo solicitado
		switch (displayMode) {
			case 'icon':
				const fullPath = getFullIconPath(icon);
				if (fullPath) {
					return `<svg data-src="${fullPath}" alt="${text}" class="key-icon" ></svg>`;
				}
				// Si no hay icono, caemos al HTML o texto
				return html && html !== text ? html : (text || fallbackText || '');

			case 'text':
				return text || fallbackText || '';

			case 'html':
			default:
				return html && html !== text ? html : (text || fallbackText || '');
		}
	}

	function renderLegend(layers) {
		const colors = getComputedStyle(document.documentElement).getPropertyValue('--layer-colors').split(',');
		const styleSheet = document.styleSheets[1];

		layers.forEach((layerName, index) => {
			const color = colors[index % colors.length].trim();
			styleSheet.insertRule(`:root { --layer-color-${index}: ${color}; }`, styleSheet.cssRules.length);
			if (index === 0) return;
			const legendItem = document.createElement('div');
			legendItem.className = 'legend-item';
			legendItem.innerHTML = `<div class="legend-color-box" style="background-color: ${color};"></div><span>${layerName}</span>`;
			legendContainer.appendChild(legendItem);
		});

		const hrmLegend = document.createElement('div');
		hrmLegend.className = 'legend-item';
		hrmLegend.innerHTML = `<div class="legend-color-box" style="box-shadow: 0 0 0 2px var(--hrm-indicator-color);"></div><span>Homerow Mod</span>`;
		legendContainer.appendChild(hrmLegend);
	}
});
