#!/usr/bin/env python3
# Fix garbled emoji text and onClick handlers in NuevoRegistro.tsx

with open('src/pages/NuevoRegistro.tsx', 'rb') as f:
    raw = f.read()

# Check what bytes the garbled "âœ…" and "ðŸ'¾" actually are
idx_check = raw.find(b'Guardar Registro Completo')
if idx_check >= 0:
    print("Found 'Guardar Registro Completo' at byte", idx_check)
    print("Preceding 20 bytes:", repr(raw[idx_check-20:idx_check]))

idx_check2 = raw.find(b'Guardar Estimados')
if idx_check2 >= 0:
    print("Found 'Guardar Estimados' at byte", idx_check2)
    print("Preceding 20 bytes:", repr(raw[idx_check2-20:idx_check2]))
