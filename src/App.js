import React, { useState, useEffect } from 'react';
import Keyboard from './Keyboard';
import keymapData from './keymap_data.json';

const App = () => {
	const [data, setData] = useState(null);
	const [activeLayer, setActiveLayer] = useState(null);
	const [layerActivationKeys, setLayerActivationKeys] = useState({});
	const [theme, setTheme] = useState('dark');

	const toggleTheme = () => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
		document.body.setAttribute('data-theme', newTheme);
	};

	useEffect(() => {
		document.body.setAttribute('data-theme', theme);
		setData(keymapData);
		if (keymapData && keymapData.layer_order.length > 0) {
			setActiveLayer(keymapData.layer_order[0]);
			const activationKeys = {};
			const baseLayer = keymapData.keymap[keymapData.layer_order[0]];

			baseLayer.forEach((binding, index) => {
				if (binding && binding.behavior) {
					const layerSwitchBehaviors = ['mo', 'lt', 'to', 'tog', 'hll', 'hlr', 'lt_spc'];
					if (layerSwitchBehaviors.includes(binding.behavior)) {
						const layerName = keymapData.layer_order[binding.params[0]];
						if (layerName) {
							activationKeys[layerName] = index;
						}
					}
				}
			});
			setLayerActivationKeys(activationKeys);
		}
	}, [theme]);

	if (!data) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container">
			<div className="header">
				<h1>ZMK Keymap Viewer</h1>
				<button onClick={toggleTheme} className="theme-switcher">
					{theme === 'dark' ? 'Light' : 'Dark'} Mode
				</button>
			</div>
			<div className="layer-selector">
				{data.layer_order.map((layerName, index) => (
					<button
						key={layerName}
						className={`layer-tab ${activeLayer === layerName ? 'active' : ''}`}
						onClick={() => {
							console.clear()
							setActiveLayer(layerName)
						}}
						style={{
							backgroundColor: activeLayer === layerName ? `var(--layer-color-${index + 1}-bg)` : 'transparent',
							color: activeLayer === layerName ? `var(--layer-color-${index + 1})` : 'inherit'
						}}
					>
						<span className="layer-color-indicator" style={{ backgroundColor: `var(--layer-color-${index + 1})` }}></span>
						{layerName}
					</button>
				))}
			</div>
			<Keyboard
				layout={data.layout}
				keymap={data.keymap}
				layer_order={data.layer_order}
				sensors={data.sensors}
				activeLayer={activeLayer}
				layerActivationKeys={layerActivationKeys}
			/>
		</div>
	);
};

export default App;
