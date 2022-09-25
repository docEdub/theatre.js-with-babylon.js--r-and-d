
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
            if (!!xr && !!xr.enterExitUI) {
                xr.enterExitUI.activeButtonChangedObservable.add(() => {
                    BABYLON.Engine.audioEngine.unlock()
                })
            }
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
        return (value / TwoPI) * 360
    }

    //#endregion

    //#region Ground

    const ground = BABYLON.MeshBuilder.CreateGround(`ground`, { width: 10, height: 10 })
    ground.material = new BABYLON.StandardMaterial(``)
    ground.material.backFaceCulling = false
    ground.material.alpha = 0.5

    //#endregion

    const mainParent = new BABYLON.TransformNode(`Main`)

    //#region Spheres

    const sphereParent = new BABYLON.TransformNode(`Main / Spheres`)
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

    const boxParent = new BABYLON.TransformNode(`Main / Boxes`)
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
                    position: THEATRE.types.compound({
                        x: THEATRE.types.number(node.position.x, { range: [-5, 5] }),
                        y: THEATRE.types.number(node.position.y, { range: [-5, 5] }),
                        z: THEATRE.types.number(node.position.z, { range: [-5, 5] })
                    })
                }

                this.sheet.object(node.name, properties).onValuesChange((values) => {
                    const { x, y, z } = values.position
                    node.position.set(x, y, z)
                })
            }

            createTheatreObjectForNode(mainParent)

            createTheatreObjectForNode(sphereParent)
            createTheatreObjectForNode(sphere1)
            createTheatreObjectForNode(sphere2)

            createTheatreObjectForNode(boxParent)
            createTheatreObjectForNode(box1)
            createTheatreObjectForNode(box2)
        }
    }

    //#endregion

    return scene
}

function isInBabylonPlayground() {
    return document.getElementById('pg-root') !== null
}

if (!isInBabylonPlayground()) {
    module.exports = createScene
}
