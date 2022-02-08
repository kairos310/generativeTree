"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Final Project
////////////////////////////////////////////////////////////////////////////////
/*global THREE, dat, window, document*/

//initialize renderer and camera variables
var camera, scene, renderer;
var cameraControls;
var effectController = {
	border: 0.5,
	kd: 0.4,
	branchRegion: 0.35,
	smallbranch: 0.7,
	trunklength: 300,
	trunkwidth: 30,
	leaffallchance: 2
};
var clock = new THREE.Clock();
var ambientLight, light;
var ground;

//tree parameters
var trunklength = 300;
var trunkwidth = 35;
var smallbranch = 2;
var branchRegion = 0.5;
var treeshadermaterial;
var leafshadermaterial;
var leaffallchance;

//store leaf objects
var leaves = [];
var fallingleaves = [];

//define color palete
var paletes = [
	[0xffffb3,  0x774e24,  0xdcab6b,  0x6a381f,  0x6e0d25],
	[0x404e5c,  0xb7c3f3,  0xcf1259,  0xdd7596,  0x4f6272],
	[0xbfc3ba,  0xa9aca9,  0x60495a,  0x3f3244,  0x2f2235],
	[0x262730,  0xeff0d1,  0xd7c0d0,  0xd33f49,  0xc7aad9],
	[0xffcf9c,  0xa4d4b4,  0xb96d40,  0xca054d,  0x3b1c32],
	[0x2a3d45,  0xddc9b4,  0xbcac9b,  0xc17c74,  0x7a6c5d],
	[0x090809,  0xf4796b,  0xf4998d,  0xf44e3f,  0xf40000],
	[0x568259,  0xf1fffa,  0x96e6b3,  0xccfccb,  0x464e47],
	[0xcc8b86,  0xf9eae1,  0x7d4f50,  0xd1be9c,  0x4c3a2f],
	[0x9ebc9e,  0xffcfd2,  0xffafc5,  0x553e4e,  0xe0479e],
	[0x90475f,  0xfec0ce,  0x245fcf,  0xa2d6f9,  0x083d77]

]
var colors = paletes[Math.floor(Math.random()*paletes.length)];
//var colors = paletes[paletes.length-1];

function init() {
  var canvasWidth = window.innerWidth;
  var canvasHeight = window.innerHeight;

	//NOISE
	noise.seed(Math.random());

  // CAMERA
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 80000);
  camera.position.set(-300, 1000, -2500);
  camera.lookAt(0, 0, 0);

  // LIGHTS
  ambientLight = new THREE.AmbientLight(colors[4], 1);
	//directionl light
  light = new THREE.DirectionalLight(colors[1], 1);
  light.position.set(-400, 2000, 300);
	light.castShadow = true;
	light.shadow.camera.near = 0.5;
	light.shadow.camera.far = 2500;
	light.shadow.camera.left = -800;
	light.shadow.camera.right = 800;
	light.shadow.camera.top = 800;
	light.shadow.camera.bottom = -800;
  // RENDERER
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(canvasWidth, canvasHeight);
  renderer.setClearColor(colors[0], 1.0);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.renderSingleSided = false;

	//html
  var container = document.getElementById('container');
  container.appendChild(renderer.domElement);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  // EVENTS
  window.addEventListener('resize', onWindowResize, false);

  // CONTROLS
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 500, 0);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(colors[0], 1000, 8000);

  // LIGHTS

  scene.add(ambientLight);
  scene.add(light);
  // GUI
	if(window.innerWidth > 800){
  	setupGui();
	}
	//shaders
	var materialColor = new THREE.Color();
	materialColor = new THREE.Color(colors[2]);

	treeshadermaterial = createShaderMaterial("treeshader", light, ambientLight);
	treeshadermaterial.needsUpdate = true;
	treeshadermaterial.uniforms.uMaterialColor.value.copy(materialColor);

	materialColor = new THREE.Color(colors[3]);
	leafshadermaterial = createShaderMaterial("leafshader", light, ambientLight);
	leafshadermaterial.needsUpdate = true;
	leafshadermaterial.uniforms.uMaterialColor.value.copy(materialColor);

	fillScene();
}

