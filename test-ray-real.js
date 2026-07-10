const THREE = require('three');

function test(threeYaw, clickX) {
    const threeCamera = new THREE.PerspectiveCamera(100, 1, 0.1, 1000);
    threeCamera.rotation.order = 'YXZ';
    threeCamera.rotation.y = THREE.MathUtils.degToRad(threeYaw);
    threeCamera.rotation.x = 0;
    threeCamera.updateMatrixWorld();

    const mouse = new THREE.Vector2(clickX, 0); // Center or side
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
        
        const cy = -threeYaw;
        let y_diff = yaw - cy;
        while (y_diff > 180) y_diff -= 360;
        while (y_diff < -180) y_diff += 360;
        
        console.log(`Yaw: ${threeYaw}, clickX: ${clickX} -> p=(${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}), calcYaw=${yaw.toFixed(0)}, y_diff=${y_diff.toFixed(0)}`);
    } else {
        console.log("No intersection!");
    }
}

test(0, 0);
test(-45, 0);
test(-90, 0);
test(-180, 0);
test(90, 0);
test(0, 0.5); // Click right
test(0, -0.5); // Click left
