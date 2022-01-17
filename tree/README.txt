Describe the purpose or artistic idea behind your 3D program.
- I wanted to create generative art, trees seemed like the best route to go with. Wanted the tree to be adjustable but also mostly random and animated to look alive.

Describe how to use your program if there is any user interaction.
- trunkwidth: adjusts base width of tree
- trunklength: adjusts the base length of the tree, which affects the height
- smallbranch: adjusts small branch radius
- branching : adjusts how long branches grow after each split
- border: changes where the shadow color begins


List and describe all of the techniques used (remember that I am looking for at least 6 of the 9
specific techniques listed above, but there may be others). Provide a clear explanation of how
and why they were used.
- Create simple objects directly using primitives (points, vectors, and meshes).
	- ground plane created using points that create faces, leaves are a simple triangle geometry hard coded.
- Create objects using Three.js built-in geometrical functions.
	- used tube geometry
- Create curved lines or surfaces.
	- tube created with catmul-rom lines
- Use transforms and rotations. Also, transform and rotate with respect to parent-child object relationships.
	- scaled up everything in scene.
- Use cameras and lights.
	- used camera with orbit
	- used ambient lights
	- used directional lights
	- used shadow orthogonal camera
- Use animation.
	- falling leaves animated by changing position
- Use custom shaders.
	- vertex shader moves tree branches
	- fragment shader made toon shader


What difficulties did you encounter and how did you overcome them?
- setting up the shader was confusing, it didn't work even though I copied it, found out it was because it render was called the shaders were initialized
- creating the grow function was a really big challenge, had to figure out how to use vectors to represent the branches
- creating the branch mesh, initially started with bezier curves, switched to CatmullRomCurve3 as it was easier to visualize the points
- creating the leaves, initialized the face upside down, took a while to figure it out
- debugging the shader was hard, it either crashed or gave no specific line where the error was


Any known bugs.
- leaves do not move with branches

Names of people with whom you worked and any web sites, books, or other resources that you
used (if any).
- Dr Sowell
- Stackoverflow forums
- THREE.js docs
- perlin.js


If you are proud of your work, consider giving me permission to post it on our Class Projects
page. Just let me know if you prefer for me to post it anonymously or not at all.
- I wouldn't mind at all
