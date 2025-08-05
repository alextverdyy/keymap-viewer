import json

with open("eyelash_corne.json") as f:
    data = json.load(f)

layout = data["layouts"]["default_layout"]["layout"]

kle = []
current_y = None
row = []

for key in layout:
    y = key.get("y", 0)
    label = key.get("label", "")

    # KLE necesita un salto de fila cuando cambia la Y (aprox)
    if current_y is None:
        current_y = y
    elif abs(y - current_y) > 0.5:
        # Guardamos la fila y empezamos otra
        kle.append(row)
        row = []
        current_y = y

    key_obj = {}
    if "x" in key: key_obj["x"] = key["x"]
    if "y" in key: key_obj["y"] = key["y"] - current_y
    if "r" in key: key_obj["r"] = key["r"]
    if "rx" in key: key_obj["rx"] = key["rx"]
    if "ry" in key: key_obj["ry"] = key["ry"]

    row.append(key_obj)
    row.append(label)

# última fila
if row:
    kle.append(row)

with open("eyelash_corne_kle.json", "w") as f:
    json.dump(kle, f, indent=2)

print("✅ Exportado a eyelash_corne_kle.json")

