"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js";
import { MOUSE } from "https://unpkg.com/three@0.128.0/build/three.module.js";

import {
  createCube,
  createDodecahedron,
  createOctahedron,
  createTetrahedron,
} from "./js/shapes.js";
import { dot } from "./js/point.js";

const moveButton = document.getElementById("move-button");
const set_rotation_axis = document.getElementById("set-rotation-axis");
const modalbutton1 = document.querySelector(".edit-button");
const modalbutton2 = document.querySelector(".add-button");

let lockVertices = document.getElementById("lock-vertices-cb");
let xyGrid = document.getElementById("xy-grid-cb");
let yzGrid = document.getElementById("yz-grid-cb");
let xzGrid = document.getElementById("xz-grid-cb");
let modalAdd = document.getElementById("add-modal");
let modalEdit = document.getElementById("edit-modal");
let container = document.getElementById("canvas-main");
let initial_pos = [5, 3, 3];
let xcomp = 1,
  ycomp = 0,
  zcomp = 0;
let spanEditModal = document.getElementsByClassName("close")[0];
let slider = document.getElementById("slider");
slider.addEventListener("input", movePoint);
document.getElementById("slider").max = document.getElementById("theta").value;
document.getElementById("slider").min = 0;
slider.step =
  (document.getElementById("slider").max -
    document.getElementById("slider").min) /
  document.getElementById("frames").value;

let rot_axis = new THREE.Vector3(xcomp, ycomp, zcomp);
rot_axis.normalize();
let total_angle = document.getElementById("theta").value;
let frames = document.getElementById("frames").value;
let present_theta = 0;
let scene,
  PI = 3.141592653589793,
  camera,
  renderer,
  orbit,
  shapes = [],
  xygrid = [],
  yzgrid = [],
  xzgrid = [],
  dragX = [],
  dragY = [],
  dragZ = [],
  lock = 0,
  dir = [],
  arrowHelper = [];

let trans_matrix = new THREE.Matrix4();
trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

// Modal controls for Add Shape Button
let addModal = document.getElementById("add-modal");
let spanAddModal = document.getElementsByClassName("close")[1];

spanAddModal.onclick = function () {
  addModal.style.display = "none";
};
lockVertices.addEventListener("click", () => {
  if (lockVertices.checked) {
    lock = 1;
    orbit.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    orbit.target.set(0, 0, 0);
    orbit.dampingFactor = 0.05;
    orbit.enableDamping = true;
  } else {
    lock = 0;
    orbit.mouseButtons = {
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    orbit.target.set(0, 0, 0);
    orbit.dampingFactor = 0.05;
    orbit.enableDamping = true;
  }
});
xyGrid.addEventListener("click", () => {
  if (xyGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 0, 1);
    grid.lookAt(vector3);
    xygrid.push(grid);
    scene.add(xygrid[0]);
  } else {
    scene.remove(xygrid[0]);
    xygrid.pop();
  }
});
xzGrid.addEventListener("click", () => {
  if (xzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    grid.geometry.rotateZ(PI / 2);
    xzgrid.push(grid);
    scene.add(xzgrid[0]);
  } else {
    scene.remove(xzgrid[0]);
    xzgrid.pop();
  }
});
yzGrid.addEventListener("click", () => {
  if (yzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 1, 0);
    grid.lookAt(vector3);
    yzgrid.push(grid);
    scene.add(yzgrid[0]);
  } else {
    scene.remove(yzgrid[0]);
    yzgrid.pop();
  }
});
let buttons = document.getElementsByTagName("button");
const size = 50;
const divisions = 25;

