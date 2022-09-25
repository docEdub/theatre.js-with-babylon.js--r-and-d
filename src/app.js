import * as BABYLON from 'babylonjs'
import { getProject, types } from '@theatre/core'
import studio from '@theatre/studio'
import state from '../theatre-states/Babylon-and-Theatre.theatre-project-state.json'

const createScene = require('./playground.js')

global.canvas = document.getElementsByTagName('canvas')[0]
global.engine = new BABYLON.Engine(canvas, true, { audioEngine: true, audioEngineOptions: {
    audioContext: new AudioContext
}})

global.THEATRE = {
    project: getProject(`Babylon-and-Theatre`, { state }),
    studio: studio,
    types: types
}

const scene = createScene()

engine.runRenderLoop(() => {
    scene.render();
})

onresize = () => {
    engine.resize()
}