function setupGui() {
  effectController = {
		border: 0.5,
		kd: 0.4,
		branchRegion: 0.35,
		smallbranch: 0.7,
		trunklength: 300,
		trunkwidth: 30,
		leaffallchance: 2
  };
	var h;
  var gui = new dat.GUI();

	//adjust base width of tree
  gui.add(effectController, "trunkwidth").name("Trunk Width").min(5).max(50).step(1).onFinishChange(()=>{
		trunkwidth = effectController.trunkwidth;
		fillScene();
	});

	//adjusts base length, all other branches are percentages of it
	gui.add(effectController, "trunklength").name("Trunk Length").min(5).max(500).step(5).onFinishChange(()=>{
		trunklength = effectController.trunklength;
		fillScene();
	});
	//adjust how small the smallest branch's radius is
	gui.add(effectController, "smallbranch").name("Smallest Branch Radius").min(0).max(5).step(0.05).onFinishChange(()=>{
		smallbranch = effectController.smallbranch;
		fillScene();
	});

	//controls how likely to branch
	gui.add(effectController, "branchRegion").min(0).max(0.5).step(0.05).name("Branching Percentage").onFinishChange(()=>{
		branchRegion = effectController.branchRegion
		fillScene();
	})
	gui.add(effectController, "leaffallchance").min(0).max(20).step(0.5).name("Falling leaves").onFinishChange(()=>{
		leaffallchance = effectController.leaffallchance
	})

	var h = gui.addFolder("Material Control")
	h.add(effectController, "border", 0.0, 1.0, 0.05).name("border");
	//h.add(effectController, "kd", 0.0, 1.0, 0.025).name("m_kd");

}
//deletes everything in scene except for lights
//doing this instead of the proper way as that somehow leaves a few twigs because it's too fast and too many, probably still somewhere in memory
function clearScene(){
	let cleanScene = [scene.children[0], scene.children[1]];
	scene.children = cleanScene;
}

function fillScene() {
	//clear everything before redrawing scene
	clearScene();

	//create ground plane
	/*var geo = createFace(6);
  ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
		color:new THREE.Color(0x999999),
		flatShading:true,
		roughness:1
	}))
	ground.scale.set(1000,1000,1000)
	ground.position.set(-500,0,500);
	ground.rotation.set(-Math.PI/2, 0, 0);
	ground.receiveShadow = true;
	scene.add(ground)
	*/

	const geometry = new THREE.PlaneGeometry( 3000, 3000 );
	geometry.rotateX( - Math.PI / 2 );

	const material = new THREE.ShadowMaterial();
	material.opacity = 1;
	material.color = new THREE.Color(colors[1])

	const plane = new THREE.Mesh( geometry, material );
	plane.position.y = 0;
	plane.receiveShadow = true;
	scene.add( plane );
	//grow tree
	grow(new THREE.Vector3(0,0,0), new THREE.Vector3(0,1,0), trunklength)
}

//handles resizing
function onWindowResize() {

  var canvasWidth = window.innerWidth;
  var canvasHeight = window.innerHeight;

  renderer.setSize(canvasWidth, canvasHeight);

  camera.aspect = canvasWidth / canvasHeight;
  camera.updateProjectionMatrix();
}

//calls the render scene function
function animate() {
  window.requestAnimationFrame(animate);
  render();
}

//render scene
function render() {
  var delta = clock.getDelta();
  cameraControls.update(delta);


	//gives shader material color
	//FRAGMENT SHADER
	var materialColor = new THREE.Color(colors[2]);
	treeshadermaterial.uniforms.uMaterialColor.value.copy(materialColor);
	treeshadermaterial.uniforms.uBorder.value = effectController.border;
	treeshadermaterial.uniforms.uSpecularColor.value.copy(materialColor);

	//VERTEX SHADER
	//adding noises together to get realistic motion
	treeshadermaterial.uniforms.amplitude.value = new THREE.Vector2(noise.simplex2(0, clock.elapsedTime) + noise.simplex2(0, clock.elapsedTime*5)/10,noise.simplex2(clock.elapsedTime,0) + 1	)


	//shake leaves
	for(let leaf of leaves){
		let x = leaf.position.x;
		let y = leaf.position.y;
		let z = leaf.position.z;
		leaf.rotation.set(noise.simplex3(0,y,clock.elapsedTime + x/500),noise.simplex3(0,y,clock.elapsedTime + y/500),noise.simplex3(0,y,clock.elapsedTime + z/500))
	}

	//randomly spawns leaves to fall, deletes them when hits the ground
	fallingLeaves(clock.elapsedTime);

	materialColor = new THREE.Color(colors[3]);
	leafshadermaterial.needsUpdate = true;
	leafshadermaterial.uniforms.uMaterialColor.value.copy(materialColor);

	leafshadermaterial.uniforms.uSpecularColor.value.copy(materialColor);
	leafshadermaterial.uniforms.amplitude.value = new THREE.Vector2(noise.simplex2(0, clock.elapsedTime) + noise.simplex2(0, clock.elapsedTime*5)/10,noise.simplex2(clock.elapsedTime/10,0)*10 + 1	)

	renderer.render(scene, camera);
}