document.getElementById("add-shape-btn").onclick = function () {
  modalAdd.style.display = "block";
  modalbutton2.addEventListener("click", () => {
    let xcoord = document.getElementById("x1").value;
    let ycoord = document.getElementById("y1").value;
    let zcoord = document.getElementById("z1").value;
    noOfShapes++;
    console.log(document.getElementById("shape-add-dropdown").value);
    if (document.getElementById("shape-add-dropdown").value === "Cube") {
      createCube(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragZ
      );
    }
    if (document.getElementById("shape-add-dropdown").value === "Tetrahedron") {
      createTetrahedron(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragZ
      );
    }
    if (document.getElementById("shape-add-dropdown").value === "Octahedron") {
      createOctahedron(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragZ
      );
    }
    if (
      document.getElementById("shape-add-dropdown").value === "Dodecahedron"
    ) {
      createDodecahedron(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragZ
      );
    }
    modalAdd.style.display = "none";
  });
};
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane();
let pNormal = new THREE.Vector3(0, 1, 0);
let planeIntersect = new THREE.Vector3();
let pIntersect = new THREE.Vector3();
let shift = new THREE.Vector3();
let isDragging = false;
let dragObject;
let point = [];
let shapeVertex = [];
let dotList = [];
let noOfShapes = 0;
document.addEventListener("dblclick", ondblclick, false);
// double click
function ondblclick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(shapes);
  if (intersects.length > 0) {
    const geometry = new THREE.SphereGeometry(1, 32, 16);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    line.position.set(
      intersects[0].object.position.x,
      intersects[0].object.position.y,
      intersects[0].object.position.z
    );
    scene.add(line);
    document.getElementById("delete-shape-btn").onclick = function () {
      scene.remove(line);
      for (let i = 0; i < intersects.length; i++) {
        scene.remove(intersects[i].object);
        noOfShapes--;
      }
    };

    document.getElementById("edit-shape-btn").onclick = function () {
      document.getElementById("edit-modal").style.display = "block";
      document.querySelector(".edit-button").addEventListener("click", () => {
        for (let i = 0; i < intersects.length; i++) {
          scene.remove(intersects[i].object);
          scene.remove(line);
        }
        let xcoord = document.getElementById("x").value;
        let ycoord = document.getElementById("y").value;
        let zcoord = document.getElementById("z").value;
        noOfShapes++;
        if (document.querySelector("select").value === "Cube") {
          createCube(
            xcoord,
            ycoord,
            zcoord,
            shapes,
            scene,
            point,
            shapeVertex,
            dragX,
            dragY,
            dragZ
          );
        }
        if (document.querySelector("select").value === "Tetrahedron") {
          createTetrahedron(
            xcoord,
            ycoord,
            zcoord,
            shapes,
            scene,
            point,
            shapeVertex,
            dragX,
            dragY,
            dragZ
          );
        }
        if (document.querySelector("select").value === "Octahedron") {
          createOctahedron(
            xcoord,
            ycoord,
            zcoord,
            shapes,
            scene,
            point,
            shapeVertex,
            dragX,
            dragY,
            dragZ
          );
        }
        if (document.querySelector("select").value === "Dodecahedron") {
          createDodecahedron(
            xcoord,
            ycoord,
            zcoord,
            shapes,
            scene,
            point,
            shapeVertex,
            dragX,
            dragY,
            dragZ
          );
        }
        document.getElementById("edit-modal").style.display = "none";
      });
    };
  }
}

spanEditModal.onclick = function () {
  modalEdit.style.display = "none";
};

// document.addEventListener("pointermove", (event) => {
//     const rect = renderer.domElement.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     mouse.x = (x / container.clientWidth) * 2 - 1;
//     mouse.y = (y / container.clientHeight) * -2 + 1;
//     if (mouse.x < 1 && mouse.x > -1 && mouse.y < 1 && mouse.y > -1) {
//         raycaster.setFromCamera(mouse, camera);
//         if (isDragging && lock === 0) {
//             for (let i = 0; i < shapes.length; i++) {
//                 raycaster.ray.intersectPlane(plane, planeIntersect);
//                 shapes[i].geometry.vertices[0].set(
//                     planeIntersect.x + shift.x,
//                     planeIntersect.y + shift.y,
//                     planeIntersect.z + shift.z
//                 );
//                 shapes[i].geometry.verticesNeedUpdate = true;
//                 shapeVertex[i].position.set(
//                     planeIntersect.x + shift.x - dragX[i],
//                     planeIntersect.y + shift.y - dragY[i],
//                     planeIntersect.z + shift.z - dragZ[i]
//                 );
//             }
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         } else if (isDragging) {
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         }
//     }
// });
// document.addEventListener("pointerdown", () => {
//     switch (event.which) {
//         case 1:
//             const rect = renderer.domElement.getBoundingClientRect();
//             const x = event.clientX - rect.left;
//             const y = event.clientY - rect.top;

