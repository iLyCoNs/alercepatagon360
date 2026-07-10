const THREE = require('three');

function testPitch(threePitch) {
    const threeCamera = new THREE.PerspectiveCamera(100, 1, 0.1, 1000);
    threeCamera.rotation.order = 'YXZ';
    threeCamera.rotation.y = 0;
    threeCamera.rotation.x = THREE.MathUtils.degToRad(threePitch);
    threeCamera.updateMatrixWorld();

    const mouse = new THREE.Vector2(0, 0); // Center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, threeCamera);

    // Create a sphere
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    const threeMesh = new THREE.Mesh(geometry, material);
    threeMesh.updateMatrixWorld();

    const intersects = raycaster.intersectObject(threeMesh);
    if (intersects.length > 0) {
        const p = intersects[0].point;
        const radius = 500;
        const ratioY = Math.max(-1, Math.min(1, p.y / radius));
        const pitch = Math.asin(ratioY) * (180 / Math.PI);
        const yaw = Math.atan2(p.x, -p.z) * (180 / Math.PI);
        
        console.log(`threePitch: ${threePitch} -> p=(${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}), calcPitch=${pitch.toFixed(0)}`);
    } else {
        console.log("No intersection!");
    }
}

testPitch(0);
testPitch(-30);
testPitch(-60);
testPitch(30);
testPitch(60);
testPitch(90);
testPitch(-90);
