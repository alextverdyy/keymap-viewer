
import json
import re

def parse_keymap(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    return content

def get_layers(keymap_content):
    layer_pattern = re.compile(r'ZMK_BASE_LAYER\(([^,]+),', re.MULTILINE)
    layers = layer_pattern.findall(keymap_content)
    return [layer[0].strip() for layer in layers]

def get_key_bindings(keymap_content, layer_name):
    layer_pattern = re.compile(r'ZMK_BASE_LAYER\s*\(\s*' + re.escape(layer_name) + r'\s*,([^)]+)\)', re.DOTALL)
    match = layer_pattern.search(keymap_content)
    if not match:
        return []

    keys_str = match.group(1)
    # This is a simplified parser. It might need to be adjusted based on the complexity of the keymap file.
    key_bindings = [key.strip() for key in keys_str.split(',')]
    return key_bindings

def main():
    # Load the base layout
    with open('base.json', 'r') as f:
        base_layout = json.load(f)

    # Parse the keymap files
    base_keymap = parse_keymap('../../base.keymap')
    eyelash_corne_keymap = parse_keymap('../../eyelash_corne.keymap')

    # Combine keymap files
    combined_keymap = base_keymap + eyelash_corne_keymap

    # Get the list of layers
    layers = get_layers(combined_keymap)

    # Create a dictionary to store the keymap for each layer
    keymap_data = {}
    for layer in layers:
        keymap_data[layer] = get_key_bindings(combined_keymap, layer)

    # Generate the KLE-compatible JSON
    kle_data = []
    for layer_name, key_bindings in keymap_data.items():
        layer_kle = [layer_name]
        row = []
        current_y = None
        for i, key_def in enumerate(base_layout['layouts']['default_layout']['layout']):
            y = key_def.get('y', 0)
            if current_y is None:
                current_y = y
            elif abs(y - current_y) > 0.5:
                layer_kle.append(row)
                row = []
                current_y = y

            key_obj = {}
            if 'x' in key_def: key_obj['x'] = key_def['x']
            if 'y' in key_def: key_obj['y'] = key_def['y'] - current_y
            if 'r' in key_def: key_obj['r'] = key_def['r']
            if 'rx' in key_def: key_obj['rx'] = key_def['rx']
            if 'ry' in key_def: key_obj['ry'] = key_def['ry']

            if i < len(key_bindings):
                row.append(key_bindings[i])
            else:
                row.append('') # or a default value

        if row:
            layer_kle.append(row)
        kle_data.append(layer_kle)


    # Write the KLE data to a file
    with open('keymap.json', 'w') as f:
        json.dump(kle_data, f, indent=2)

    print('Keymap visualization data generated in keymap.json')

if __name__ == '__main__':
    main()
