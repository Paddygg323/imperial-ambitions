Runtime 254 artwork and rendering

grass.png: continuous short-grass surface matching the plains palette. Repeats in world coordinates so all land tiles share the same grass at their edges. The runtime feathers every land sprite into this one surface; it does not repaint each tile with a separate grass background.

sheep.png: transparent sheep overlay. Sheep-bearing hills use exactly the same 003-r1 ground artwork as normal hills, with five sheep drawn above it. No different hill relief or grass palette.

Both source images were made using the built-in image-generation tool, copied unchanged into this folder. Exact prompts are in grass.png.prompt.txt and sheep.png.prompt.txt. Original terrain and resource sheets remain preserved.

Renderer: game/reviewed-sprites.mjs and game/map.mjs.
Visual comparison: outputs/visual-review/sprites254/terrain-sheep.png
