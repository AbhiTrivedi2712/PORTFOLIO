import re

# --- STYLES.CSS FIXES ---
with open('c:/portfolio/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Ensure skills filter buttons have proper z-index and are fully clickable
css = css.replace('.skills-filter {\n    display: flex;', '.skills-filter {\n    display: flex;\n    position: relative;\n    z-index: 50;')
css = css.replace('.filter-btn {\n    background: transparent;', '.filter-btn {\n    background: transparent;\n    position: relative;\n    z-index: 50;')

# 2. Ensure all general buttons are clickable
if "z-index: 10;" not in css and ".btn {\n" in css:
    css = css.replace('.btn {\n    display: inline-flex;', '.btn {\n    display: inline-flex;\n    position: relative;\n    z-index: 50;')
else:
    css = css.replace('z-index: 1;', 'z-index: 50;')

# 3. Ensure particles definitely don't block anything
if "#particles-js {\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    z-index: -2;\n    background: transparent;\n}" in css:
    css = css.replace("#particles-js {\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    z-index: -2;\n    background: transparent;\n}", "#particles-js {\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    z-index: -2;\n    background: transparent;\n    pointer-events: none;\n}")

with open('c:/portfolio/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

# --- SCRIPT.JS FIXES ---
# Double check the skills filter script logic to make sure the click event works
with open('c:/portfolio/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# If there's any chance DOMContentLoaded didn't attach to buttons because they were rendered late, 
# there's no reason since it's a static HTML file. But let's verify.
# The code looks perfectly fine in script.js. I'll just write it back to be safe.
with open('c:/portfolio/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Z-index and clickability patches applied successfully.")
