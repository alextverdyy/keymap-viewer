import json
from operator import index
import re

# Mapeo de posición visual en el keymap a índice físico
# Basado en el comentario del layout físico

# ╭────────────────────────╮             ╭────╮      ╭─────────────────────────╮
# │  0   1   2   3   4   5 │         ╭───╯  6 ╰───╮  │   7   8   9  10  11  12 │
# │ 13  14  15  16  17  18 │ ╭────╮  │ 19  20  21 │  │  22  23  24  25  26  27 │
# │ 28  29  30  31  32  33 │ │ 34 │  ╰───╮ 35 ╭───╯  │  36  37  38  39  40  41 │
# ╰───────────╮ 42  43  44 │ ╰────╯      ╰────╯      │  45  46  47 ╭───────────╯
#             ╰────────────╯                         ╰─────────────╯


KEYMAP_TO_PHYSICAL_INDEX = {
    # LT (índices 0-5) -> físicos [5, 4, 3, 2, 1, 0]
    0: 0,  # LT5
    1: 1,  # LT4
    2: 2,  # LT3
    3: 3,  # LT2
    4: 4,  # LT1
    5: 5,  # LT0

    # RT (índices 6-11) -> físicos [7, 8, 9, 10, 11, 12]
    6: 7,   # RT0
    7: 8,   # RT1
    8: 9,   # RT2
    9: 10,  # RT3
    10: 11, # RT4
    11: 12, # RT5

    # LM (índices 12-17) -> físicos [18, 17, 16, 15, 14, 13]
    12: 13, # LM5
    13: 14, # LM4
    14: 15, # LM3
    15: 16, # LM2
    16: 17, # LM1
    17: 18, # LM0

    # RM (índices 18-23) -> físicos [22, 23, 24, 25, 26, 27]
    18: 22, # RM0
    19: 23, # RM1
    20: 24, # RM2
    21: 25, # RM3
    22: 26, # RM4
    23: 27, # RM5

    # LB (índices 24-29) -> físicos [33, 32, 31, 30, 29, 28]
    24: 28, # LB5
    25: 29, # LB4
    26: 30, # LB3
    27: 31, # LB2
    28: 32, # LB1
    29: 33, # LB0

    # RB (índices 30-35) -> físicos [36, 37, 38, 39, 40, 41]
    30: 36, # RB0
    31: 37, # RB1
    32: 38, # RB2
    33: 39, # RB3
    34: 40, # RB4
    35: 41, # RB5

    # LH (índices 36-38) -> físicos [44, 43, 42]
    36: 42, # LH0
    37: 43, # LH1
    38: 44, # LH2

    # RH (índices 39-41) -> físicos [45, 46, 47]
    39: 45, # RH0
    40: 46, # RH1
    41: 47, # RH2

    # JS (índices 42-46) -> físicos [6, 19, 20, 21, 35]
    42: 6,  # JS0
    43: 19, # JS1
    44: 20, # JS2
    45: 21, # JS3
    46: 34, # JS4

    # LEC (índice 47) -> físico [34]
    47: 35, # LEC
}

def parse_keymap_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    return content

