
var createScene = function () {

    //#region Geometry constants

    const HALF_PI = Math.PI / 2
    const PI = Math.PI
    const TWO_PI = Math.PI * 2

    //#endregion

    //#region Scene setup

    const scene = new BABYLON.Scene(engine)

    const camera = new BABYLON.ArcRotateCamera(`camera`, -HALF_PI, HALF_PI / 1.1, 10, BABYLON.Vector3.ZeroReadOnly)
    camera.attachControl()

    const light = new BABYLON.HemisphericLight(`light`, new BABYLON.Vector3(0, 1, 0), scene)
    light.intensity = 0.7

    //#endregion

    //#region XR setup

    const startXr = async () => {
        try {
            const xr = await scene.createDefaultXRExperienceAsync({})
        }
        catch(e) {
            console.debug(e)
        }
    }
    startXr()

    //#endregion

    //#region Geometry functions

    const intersection = (a1, a2, b1, b2, out) => {
        // Return `false` if one of the line lengths is zero.
        if ((a1.x === a2.x && a1.y === a2.y) || (b1.x === b2.x && b1.y === b2.y)) {
            return false
        }

        denominator = ((b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y))

        // Return `false` if lines are parallel.
        if (denominator === 0) {
            return false
        }

        let ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denominator
        let ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denominator

        // Return `false` if the intersection is not on the segments.
        if (ua < 0 || 1 < ua || ub < 0 || 1 < ub) {
            return false
        }

        // Set out vector's x and y coordinates.
        out.x = a1.x + ua * (a2.x - a1.x)
        out.y = a1.y + ua * (a2.y - a1.y)

        return true
    }

    const toDegrees = (value) => {
        return (value / TWO_PI) * 360
    }

    const toRadians = (value) => {
        return (value / 360) * TWO_PI
    }

    //#endregion

    //#region Ground

    const ground = BABYLON.MeshBuilder.CreateGround(`ground`, { width: 10, height: 10 })
    ground.material = new BABYLON.StandardMaterial(``)
    ground.material.backFaceCulling = false
    ground.material.alpha = 0.5

    //#endregion

    const mainParent = new BABYLON.TransformNode(`Main / ..`)

    //#region Spheres

    const sphereParent = new BABYLON.TransformNode(`Main / Spheres / ..`)
    sphereParent.parent = mainParent

    const sphere1 = BABYLON.MeshBuilder.CreateSphere(`Main / Spheres / 1`, { diameter: 1, segments: 16 })
    sphere1.parent = sphereParent
    sphere1.position.x = -2
    sphere1.position.y = 0.5

    const sphere2 = BABYLON.MeshBuilder.CreateSphere(`Main / Spheres / 2`, { diameter: 1, segments: 16 })
    sphere2.parent = sphereParent
    sphere2.position.x = 2
    sphere2.position.y = 0.5

    //#endregion

    //#region Boxes

    const boxParent = new BABYLON.TransformNode(`Main / Boxes / ..`)
    boxParent.parent = mainParent

    const box1 = BABYLON.MeshBuilder.CreateBox(`Main / Boxes / 1`, { size: 1 })
    box1.parent = boxParent
    box1.position.y = 0.5
    box1.position.z = -2

    const box2 = BABYLON.MeshBuilder.CreateBox(`Main / Boxes / 2`, { size: 1 })
    box2.parent = boxParent
    box2.position.y = 0.5
    box2.position.z = 2

    //#endregion

    //#region Theatre.js setup

    new class Theatre {
        constructor() {
            THEATRE.studio.initialize()

            this.project = THEATRE.project
            this.sheet = this.project.sheet(`Main sheet`)

            const createTheatreObjectForNode = (node) => {
                const properties = {
                    pos: THEATRE.types.compound({
                        x: THEATRE.types.number(node.position.x),
                        y: THEATRE.types.number(node.position.y),
                        z: THEATRE.types.number(node.position.z)
                    }),
                    rot: THEATRE.types.compound({
                        x: THEATRE.types.number(toDegrees(node.rotation.x)),
                        y: THEATRE.types.number(toDegrees(node.rotation.y)),
                        z: THEATRE.types.number(toDegrees(node.rotation.z))
                    }),
                    scale: THEATRE.types.compound({
                        x: THEATRE.types.number(node.scaling.x),
                        y: THEATRE.types.number(node.scaling.y),
                        z: THEATRE.types.number(node.scaling.z)
                    })
                }

                if (node.visibility !== undefined) {
                    properties.vis = THEATRE.types.number(node.visibility, { range: [0, 1] });
                }

                node.theatreObject = this.sheet.object(node.name, properties);
                node.theatreObject.babylonNode = node;

                node.theatreObject.onValuesChange((values) => {
                    {
                        node.visibility = values.vis;
                    }
                    {
                        const { x, y, z } = values.pos
                        node.position.set(x, y, z)
                    }
                    {
                        const { x, y, z } = values.rot
                        node.rotation.set(toRadians(x), toRadians(y), toRadians(z))
                    }
                    {
                        const { x, y, z } = values.scale
                        node.scaling.set(x, y, z)
                    }
                })

                let debounceTimeout = null;

                node.onAfterWorldMatrixUpdateObservable.add(() => {
                    if (gizmoManager.isDragging) {
                        clearTimeout(debounceTimeout);
                        debounceTimeout = setTimeout(() => {
                            THEATRE.studio.transaction(({ set }) => {
                                if (gizmoManager.positionGizmoEnabled) {
                                    set(node.theatreObject.props.pos, {
                                        x: node.position.x,
                                        y: node.position.y,
                                        z: node.position.z
                                    });
                                }
                                if (gizmoManager.rotationGizmoEnabled) {
                                    set(node.theatreObject.props.rot, {
                                        x: toDegrees(node.rotation.x),
                                        y: toDegrees(node.rotation.y),
                                        z: toDegrees(node.rotation.z)
                                    });
                                }
                                if (gizmoManager.scaleGizmoEnabled) {
                                    set(node.theatreObject.props.scale, {
                                        x: node.scaling.x,
                                        y: node.scaling.y,
                                        z: node.scaling.z
                                    });
                                }
                            });
                        }, 500);
                    }
                });

                const children = node.getChildTransformNodes(true);
                for (let i = 0; i < children.length; i++) {
                    createTheatreObjectForNode(children[i]);
                }
            }

            createTheatreObjectForNode(mainParent)
        }
    }

    //#endregion

    //#region Selection

    const gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.enableAutoPicking = false;
    gizmoManager.attachableMeshes = [sphere1, sphere2, box1, box2];

    gizmoManager.onAttachedToMeshObservable.add((mesh) => {
        THEATRE.studio.setSelection([mesh.theatreObject]);
    });

    let pointerDown = false;
    let pointerDragged = false;

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
			case BABYLON.PointerEventTypes.POINTERDOWN:
				if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh != ground) {
                    if (gizmoManager.attachedMesh !== pointerInfo.pickInfo.pickedMesh) {
                        gizmoManager.positionGizmoEnabled = true;
                        gizmoManager.attachToMesh(pointerInfo.pickInfo.pickedMesh);
                    } else if (gizmoManager.positionGizmoEnabled) {
                        gizmoManager.positionGizmoEnabled = false;
                        gizmoManager.rotationGizmoEnabled = true;
                    } else if (gizmoManager.rotationGizmoEnabled) {
                        gizmoManager.rotationGizmoEnabled = false;
                        gizmoManager.scaleGizmoEnabled = true;
                    } else if (gizmoManager.scaleGizmoEnabled) {
                        gizmoManager.scaleGizmoEnabled = false;
                    } else {
                        gizmoManager.positionGizmoEnabled = true;
                        THEATRE.studio.setSelection([gizmoManager.attachedMesh.theatreObject]);
                    }
                } else {
                    pointerDown = true;
                    pointerDragged = false;
                }

				break;

            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (pointerDown) {
                    pointerDragged = true;
                }
                break;

            case BABYLON.PointerEventTypes.POINTERUP:
                if (pointerDown && !pointerDragged) {
                    gizmoManager.positionGizmoEnabled = false;
                    gizmoManager.rotationGizmoEnabled = false;
                    gizmoManager.scaleGizmoEnabled = false;

                    THEATRE.studio.setSelection([]);
                }

                pointerDown = false;

                break;
        }
    });

    THEATRE.studio.onSelectionChange((selectedTheatreObjects) => {
        for (let i = 0; i < selectedTheatreObjects.length; i++) {
            const node = selectedTheatreObjects[i].babylonNode;
            if (!node) {
                gizmoManager.positionGizmoEnabled = false;
                gizmoManager.rotationGizmoEnabled = false;
                gizmoManager.scaleGizmoEnabled = false;
            } else if (node instanceof BABYLON.AbstractMesh) {
                gizmoManager.attachToMesh(node);
                gizmoManager.positionGizmoEnabled = true;
            } else {
                gizmoManager.attachToNode(node);
                gizmoManager.positionGizmoEnabled = true;
            }
        }
    });

    //#endregion

    return scene
}

function isInBabylonPlayground() {
    return document.getElementById('pg-root') !== null
}

if (!isInBabylonPlayground()) {
    module.exports = createScene
}