//create ground plane face
function createFace(tess) {
  var geo = new THREE.Geometry();
  var normals = [];
	var s = 1/ tess;
  for (var x = 0; x < tess; x++) { //loops through width
    for (var y = 0; y < tess; y++) { //loops through height
			let z = 0;
			z = solveZ(x * s, y * s)
      geo.vertices.push(new THREE.Vector3(x * s, y * s, z)) //curr
      normals.push(new THREE.Vector3(0, 0, 1))
			z = solveZ((x + 1) * s, y * s)
      geo.vertices.push(new THREE.Vector3((x + 1) * s, y * s, z)) //right
      normals.push(new THREE.Vector3(0, 0, 1))
			z = solveZ(x * s, (y + 1) * s)
      geo.vertices.push(new THREE.Vector3(x * s, (y + 1) * s, z)) // up
      normals.push(new THREE.Vector3(0, 0, 1))

			z = solveZ((x + 1) * s, y * s)
      geo.vertices.push(new THREE.Vector3((x + 1) * s, y * s, z)) // right
      normals.push(new THREE.Vector3(0, 0, 1))
			z = solveZ((x + 1) * s, (y + 1) * s)
      geo.vertices.push(new THREE.Vector3((x + 1) * s, (y + 1) * s, z)) //right up
      normals.push(new THREE.Vector3(0, 0, 1))
			z = solveZ(x * s, (y + 1) * s)
      geo.vertices.push(new THREE.Vector3(x * s, (y + 1) * s, z)) //up
      normals.push(new THREE.Vector3(0, 0, 1))
    }
  }
  var numFaces = 0;
  for (var i = 0; i < geo.vertices.length; i += 3) {
    geo.faces.push(new THREE.Face3(i, i + 1, i + 2));
    geo.computeFaceNormals();
		geo.computeVertexNormals();//going for that low poly look
    numFaces++
  }
  return geo
}

//calculate height of terrain
function solveZ(x,y){
	let flooramp = 0.1;
	return noise.simplex2(x,y) * flooramp;
}

//generate parameters for ground plane
function generateParams(y){
	let x = noise.simplex(y);
	let z = noise.simplex(y + 100); // another random
	return [x,z];
}

//recursive function to create branches and leaves
//start = the starting vector
//dir = the direction to grow in (normalized)
//length = scalar, length to grow
function grow(start, dir, length){
	//clone and calculate ending point
	var end = dir.clone();
	end.multiplyScalar(length);
	end.add(start);

	//create branch mesh
	let branch = createBranch(start, end, length/ 10, 5, length/15);
	let mesh = new THREE.Mesh(branch, treeshadermaterial);
	mesh.castShadow = true;
	scene.add(mesh);

	//calculate length of split branches
	//gets a random position somewhere close to branch region, shortens length to match
	let newlength = Math.random() * (length - length*branchRegion)  + length*branchRegion;
	if(newlength > 30){
		let newstart = dir.clone();
		newstart.multiplyScalar(length*0.95); //starting nearer than the end removes gaps
		newstart.add(start);
		let tip = end.clone();
		let axis = dir.clone();
		axis.multiply(new THREE.Vector3(1, 0, 0))
		//get random direction that has a positive y
		let newdir = new THREE.Vector3(Math.random()-0.5,Math.random(),Math.random()-0.5)
		newdir.normalize();
		grow(newstart, newdir, newlength)
		newdir = new THREE.Vector3(Math.random()-0.5,Math.random(),Math.random()-0.5)
		newdir.normalize();
		grow(newstart, newdir, newlength);
	}else{
		//draw leaf at the end
		createLeaf(end, false);
	}
}

//creates leaf geometry and material
function createLeaf(pos, falling){
	var geo = new THREE.Geometry();
  var normals = [];

	//simple triangle
  geo.vertices.push(new THREE.Vector3(0 ,0 ,0 ))
	geo.vertices.push(new THREE.Vector3(2 ,0 ,1 ))
	geo.vertices.push(new THREE.Vector3(2 ,0 ,-1 ))

	geo.faces.push(new THREE.Face3(0,1,2));
  geo.computeFaceNormals();
	geo.computeVertexNormals();

	var material = leafshadermaterial;
	material.side = THREE.DoubleSide;
	var mesh = new THREE.Mesh(geo, material)
	mesh.position.set(pos.x, pos.y, pos.z)
	mesh.scale.set(20,20,20);
	mesh.rotation.set(Math.PI / 2 * Math.random() - Math.PI/ 4, Math.PI * 2 * Math.random(), Math.PI/2 * Math.random() - Math.PI/ 4);
	mesh.castShadow = true;
	if(!falling){
		leaves.push(mesh);
	}else{
		fallingleaves.push(mesh);
	}
	scene.add(mesh)
}