//             mouse.x = (x / container.clientWidth) * 2 - 1;
//             mouse.y = (y / container.clientHeight) * -2 + 1;
//             pNormal.copy(camera.position).normalize();
//             plane.setFromNormalAndCoplanarPoint(pNormal, scene.position);
//             raycaster.setFromCamera(mouse, camera);
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//             let position = new THREE.Vector3(
//                 shapeVertex[0].position.x,
//                 shapeVertex[0].position.y,
//                 shapeVertex[0].position.z
//             );
//             shift.subVectors(position, planeIntersect);
//             isDragging = true;
//             dragObject = shapes[shapes.length - 1];
//             break;
//     }
// });
// document.addEventListener("pointerup", () => {
//     isDragging = false;
//     dragObject = null;
// });

let vectorArrow; // Global reference for the arrow
moveButton.addEventListener("click", () => {
  let x = parseFloat(document.getElementById("quantityx").value);
  let y = parseFloat(document.getElementById("quantityy").value);
  let z = parseFloat(document.getElementById("quantityz").value);

  // Create a translation matrix to move the point
  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(
    x - dotList[0].geometry.getAttribute("position").array[0],
    y - dotList[0].geometry.getAttribute("position").array[1],
    z - dotList[0].geometry.getAttribute("position").array[2]
  );

  // Apply translation to the point's geometry
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Update the transformation matrix
  trans_matrix.multiply(translate_M);

  // Update initial position for future reference
  initial_pos[0] = x;
  initial_pos[1] = y;
  initial_pos[2] = z;

  // Draw the updated vector arrow from the origin to the new point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  if (vectorArrow) {
    // Remove the old arrow if it exists
    scene.remove(vectorArrow);
  }

  // Create a new arrow helper and add it to the scene
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000);
  scene.add(vectorArrow); // Add the new arrow to the scene
});