def parse_json_file(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def resolve_defines(keymap_content):
    defines = {}
    # Expresión regular para encontrar todos los #define
    define_pattern = re.compile(r'#define\s+([A-Za-z0-9_]+)\s+(.+?)(?=\n|$)', re.MULTILINE)
    
    for match in define_pattern.finditer(keymap_content):
        name = match.group(1)
        value_raw = match.group(2)
        # Limpiar comentarios al final de la línea del define
        value_clean = re.split(r'\s*(?://|/\*)', value_raw)[0].strip()
        defines[name] = value_clean

    # Sustituir los defines en el contenido (iterativamente)
    for _ in range(10):
        substituted = False
        for name, value in list(defines.items()):
            if "MAC_" in name:
                substituted = False
                continue
            escaped_name = re.escape(name)
            pattern = re.compile(r'\b' + escaped_name + r'\b')
            num_matches = len(pattern.findall(keymap_content))
            # Usar lambda para evitar problemas de escape en el valor
            if num_matches > 0:
                keymap_content = pattern.sub(lambda match: value, keymap_content)
                substituted = True
        if not substituted:
            break
    return keymap_content

def extract_bindings_from_block(bindings_block_content):
    """
    Extrae una lista de bindings individuales de un bloque de contenido de capa.
    Esta función maneja la estructura específica de los keymaps ZMK con líneas y separadores.
    """
    # Expresión regular para capturar bindings potenciales, manejando casos complejos
    # Captura: &nombre, &nombre(...), U_XXX, CRGB_XXX, ___, XXX
    binding_token_regex = re.compile(
        r'(&[a-zA-Z0-9_]+(?:\s*\([^)]*\))?(?:\s*[A-Za-z0-9_(),\s]+)*|'  # &kp A, &lt(NAV, 0), &mt_home 0 LEFT
        r'U_[A-Z0-9_]+|'                                                  # U_MS_L, U_WH_U, etc.
        r'CRGB_[A-Z0-9_]+)'                                               # CRGB_ON, etc.
    )
    
    # Encontrar todos los tokens que parecen bindings
    potential_tokens = binding_token_regex.findall(bindings_block_content)
    
    # Filtrar y limpiar tokens vacíos
    bindings = [token.strip() for token in potential_tokens if token.strip()]
    
    return bindings

def main():
    # Cargar archivos de configuración
    base_config = parse_json_file('../../base.json')
    eyelash_corne_config = parse_json_file('../../eyelash_corne.json')
    
    # Extraer la información correcta de cada archivo
    final_layout = eyelash_corne_config.get('layouts', {}).get('default_layout', {}).get('layout', [])
    sensors = base_config.get('sensors', [])
    expected_positions = len(final_layout) # Debe ser 84 según tus archivos

    # Procesar keymaps
    base_keymap_content = parse_keymap_file('../../base.keymap')
    eyelash_corne_keymap_content = parse_keymap_file('../../eyelash_corne.keymap')
    layer_order = ['Base', 'Nav', 'Fn', 'Num', 'Sys', 'Mouse', 'Numsym', 'Buttons']
    keymap_data = {layer: [] for layer in layer_order}

    full_keymap_content = base_keymap_content + "\n" + eyelash_corne_keymap_content
    resolved_content = resolve_defines(full_keymap_content)

    # Eliminar bloques de definición de capa macro para evitar conflictos
    resolved_content = re.sub(
        r'#ifndef\s+ZMK_BASE_LAYER[\s\S]*?#endif',
        '',
        resolved_content,
        flags=re.MULTILINE
    )

    # Nueva expresión regular para capturar capas
    # Esta regex busca ZMK_BASE_LAYER o ZMK_LAYER, captura el nombre,
    # y luego captura TODO el contenido hasta el paréntesis de cierre ')'
    # que está en una línea por sí mismo o seguido solo de espacios.
    # Esto es más robusto para el formato de tus archivos.
    layer_pattern = re.compile(
        r'(?:ZMK_BASE_LAYER|ZMK_LAYER)\s*\(\s*([A-Za-z0-9_]+)\s*,([\s\S]*?)\)\s*(?:;|\n)',
        re.DOTALL
    )

    # Diccionario para almacenar capas encontradas
    found_layers = {}

    for match in layer_pattern.finditer(resolved_content):
        layer_name = match.group(1).capitalize()
        print(f"Encontrada capa: {layer_name}")
        
        raw_bindings_block = match.group(2)

        # Limpieza de comentarios (más simple)
        clean_bindings_block = re.sub(r'//.*?$|/\*.*?\*/', '', raw_bindings_block, flags=re.MULTILINE | re.DOTALL)

        # Extraer bindings usando la nueva función
        bindings_list = extract_bindings_from_block(clean_bindings_block)
        reordered_bindings = [None] * expected_positions
        for visual_index, binding in enumerate(bindings_list):
            if visual_index in KEYMAP_TO_PHYSICAL_INDEX:
                physical_index = KEYMAP_TO_PHYSICAL_INDEX[visual_index]
                # Verificación de límites para physical_index
                if 0 <= physical_index < expected_positions:
                    reordered_bindings[physical_index] = binding
                else:
                    print(f"Error: Índice físico inválido {physical_index} para visual_index {visual_index} en la capa {layer_name}. Usando placeholder.")
                    # El placeholder ya está en reordered_bindings[physical_index] gracias a la inicialización
            else:
                print(f"Advertencia: visual_index {visual_index} no encontrado en KEYMAP_TO_PHYSICAL_INDEX para la capa {layer_name}. Usando placeholder en la posición {visual_index}.")
                # Si el visual_index no está mapeado, ponemos el binding en su posición original como fallback
                if 0 <= visual_index < expected_positions:
                     reordered_bindings[visual_index] = binding
        
        print(f"  Bindings extraídos para {layer_name}: {len(bindings_list)}")

        bindings_list = reordered_bindings
        parsed_bindings = []
        for binding_str in bindings_list:
            if not binding_str or binding_str.isspace():
                continue

            original = binding_str
            # Manejar casos especiales
            if original == '___':
                behavior = "trans"
                params = []
            elif original == 'XXX':
                behavior = "none"
                params = []
            else:
                # Quitar el '&' inicial si existe para procesar el comportamiento
                clean_binding = original[1:] if original.startswith('&') else original

                behavior = ""
                params = []

                # Intentar parsear como función (ej. lt(NAV, 0))
                func_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)$', clean_binding.strip())
                if func_match:
                    behavior = func_match.group(1)
                    raw_params = func_match.group(2)
                    # Dividir parámetros considerando comas
                    if ',' in raw_params:
                        params = [p.strip() for p in raw_params.split(',') if p.strip()]
                    else:
                         params = [raw_params.strip()] if raw_params.strip() else []
                else:
                    # Parsear como espacio-separado
                    parts = clean_binding.split(' ')
                    behavior = parts[0]
                    params = [p for p in parts[1:] if p] # Filtrar partes vacías

            parsed_bindings.append({
                'original': original,
                'behavior': behavior,
                'params': params,
            })
        
        # Asegurar que siempre hay el número esperado de posiciones
        while len(parsed_bindings) < expected_positions:
             parsed_bindings.append({'original': '___', 'behavior': 'trans', 'params': []})
        if len(parsed_bindings) > expected_positions:
             parsed_bindings = parsed_bindings[:expected_positions]
        print(f"  Bindings procesados para {layer_name}: {len(parsed_bindings)}")
        found_layers[layer_name] = parsed_bindings

    # Asignar las capas encontradas al diccionario final, respetando layer_order
    for layer_name in layer_order:
        if layer_name in found_layers:
            keymap_data[layer_name] = found_layers[layer_name]
        else:
            print(f"Advertencia: No se encontró la capa '{layer_name}' en el keymap.")
            # Rellenar con trans si no se encuentra
            keymap_data[layer_name] = [{'original': '___', 'behavior': 'trans', 'params': []} for _ in range(expected_positions)]

    output = {
        'layout': final_layout,
        'layer_order': layer_order,
        'keymap': keymap_data,
        'sensors': sensors
    }

    with open('keymap_data.json', 'w') as f:
        json.dump(output, f, indent=4)

    print("keymap_data.json generado exitosamente.")

if __name__ == "__main__":
    main()
