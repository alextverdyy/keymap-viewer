import React from 'react';
import Keycap from './Keycap';

const Keyboard = ({ layout, keymap, layer_order, sensors, activeLayer, layerActivationKeys }) => {
  const scale = 60;
  const sensorRefs = sensors.map(s => s.ref);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  layout.forEach(keyDef => {
    const x = (keyDef.x || 0);
    const y = (keyDef.y || 0);
    const w = (keyDef.w || 1);
    const h = (keyDef.h || 1);

    if(x < minX) minX = x;
    if(y < minY) minY = y;
    if(x + w > maxX) maxX = x + w;
    if(y + h > maxY) maxY = y + h;
  });

  const keyboardWidth = (maxX - minX) * scale;
  const keyboardHeight = (maxY - minY) * scale;

  return (
    <div id="keyboard-container">
        <div className="keyboard-content" style={{ width: keyboardWidth, height: keyboardHeight }}>
            {layout.map((keyDef, index) => (
                <Keycap
                    key={index}
                    index={index}
                    keyDef={keyDef}
                    keymap={keymap}
                    layer_order={layer_order}
                    scale={scale}
                    sensorRefs={sensorRefs}
                    activeLayer={activeLayer}
                    layerActivationKeys={layerActivationKeys}
                    offsetX={minX}
                    offsetY={minY}
                />
            ))}
        </div>
    </div>
  );
};

export default Keyboard;