function movePoint(e) {
  
  var target = e.target ? e.target : e.srcElement;
  let rot_angle =
    (target.value * parseFloat(document.getElementById("theta").value)) /
      target.max -
    present_theta;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, (rot_angle * Math.PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // --- Handle Dot Rotation ---
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // --- Handle Shapes Rotation ---
  for (let i = 0; i < shapes.length; i++) {
    // Translate the shape's geometry
    shapes[i].geometry.applyMatrix4(rot_matrix);

    // Update geometry (handle BufferGeometry and Geometry)
    if (shapes[i].geometry.isBufferGeometry) {
      shapes[i].geometry.attributes.position.needsUpdate = true;
      shapes[i].geometry.computeBoundingBox();
      shapes[i].geometry.computeVertexNormals();
    } else {
      shapes[i].geometry.verticesNeedUpdate = true;
    }

    // Apply translation to the edges' geometry
    shapes[i].traverse((child) => {
      if (child.isLineSegments) {
        // More robust way to identify edges
        child.geometry.applyMatrix4(rot_matrix);

        // Update edge geometry (handle BufferGeometry and Geometry)
        if (child.geometry.isBufferGeometry) {
          child.geometry.attributes.position.needsUpdate = true;
          child.geometry.computeBoundingBox();
        } else {
          child.geometry.verticesNeedUpdate = true;
        }
      }
    });
  }

  // Apply the rotation matrix to the transformation matrix
  trans_matrix.multiply(rot_matrix);

  // Get the position of the first dot and update the display for the dot
  let position = dotList[0].geometry.getAttribute("position").array;
  document.getElementById("quantityx").value = position[0];
  document.getElementById("quantityy").value = position[1];
  document.getElementById("quantityz").value = position[2];

  // Update the transformation matrix in the UI
  if (target.value <= 0) {
    trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  document.getElementById("matrix-00").value = trans_matrix.elements[0];
  document.getElementById("matrix-01").value = trans_matrix.elements[1];
  document.getElementById("matrix-02").value = trans_matrix.elements[2];
  document.getElementById("matrix-03").value = trans_matrix.elements[3];

  document.getElementById("matrix-10").value = trans_matrix.elements[4];
  document.getElementById("matrix-11").value = trans_matrix.elements[5];
  document.getElementById("matrix-12").value = trans_matrix.elements[6];
  document.getElementById("matrix-13").value = trans_matrix.elements[7];

  document.getElementById("matrix-20").value = trans_matrix.elements[8];
  document.getElementById("matrix-21").value = trans_matrix.elements[9];
  document.getElementById("matrix-22").value = trans_matrix.elements[10];
  document.getElementById("matrix-23").value = trans_matrix.elements[11];

  document.getElementById("matrix-30").value = trans_matrix.elements[12];
  document.getElementById("matrix-31").value = trans_matrix.elements[13];
  document.getElementById("matrix-32").value = trans_matrix.elements[14];
  document.getElementById("matrix-33").value = trans_matrix.elements[15];

  // --- Draw Vector Arrow for the first dot ---
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  if (vectorArrow) {
    // Remove the old arrow if it exists
    scene.remove(vectorArrow);
  }

  // Create the new vector arrow for the first dot
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xab53b2);
  scene.add(vectorArrow); // Add the new arrow to the scene

  // Update the present_theta (global rotation angle)
  present_theta += rot_angle;
}

document.getElementById("frames").onchange = function () {
  let new_value = document.getElementById("frames").value; // New value for frames
  let target = document.getElementById("slider");
  let rot_angle =
    (target.value * parseFloat(document.getElementById("theta").value)) /
      new_value -
    present_theta;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, (rot_angle * PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // Apply the rotation matrix to the point's geometry
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Multiply the transformation matrix
  trans_matrix.multiply(rot_matrix);

  // Update the position fields (quantityx, quantityy, quantityz)
  document.getElementById("quantityx").value =
    dotList[0].geometry.getAttribute("position").array[0];
  document.getElementById("quantityy").value =
    dotList[0].geometry.getAttribute("position").array[1];
  document.getElementById("quantityz").value =
    dotList[0].geometry.getAttribute("position").array[2];

  // Reset the transformation matrix if the target value is less than or equal to 0
  if (target.value <= 0) {
    trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  // Update the matrix values in the UI
  document.getElementById("matrix-00").value = trans_matrix.elements[0];
  document.getElementById("matrix-01").value = trans_matrix.elements[1];
  document.getElementById("matrix-02").value = trans_matrix.elements[2];
  document.getElementById("matrix-03").value = trans_matrix.elements[3];
  document.getElementById("matrix-10").value = trans_matrix.elements[4];
  document.getElementById("matrix-11").value = trans_matrix.elements[5];
  document.getElementById("matrix-12").value = trans_matrix.elements[6];
  document.getElementById("matrix-13").value = trans_matrix.elements[7];
  document.getElementById("matrix-20").value = trans_matrix.elements[8];
  document.getElementById("matrix-21").value = trans_matrix.elements[9];
  document.getElementById("matrix-22").value = trans_matrix.elements[10];
  document.getElementById("matrix-23").value = trans_matrix.elements[11];
  document.getElementById("matrix-30").value = trans_matrix.elements[12];
  document.getElementById("matrix-31").value = trans_matrix.elements[13];
  document.getElementById("matrix-32").value = trans_matrix.elements[14];
  document.getElementById("matrix-33").value = trans_matrix.elements[15];

  // Update present_theta
  present_theta += rot_angle;

  // Update the slider max value
  document.getElementById("slider").max = new_value;

  // Recalculate the vector for the updated point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0); // Origin at (0, 0, 0)
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]); // New point position
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize(); // Direction from origin to point
  let length = endPoint.distanceTo(origin); // Length of the arrow (distance from origin to point)

  // Remove the old arrow if it exists
  if (vectorArrow) {
    scene.remove(vectorArrow);
  }

  // Create and add the new arrow based on the updated point
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000); // Red color
  scene.add(vectorArrow); // Add the new arrow to the scene
};

