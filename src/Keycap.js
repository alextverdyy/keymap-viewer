import React from 'react';
import { ZMK_KEYCODE_MAP, MOD_ICON_MAP } from './keymapConfig.js';

const normalizeKeycode = (raw) => {
	if (!raw) return { text: "", html: "", icon: null };
	let key = raw.replace(/^&/, '').trim().toUpperCase();

	if (key.slice(-1) == ',') {
		key = key.slice(0, -1).trim();
	}

	const modMatch = key.match(/^([LR][CSAG])\((.+)\)$/i);
	if (modMatch) {
		const modKey = modMatch[1].toUpperCase();
		const modInfo = MOD_ICON_MAP[modKey] || { text: modKey, html: modKey, icon: null };
		const inner = normalizeKeycode(modMatch[2]);

		let combinedIcon = modInfo.icon;
		if (modInfo.icon && inner.icon) {
			const combinedSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <g>${inner.icon} </g>
            <g transform="translate(600,600) scale(0.4)">${modInfo.icon}</g>
        </svg>
    `;
			combinedIcon = combinedSVG;
		} else {
			combinedIcon = null;
		}

		return {
			text: modInfo.text + inner.text,
			html: (<div className='combined'>{modInfo.html} {inner.html}</div>),
			icon: combinedIcon
		};
	}

	if (key.includes(' ')) {
		const parts = key.split(' ');
		const firstPart = parts[0];

		console.log(parts)
		if (ZMK_KEYCODE_MAP[firstPart]) {
			const first = ZMK_KEYCODE_MAP[firstPart];
			return {
				text: first.text,
				html: first.html,
				icon: first.icon
			};
		} else {
			var mapped;
			for (const i in parts) {
				const part = parts[i]
				const extracted = ZMK_KEYCODE_MAP[part]
				if (extracted) {
					mapped = {
						text: extracted.text,
						html: extracted.html,
						icon: extracted.icon
					}
					break
				}
			}

			return mapped
		}
	}

	if (ZMK_KEYCODE_MAP[key]) return ZMK_KEYCODE_MAP[key];

	if (/^[A-Z0-9]$/.test(key)) {
		return { text: key };
	}

	return { text: raw };
};

const getDisplayContent = (keycode, fallbackText = null) => {
	if (!keycode || typeof keycode !== 'string') return fallbackText || '';

	const { text, html, icon } = normalizeKeycode(keycode);

	return html && html !== text ? html : (text || fallbackText || '');
};

const Keycap = ({ index, keyDef, keymap, layer_order, scale, sensorRefs, activeLayer, layerActivationKeys, offsetX, offsetY }) => {
	const x = (keyDef.x - offsetX) * scale;
	const y = (keyDef.y - offsetY) * scale;
	const width = (keyDef.w || 1) * scale - 4;
	const height = (keyDef.h || 1) * scale - 4;

	const style = {
		left: `${x}px`,
		top: `${y}px`,
		width: `${width}px`,
		height: `${height}px`,
	};

	if (keyDef.r) {
		const rx = keyDef.rx ? keyDef.rx * scale : x + width / 2;
		const ry = keyDef.ry ? keyDef.ry * scale : y + height / 2;
		style.transformOrigin = `${rx - x}px ${ry - y}px`;
		style.transform = `rotate(${keyDef.r}deg)`;
	}


	const isEncoder = keyDef.label && sensorRefs.includes(keyDef.label);
	const isHrm = layer_order.some(layerName => {
		const binding = keymap[layerName]?.[index];
		return binding && ['hml', 'hmr'].includes(binding.behavior);
	});

	const keycapClasses = ['keycap'];
	if (isEncoder) keycapClasses.push('encoder');
	if (isHrm) keycapClasses.push('is-hrm');

	const activeLayerName = activeLayer || layer_order[0];
	const binding = keymap[activeLayerName]?.[index];

	if (!binding || binding.original === '___' || binding.behavior === 'trans') {
		keycapClasses.push('noop');
	}

	if (layerActivationKeys) {
		if (activeLayerName === layer_order[0]) {
			const activatedLayer = Object.keys(layerActivationKeys).find(layer => layerActivationKeys[layer] === index);
			if (activatedLayer) {
				const layerIndex = layer_order.indexOf(activatedLayer);
				style.borderColor = `var(--layer-color-${layerIndex + 1})`;
				style.backgroundColor = `rgb(from var(--layer-color-${layerIndex + 1}) r g b / 0.5)`;
				keycapClasses.push('layer-switch');
			}
		} else {
			if (layerActivationKeys[activeLayerName] === index) {
				const layerIndex = layer_order.indexOf(activeLayerName);
				style.backgroundColor = `var(--layer-color-${layerIndex + 1})`;
				keycapClasses.push('pressed');
			}
		}
	}


	const renderLayer = (layerName) => {
		const currentBinding = keymap[layerName]?.[index];

		if (!currentBinding || !currentBinding.behavior || currentBinding.original === '___' || currentBinding.behavior === 'trans') {
			return null; // Don't render anything for noop, trans, or undefined keys
		}

		const layerIndex = layer_order.indexOf(layerName);
		const labelStyle = {};
		if (layerIndex > 0) {
			labelStyle.color = `var(--layer-color-${layerIndex + 1}, #6c757d)`;
			labelStyle.fill = `var(--layer-color-${layerIndex + 1}, #6c757d)`;
		}

		let content;
		if (['hml', 'hmr'].includes(currentBinding.behavior)) {
			const tapKey = currentBinding.params[1];
			content = (
				<>
					<div className="label-main-content">{getDisplayContent(tapKey)}</div>
				</>
			);
		} else {
			let keycode = '';
			if (currentBinding.behavior === 'kp' || currentBinding.behavior === 'bootloader' || currentBinding.behavior === 'sys_reset') {
				keycode = currentBinding.params[0] || currentBinding.behavior;
			} else if (['lt', 'hll', 'hlr'].includes(currentBinding.behavior)) {
				keycode = currentBinding.params[1];
			} else if (binding.behavior === 'bt') {
				keycode = 'BT';
			} else {
				keycode = currentBinding.original;
			}
			content = getDisplayContent(keycode);
		}

		return (
			<div className={`label label-center`} style={labelStyle} title={`${layerName}: ${currentBinding.original}`}>
				{content}
			</div>
		);
	};

	const layerIndex = layer_order.indexOf(activeLayerName);
	if (layerIndex > 0) {
		const currentBinding = keymap[activeLayerName]?.[index];
		if (currentBinding && currentBinding.original !== '___' && currentBinding.behavior !== 'trans') {
			style.backgroundColor = `var(--layer-color-${layerIndex + 1}-bg, var(--key-bg))`;
		}
	}

	return (
		<div className={keycapClasses.join(' ')} style={style}>
			{renderLayer(activeLayerName)}
		</div>
	);
};

export default Keycap;
