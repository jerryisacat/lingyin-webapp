#!/usr/bin/env python3
"""Expand ${VAR} references in .env with actual values from the same file."""
import re

ENV_PATH = '/Users/sunrunchen/GitHub/lingyin-webapp/.env'

with open(ENV_PATH, 'r') as f:
    content = f.read()

# Build a lookup of all defined vars (regex to find NAME="VALUE" lines)
lookup = {}
for m in re.finditer(r'^([A-Z_][A-Z0-9_]*)="([^"]*)"', content, re.MULTILINE):
    lookup[m.group(1)] = m.group(2)

# Resolve ${VAR} recursively (but not circularly)
def resolve(value, depth=0):
    if depth > 10:
        return value
    def replacer(m):
        var_name = m.group(1)
        if var_name in lookup:
            return resolve(lookup[var_name], depth + 1)
        return m.group(0)  # keep unresolved
    return re.sub(r'\$\{([^}]+)\}', replacer, value)

# Replace all values that contain ${...}
lines = content.split('\n')
new_lines = []
for line in lines:
    m = re.match(r'^([A-Z_][A-Z0-9_]*)="(.*)"$', line)
    if m:
        name = m.group(1)
        val = m.group(2)
        if '${' in val:
            resolved = resolve(val)
            if resolved != val:
                new_lines.append(f'{name}="{resolved}"')
                print(f"  {name}: expanded")
                continue
    new_lines.append(line)

new_content = '\n'.join(new_lines)

with open(ENV_PATH, 'w') as f:
    f.write(new_content)

print(f"\nDone. Wrote {len(new_content)} bytes to {ENV_PATH}")