document.getElementById("theta").onchange = function () {
  let old_sli_val = document.getElementById("slider").value;
  let new_tot_angle = document.getElementById("theta").value;
  let new_theta = present_theta * (new_tot_angle / total_angle);

  if (new_theta > total_angle) new_theta = total_angle;

  let quat = new THREE.Quaternion();
  let rot_matrix = new THREE.Matrix4();
  quat.setFromAxisAngle(rot_axis, ((new_theta - present_theta) * PI) / 180);
  rot_matrix.makeRotationFromQuaternion(quat);

  // Apply the rotation to the point's geometry
  dotList[0].geometry.applyMatrix4(rot_matrix);
  dotList[0].geometry.verticesNeedUpdate = true;

  // Update the position fields (quantityx, quantityy, quantityz)
  document.getElementById("quantityx").value =
    dotList[0].geometry.getAttribute("position").array[0];
  document.getElementById("quantityy").value =
    dotList[0].geometry.getAttribute("position").array[1];
  document.getElementById("quantityz").value =
    dotList[0].geometry.getAttribute("position").array[2];

  // Update the slider value
  document.getElementById("slider").value =
    old_sli_val * (new_tot_angle / total_angle);

  // Update the slider max and step
  total_angle = new_tot_angle;
  document.getElementById("slider").max = new_tot_angle;
  slider.step =
    (document.getElementById("slider").max -
      document.getElementById("slider").min) /
    frames;

  // Update present_theta
  present_theta = new_theta;

  // Recalculate the vector for the updated point
  let position = dotList[0].geometry.getAttribute("position").array;
  let origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(position[0], position[1], position[2]);
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();
  let length = endPoint.distanceTo(origin);

  // Remove the old arrow if it exists
  if (vectorArrow) {
    scene.remove(vectorArrow);
  }

  // Create and add the new arrow based on the updated point
  vectorArrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000); // Red color
  scene.add(vectorArrow); // Add the new arrow to the scene
};

set_rotation_axis.addEventListener("click", () => {
  if (document.getElementById("axis-change-dropdown").value == 0) {
    xcomp = 1;
    ycomp = 0;
    zcomp = 0;
  }
  if (document.getElementById("axis-change-dropdown").value == 1) {
    ycomp = 1;
    xcomp = 0;
    zcomp = 0;
  }
  if (document.getElementById("axis-change-dropdown").value == 2) {
    zcomp = 1;
    xcomp = 0;
    ycomp = 0;
  }

  rot_axis = new THREE.Vector3(
    parseFloat(xcomp),
    parseFloat(ycomp),
    parseFloat(zcomp)
  );
});

scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);
camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

let init = function () {
  camera.position.z = 5;
  camera.position.x = 2;
  camera.position.y = 2;
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
  const gridHelper = new THREE.GridHelper(size, divisions);
  const count = 1;
  let dir_x = new THREE.Vector3(1, 0, 0);
  let dir_y = new THREE.Vector3(0, 1, 0);
  let dir_z = new THREE.Vector3(0, 0, 1);
  let negdir_x = new THREE.Vector3(-1, 0, 0);
  let negdir_y = new THREE.Vector3(0, -1, 0);
  let negdir_z = new THREE.Vector3(0, 0, -1);

  const origin = new THREE.Vector3(0, 0, 0);
  let endPoint = new THREE.Vector3(
    initial_pos[0],
    initial_pos[1],
    initial_pos[2]
  );

  const length = 10;
  arrowHelper[0] = new THREE.ArrowHelper(dir_x, origin, length, "red");
  arrowHelper[1] = new THREE.ArrowHelper(dir_y, origin, length, "yellow");
  arrowHelper[2] = new THREE.ArrowHelper(dir_z, origin, length, "blue");
  arrowHelper[3] = new THREE.ArrowHelper(negdir_x, origin, length, "red");
  arrowHelper[4] = new THREE.ArrowHelper(negdir_y, origin, length, "yellow");
  arrowHelper[5] = new THREE.ArrowHelper(negdir_z, origin, length, "blue");
  for (let i = 0; i < 6; i++) {
    scene.add(arrowHelper[i]);
  }
  let direction = new THREE.Vector3().subVectors(endPoint, origin).normalize();

  vectorArrow = new THREE.ArrowHelper(
    direction,
    origin,
    endPoint.distanceTo(origin),
    0xab53b2
  );
  scene.add(vectorArrow); // Add the new arrow to the scene

  let PointGeometry = dot(scene, dotList, initial_pos);
  renderer = new THREE.WebGLRenderer();
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.mouseButtons = {
    LEFT: MOUSE.PAN,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.ROTATE,
  };
  orbit.target.set(0, 0, 0);
  orbit.enableDamping = true;
};
let mainLoop = function () {
  renderer.render(scene, camera);
  requestAnimationFrame(mainLoop);
};
init();
mainLoop();
