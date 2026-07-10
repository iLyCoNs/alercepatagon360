const THREE = require('three');

const camera = new THREE.PerspectiveCamera(100, 1, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.rotation.y = THREE.MathUtils.degToRad(90);
camera.updateMatrixWorld();
console.log("Forward vector with yaw +90:", new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