//animates the leaves as they fall, delete if touches ground
function fallingLeaves(t){
	if(Math.random() < 0.01 * leaffallchance){
		//get position of leaf on tree
		let pos = leaves[Math.floor(Math.random() * leaves.length)].position
		createLeaf(pos, true);
	}else{
		//for each falling leaf, decrease y position, add noise to rotation and position x and z
		for(let leaf of fallingleaves){
			if(leaf.position.y < 0){
				leaf.geometry.dispose();
				leaf.material.dispose();
				scene.remove(leaf);
			}
			leaf.position.y = leaf.position.y - 3 + noise.simplex2(leaf.position.y/50,t/20);
			leaf.position.x = leaf.position.x + noise.simplex2(leaf.position.y/50,t/20) + 3;
			leaf.position.z += noise.simplex2(t/20,leaf.position.y/50);
			leaf.rotation.set(noise.simplex3(0,leaf.position.y/50+t/20,t/20 + leaf.position.x/500),noise.simplex3(0,leaf.position.y/50+ t/20, t/20 + leaf.position.y/500),noise.simplex3(0,leaf.position.y/50+t/20,t/20 + leaf.position.z/50))
		}
	}
}

//creates branch geometry
function createBranch(start, end, radius, segments, amplitude){
	let pts = [];
	let radii = []
	let pt = 0;
	let s = start.clone();
	//linearly interpolates between start and end points, add randomness, create catmul-rom curve
	for(var i = 0; i < segments; i++){
		pt = s.lerp(end, i/ segments);
		pts[i] = pt.clone();
		pts[i].x += Math.random() * amplitude;
		pts[i].y += Math.random() * amplitude;
		pts[i].z += Math.random() * amplitude;
		radii[i] = trunkwidth + smallbranch - trunkwidth / (1 + Math.pow(2, -pts[i].y/100 + 1)) // sigmoid
	}

	const curve = new THREE.CatmullRomCurve3(pts);

	const points = curve.getPoints( segments );
	//use points on curve to get tube geometry, can smoothen but like the low poly look
  var geom = new THREE.TubeRadialGeometry(curve, 10, radii, 5, false);
	geom.verticesNeedUpdate = true;
	return geom;
}


function loadShader(shadertype) {
  return document.getElementById(shadertype).textContent;
}

function createShaderMaterial(id, light, ambientLight) {

	var shaderTypes = {
		'leafshader' : {

			uniforms: {

				"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
				"uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },

				"uAmbientLightColor": { type: "c", value: new THREE.Color( 0x050505 ) },

				"uMaterialColor":  { type: "c", value: new THREE.Color( 0xff0000 ) },
				"uSpecularColor":  { type: "c", value: new THREE.Color( 0xffffff ) },

				"amplitude": {
					type: "v2",
					value: new THREE.Vector2()
				},

				uKd: {
					type: "f",
					value: 0.7
				},
				uBorder: {
					type: "f",
					value: 0.0
				}
			}
		},
		'treeshader' : {

			uniforms: {

				"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
				"uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },

				"uAmbientLightColor": { type: "c", value: new THREE.Color( 0x050505 ) },

				"uMaterialColor":  { type: "c", value: new THREE.Color( 0xff0000 ) },
				"uSpecularColor":  { type: "c", value: new THREE.Color( 0xffffff ) },

				"amplitude": {
					type: "v2",
					value: new THREE.Vector2()
				},

				uKd: {
					type: "f",
					value: 0.7
				},
				uBorder: {
					type: "f",
					value: 0.9
				}
			}
		}

	};

	var shader = shaderTypes[id];

	var u = THREE.UniformsUtils.clone(shader.uniforms);
	// this line will load a shader that has an id of "vertex" from the .html file
	var vs;
	var fs;
	if(id == "treeshader"){
		vs = loadShader("vertex");
		// this line will load a shader that has an id of "fragment" from the .html file
		fs = loadShader("fragment");
	}else{
		vs = loadShader("vertex");
		fs = loadShader("fragment")
	}

	var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;
	material.uniforms.uAmbientLightColor.value = ambientLight.color;
	//material.uniforms.amplitude.value = new THREE.Vector2(Math.sin(clock.elapsedTime), Math.cos(clock.elapsedTime))

	return material;

}


init();
animate();
