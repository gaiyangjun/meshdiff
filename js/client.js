var THREE = require('three'),
    ThreeBSP = require('three-js-csg')(THREE),
    OrbitControls = require('three-orbit-controls')(THREE),
    stl = require('./loaders/STLLoader.js'),
    socket = require('socket.io-client')('http://127.0.0.1:8080/');

var camera, cameraTarget, containers, scene, renderer, newMesh, OldMesh;

init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x72645b, 2, 15 );

	camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );

	//camera.position.set( 3, 0.15, 3 );
	camera.position.set( 3, 3, 3 );
	cameraTarget = new THREE.Vector3( 0, -0.25, 0 );


	// Ground

	var plane = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 40, 40 ),
		new THREE.MeshPhongMaterial( { color: 0x999999, specular: 0x101010 } )
	);

	plane.rotation.x = -Math.PI/2;
	plane.position.y = -0.5;
	scene.add( plane );

	// Lights

	scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );
	addShadowedLight( 0.5, 1, -1, 0xffff99, 1 );

	// renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( scene.fog.color );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.cullFace = THREE.CullFaceBack;

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablingDamping = true;
  controls.dampingFactor = 0.25;
  controls.noPan = false;
}

function addShadowedLight( x, y, z, color, intensity ) {

	var directionalLight = new THREE.DirectionalLight( color, intensity );
	directionalLight.position.set( x, y, z );
	scene.add( directionalLight );

	directionalLight.castShadow = true;
	// directionalLight.shadowCameraVisible = true;

	var d = 1;
	directionalLight.shadowCameraLeft = -d;
	directionalLight.shadowCameraRight = d;
	directionalLight.shadowCameraTop = d;
	directionalLight.shadowCameraBottom = -d;
	directionalLight.shadowCameraNear = 1;
	directionalLight.shadowCameraFar = 4;
	directionalLight.shadowMapWidth = 1024;
	directionalLight.shadowMapHeight = 1024;
	directionalLight.shadowBias = -0.005;

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

  controls.update();
	renderer.render( scene, camera );

}

socket.on('connect', function(){
  console.log('We have made contact...');
});

socket.on('mesh1', function(data){
  console.log(data);
  var stlLoader = new stl();
  stlLoader.load('http://127.0.0.1:8080' + data, function(obj) {
    var geom = new THREE.Geometry().fromBufferGeometry(obj);
    geom.normalize();
    geom.mergeVertices();
    newMesh = new ThreeBSP(geom);    
    socket.emit('oldMesh', 'oldMesher');
    var mesh = new THREE.Mesh(geom, new THREE.MeshNormalMaterial());
    mesh.position.set(-3, -0.25, 0);
    scene.add(mesh);
  });
});


socket.on('mesh2', function(data){
  console.log(data);
  var stlLoader = new stl();
  stlLoader.load('http://127.0.0.1:8080' + data, function(obj) {
    var geom = new THREE.Geometry().fromBufferGeometry(obj);
    geom.normalize();
    geom.mergeVertices();
    oldMesh = new ThreeBSP(geom);
    socket.emit('newMesh', 'newMesher');
    var mesh = new THREE.Mesh(geom, new THREE.MeshNormalMaterial());
    mesh.position.set(3, -0.25, 0);
    scene.add(mesh); 
   });
});

socket.on('newMesher', function(){
  console.log('newMesh');
  if ((newMesh !== undefined) && (oldMesh !== undefined)) {
    console.log('doing it new!');
    var sub = newMesh.subtract(oldMesh);
    var diffMesh = sub.toMesh();
    diffMesh.material = new THREE.MeshBasicMaterial({color: 0x00FF00});
    diffMesh.position.set(0, -0.25, 0);
    scene.add(diffMesh);
    
    var sub2 = oldMesh.subtract(newMesh);
    var diffMesh2 = sub2.toMesh();
    diffMesh2.material = new THREE.MeshBasicMaterial({color: 0xFF0000});
    diffMesh2.position.set(0, -0.25, 0);
    scene.add(diffMesh2);

   // more on this to come.
   // var intersection = oldMesh.intersect(newMesh);
    
  } 
});

//socket.on('oldMesher', function(){
//  console.log('oldMesh');
//  if ((newMesh !== undefined) && (oldMesh !== undefined)) {
//    console.log('doing it old!');
//    var sub = newMesh.subtract(oldMesh);
//    var diffMesh = sub.toMesh();
//    diffMesh.material = new THREE.MeshNormalMaterial();
//    diffMesh.position.set(0, -0.25, 0);
//    scene.add(diffMesh);
//  } 
//});

socket.on('disconnect', function(){});
