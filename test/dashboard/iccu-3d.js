/**
 * ICCU 3D 뷰 (Vanilla Three.js) - 대시보드 임베드용
 * window.setIccuHighlight(partName) 으로 부품 하이라이트
 */
(function () {
  "use strict";

  var container = null;
  var scene, camera, renderer;
  var meshParts = {};
  var partNames = ["main", "connector1", "connector2", "cell1", "cell2", "top"];
  var mouse = { down: false, x: 0, y: 0 };
  var cameraAngle = { theta: 0.8, phi: 0.6 };

  var PARTS = [
    { name: "main", position: [0, 0, 0], size: [1.2, 0.8, 0.6] },
    { name: "connector1", position: [0.4, 0.35, 0], size: [0.35, 0.25, 0.5] },
    { name: "connector2", position: [-0.4, 0.35, 0], size: [0.35, 0.25, 0.5] },
    { name: "cell1", position: [0.5, -0.25, 0.2], size: [0.3, 0.4, 0.25] },
    { name: "cell2", position: [-0.5, -0.25, 0.2], size: [0.3, 0.4, 0.25] },
    { name: "top", position: [0, 0.55, 0], size: [0.7, 0.2, 0.5] },
  ];

  function init() {
    container = document.getElementById("iccu3dContainer");
    if (!container || typeof THREE === "undefined") return;

    var width = container.clientWidth;
    var height = Math.max(520, container.clientHeight);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(2.5, 2, 2.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(5, 5, 5);
    scene.add(dir1);
    var dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-3, -2, 2);
    scene.add(dir2);

    PARTS.forEach(function (p) {
      var geo = new THREE.BoxGeometry(p.size[0], p.size[1], p.size[2]);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x9e9e9e,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0.4,
        roughness: 0.6,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.position[0], p.position[1], p.position[2]);
      mesh.userData.partName = p.name;
      scene.add(mesh);
      meshParts[p.name] = mesh;
    });

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mouseleave", onMouseUp);
    window.addEventListener("resize", onResize);

    animate();
  }

  function onMouseDown(e) {
    mouse.down = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onMouseMove(e) {
    if (!mouse.down) return;
    var dx = e.clientX - mouse.x;
    var dy = e.clientY - mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    cameraAngle.theta -= dx * 0.004;
    cameraAngle.phi -= dy * 0.004;
    cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngle.phi));
    updateCamera();
  }

  function onMouseUp() {
    mouse.down = false;
  }

  function updateCamera() {
    var r = 3.5;
    camera.position.x = r * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
    camera.position.y = r * Math.cos(cameraAngle.phi);
    camera.position.z = r * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }

  function onResize() {
    if (!container || !renderer || !camera) return;
    var width = container.clientWidth;
    var height = Math.max(520, container.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  window.setIccuHighlight = function (partName) {
    partNames.forEach(function (name) {
      var mesh = meshParts[name];
      if (!mesh || !mesh.material) return;
      var isHighlight = partName != null && partName !== "" && partName === name;
      mesh.material.color.setHex(isHighlight ? 0x660000 : 0x9e9e9e);
      mesh.material.emissive.setHex(isHighlight ? 0xff2222 : 0x000000);
      mesh.material.emissiveIntensity = isHighlight ? 0.9 : 0;
    });
  };

  window.initIccu3dResize = function () {
    if (onResize) onResize();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }
})();
