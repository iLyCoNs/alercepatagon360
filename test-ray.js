function test(threeYaw) {
    const yawRad = threeYaw * Math.PI / 180;
    
    // Simulate camera rotation 'YXZ' (only Y is active)
    // Camera default looks at -Z (0, 0, -1). Right is +X (1, 0, 0)
    // Rotate by yawRad around +Y axis
    
    // Rotation matrix for Y:
    // x' = x*cos + z*sin
    // z' = -x*sin + z*cos
    
    // Forward vector (0, 0, -1):
    const fX = -Math.sin(yawRad);
    const fZ = -Math.cos(yawRad);
    
    // Ray hits sphere at distance 500
    // But sphere is scaled (-1, 1, 1). Wait, raycaster is in world space!
    // So the intersection point is simply 500 * forward_vector.
    const pX = fX * 500;
    const pY = 0;
    const pZ = fZ * 500;
    
    // Math.atan2(p.x, -p.z)
    const yawCalculated = Math.atan2(pX, -pZ) * (180 / Math.PI);
    
    console.log(`threeYaw: ${threeYaw}`);
    console.log(`Intersection p: x=${pX.toFixed(2)}, z=${pZ.toFixed(2)}`);
    console.log(`Calculated yaw: ${yawCalculated.toFixed(2)}`);
    
    const cy = -threeYaw;
    let y_diff = yawCalculated - cy;
    while (y_diff > 180) y_diff -= 360;
    while (y_diff < -180) y_diff += 360;
    console.log(`y_diff (yaw - cy): ${y_diff.toFixed(2)}`);
    
    let y_diff_minus = -yawCalculated - cy;
    while (y_diff_minus > 180) y_diff_minus -= 360;
    while (y_diff_minus < -180) y_diff_minus += 360;
    console.log(`y_diff with -yaw: ${y_diff_minus.toFixed(2)}`);
    console.log('---');
}

test(0);
test(45);
test(90);
test(180);
test(-90);
