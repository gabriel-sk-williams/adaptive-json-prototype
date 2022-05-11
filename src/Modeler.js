import * as THREE from "three";
import React, { Component } from "react";
import { BufferGeometryUtils } from "./util/BufferGeometryUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "es6-tween";

import Interface from "./Interface.js";
import metaJSON from "./buffer/atx_meta.json";
import layerJSON from "./buffer/atx_layer.json";
import datumJSON from "./buffer/atx_datum.json";

import osmPoint_NODE from "./buffer/atx_osm_point_node.json";
import osmPoint_BUFFER from "./buffer/atx_osm_point_buffer.json";
import transitPoint_NODE from "./buffer/atx_transit_point_node.json";
import transitPoint_BUFFER from "./buffer/atx_transit_point_buffer.json";

import footway_NODE from "./buffer/atx_footway_node.json";
import footway_BUFFER from "./buffer/atx_footway_buffer.json";
import street_NODE from "./buffer/atx_street_node.json";
import street_BUFFER from "./buffer/atx_street_buffer.json";
import naturalPath_NODE from "./buffer/atx_natural_path_node.json";
import naturalPath_BUFFER from "./buffer/atx_natural_path_buffer.json";
import transitPath_BUFFER from "./buffer/atx_transit_path_buffer.json";
import transitPath_NODE from "./buffer/atx_transit_path_node.json";

import locale_NODE from "./buffer/atx_locale_node.json";
import locale_BUFFER from "./buffer/atx_locale_buffer.json";
import parcel_NODE from "./buffer/atx_parcel_node.json";
import parcel_BUFFER from "./buffer/atx_parcel_buffer.json";
import zoning_NODE from "./buffer/atx_zoning_node.json";
import zoning_BUFFER from "./buffer/atx_zoning_buffer.json";
import block_NODE from "./buffer/atx_block_node.json";
import block_BUFFER from "./buffer/atx_block_buffer";
import hexagon_NODE from "./buffer/atx_hexagon_node.json";
import hexagon_BUFFER from "./buffer/atx_hexagon_buffer";

import building_NODE from "./buffer/atx_building_node.json";
import building_BUFFER from "./buffer/atx_building_buffer";
import parkingMesh_NODE from "./buffer/atx_parking_node.json";
import parkingMesh_BUFFER from "./buffer/atx_parking_buffer";

import graph_NODE from "./buffer/atx_graph_node.json";
import graph_BUFFER from "./buffer/atx_graph_buffer.json";
import capacity_NODE from "./buffer/atx_capacity_node.json";
import capacity_BUFFER from "./buffer/atx_capacity_buffer.json";
//import ec_NODE from "./buffer/atx_edgechain_node.json";
//import ec_BUFFER from "./buffer/atx_edgechain_buffer.json";

import convert from "./util/Convert.js"
import util from "./util/Util.js";
import mat from "./util/Materials.js";
import monocentric from "./model/Monocentric.js";

class Modeler extends Component {

  constructor() {
    super();
    this.state = {
      layer: layerJSON.layer,
      meta: metaJSON.meta,
      datum: datumJSON.datum,
      activeTab: "Model",
      activeScale: "Region",
      focus: false,
      viewModel: false,
      view3D: true,
      viewSearch: false,

      selected: null,
      hovered: null,
      search: {
        search: "",
        keyword: "",
        address: ""
      },
      
      model: {
        equation: "density",
        mode: "existing",
        param: "total",
      },

      density: {
        v0: 1050,
        vx: 576.25,
        g: 0.3,
        x: datumJSON.datum["radius_km"]
      },
    }
  }

  // use this.val only when performing operations leading to intermediate state
  init = () => {
    this.environment = {};
    this.scene = new THREE.Scene();
    this.HOVER_MESH = new THREE.Mesh();
    this.HOVER_POINT = new THREE.Points();
    this.HOVER = new THREE.Mesh();
    this.SELECT_MESH = new THREE.Mesh();
    this.SELECT_POINT = new THREE.Points();
    this.SELECT = new THREE.Mesh();
    this.SELECT_FRAME = new THREE.LineSegments();
    this.GHOST = new THREE.Mesh();
    this.SEARCH = new THREE.Mesh();
    this.gpuScene = new THREE.Scene();
    this.gpuWindow = new THREE.WebGLRenderTarget(1,1);
    this.mouse = new THREE.Vector2();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 400000);
    // this.camera.position.set(2100, 3000, 4500);
    this.camera.position.set(6862, 18013, 32393);
    this.controls = new OrbitControls(this.camera, this.el);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      autoClear: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      //setClearColor: (0xabfbfd, 1.0)
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.el.appendChild(this.renderer.domElement); // mount using React ref
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
      hemiLight.color.setHSL(0.1, 1, 1);
      hemiLight.position.set(0, 250, -500);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.color.setHSL(0.1, 1, 0.95);
      dirLight.position.set(250, 500, 400);
      dirLight.target.position.set(500, 0, 0);
    this.scene.add(hemiLight);
    this.scene.add(dirLight);
    this.scene.add(this.HOVER);
    this.scene.add(this.HOVER_MESH);
    this.scene.add(this.HOVER_POINT);
    this.scene.add(this.SELECT);
    this.scene.add(this.SELECT_MESH);
    this.scene.add(this.SELECT_POINT);
    this.scene.add(this.GHOST);
    this.scene.add(this.SEARCH);
    this.scene.add(this.SELECT_FRAME);

    this.loadBoundary(this.state.datum["radius_mi"]);
    this.initNode("hexagon", hexagon_NODE, hexagon_BUFFER);
    this.initNode("osm_point", osmPoint_NODE, osmPoint_BUFFER);
    this.initNode("transit_point", transitPoint_NODE, transitPoint_BUFFER);
    this.initNode("footway", footway_NODE, footway_BUFFER);
    this.initNode("street", street_NODE, street_BUFFER);
    this.initNode("natural_path", naturalPath_NODE, naturalPath_BUFFER);
    this.initNode("transit_path", transitPath_NODE, transitPath_BUFFER);
    this.initNode("locale", locale_NODE, locale_BUFFER);
    this.initNode("parcel", parcel_NODE, parcel_BUFFER);
    this.initNode("zoning", zoning_NODE, zoning_BUFFER);
    this.initNode("block", block_NODE, block_BUFFER);
    this.initNode("building", building_NODE, building_BUFFER);
    this.initNode("parking", parkingMesh_NODE, parkingMesh_BUFFER);
    this.initNode("graph", graph_NODE, graph_BUFFER);
    this.initNode("capacity", capacity_NODE, capacity_BUFFER);

    this.loadMono(this.state.density);
    this.animate();
  };

  //
  // **RECEIVE OBJECTS FROM CHILDREN**
  //

  receiveScale = (newScale) => { this.setState({ activeScale: newScale }); }
  receiveTab = (newTab) => { this.setState({ activeTab: newTab }); }
  receiveMenuObj = (menuObj) => {
    this.state.activeTab === "Model"
    ? this.receiveModel(menuObj)
    : this.state.activeTab === "Layers"
    ? this.receiveLayer(menuObj)
    : this.state.activeTab === "Search"
    ? this.receiveSearch(menuObj)
    : console.log("menu error");
  }

  receiveModel = (model) => {
    this.setState({
        viewModel: true,
        model: model
    }, () => {
      const { equation, mode, param } = this.state.model;
      this.renderMonocentric(this.state.viewModel, equation, mode, param); 
    });
  }

  receiveLayer = (layerObj) => {
    this.setState({
      layer: layerObj,
    }, () => {
      for (let l = 0; l < layerObj.length; l++) {
        const { key, subtype, visible, hover } = layerObj[l];
        const env = this.accessLayer(key);
        this.renderLayer(env, subtype, visible, hover);
      }
    });
  }

  receiveSearch = (searchObj) => {
    let type = searchObj.search.toLowerCase();
    let query = searchObj[type];
    let viewSearch = !!query ? true : false;
    this.setState({ 
      search: searchObj,
      viewSearch: viewSearch
    }, () => {
      if (query) this.renderSearch(type, query)
    }); 
  }

  receiveDensity = (density) => {
    this.setState({
      density: density
    }, ()=> {
      const { equation, mode, param } = this.state.model;
      this.renderMonocentric(this.state.viewModel, equation, mode, param); 
    })
  }

  renderLayer = (env, subtypes, visible, hover) => {

      const toggleGPU = (gpu, visible) => {
        for (let key in gpu) {
          gpu[key].visible = visible;
        }
      }

    
    for (let k = 0; k < subtypes.length; k++) {
      let type = subtypes[k];
      if (visible && hover) { // hover material
        env.active.mesh[type].visible = visible;
        env.active.mesh[type].material = env.material.hover;          
        if (env.active.frame[type]) env.active.frame[type].visible = visible;
        toggleGPU(env.active.gpu[type], visible);
      }else if (visible && !hover) { // revert to base
        env.active.mesh[type].visible = visible;
        env.active.mesh[type].material = env.material.base[type];
        if (env.active.frame[type]) env.active.frame[type].visible = visible;
        toggleGPU(env.active.gpu[type], visible);
      }else if (!visible && hover) { // if !visible: make temporarily 'ghosted'
        env.active.mesh[type].visible = true;
        env.active.mesh[type].material = env.material.ghost;
      }else if (!visible && !hover) { // revert to invisible
        env.active.mesh[type].visible = visible;
        if (env.active.frame[type]) env.active.frame[type].visible = visible;
        toggleGPU(env.active.gpu[type], visible);
      }
    }
  }

  isolate = (...args) => {
    const layers = this.state.layer.slice();
    for (let i = 0; i < layers.length; i++) {
      let { layer } = layers[i];
      layers[i].visible = args.includes(layer) ? true : false;
    }
    this.receiveLayer(layers);
  }

  toggleLayer = (layer, state) => {
    const layers = this.state.layer.slice();
    let meta = layers.filter(obj => { return obj.layer === layer })[0];
    const { id, key, subtype } = meta;
    layers[id].visible = state;

    this.setState({
      layer: layers
    }, () => {
      const env = this.accessLayer(key);
      this.renderLayer(env, subtype, state, false);
    });
  }

  //
  // **RENDER CALLS**
  //
  renderHover = (env, subtype, key) => {
    if (subtype && subtype !== "loaded" && subtype !== "unloaded") {
      const { mesh } = env.meta;
      const bufferData = env.buffer[subtype][key];
      const influences = subtype === "population"
        ? env.active.gpu[subtype][key].morphTargetInfluences
        : []

      this.HOVER = mesh === "Point" ? this.HOVER_POINT : this.HOVER_MESH;
      this.HOVER.geometry = util.loadHover(mesh, bufferData, influences);
      this.HOVER.material = env.material.hover[subtype];
      this.HOVER.visible = true;
      this.HOVER_MESH.visible = mesh === "Point" ? false : true;
      this.HOVER_POINT.visible = mesh === "Point" ? true : false;
    }else{
      this.HOVER.visible = false;
    }
  }

  renderSelect = (node) => {
    if (node) {
      const { key, subtype } = node;
      const env = this.accessLayer(key);
      const { mesh } = env.meta;
      const bufferData = env.buffer[subtype][key];

      this.SELECT = mesh === "Point" ? this.SELECT_POINT : this.SELECT_MESH;
      this.SELECT.geometry = util.loadHover(mesh, bufferData);
      this.SELECT.material = env.material.select[subtype];
      this.SELECT.renderOrder = 999;

      if (mesh === "Mesh") {
        this.SELECT_FRAME.geometry = new THREE.EdgesGeometry(this.SELECT.geometry); 
        this.SELECT_FRAME.material = this.environment[1].material.edge;
        this.SELECT_FRAME.visible = true;
      }else{
        this.SELECT_FRAME.visible = false;
      }
      
      this.SELECT.visible = true;
      this.SELECT_MESH.visible = mesh === "Point" ? false : true;
      this.SELECT_POINT.visible = mesh === "Point" ? true : false;

    }else{
      this.SELECT.visible = false;
      this.SELECT_FRAME.visible = false;
    }
  }
  
  renderSearch = (type, query) => { // highlights search terms
    let env = this.environment[0];
    let searchBuffer = [];
    
    for (let key in env.node) { // search nodes for qualifying meshes
      let child = env.node[key];
      if (child[type].includes(query)) {
        let bufferData = env.buffer[child.subtype][key];
        if (bufferData) {
          let bufferGeometry = util.loadBuffer(env.meta.mesh, bufferData);
          searchBuffer.push(bufferGeometry);  
        }
      }
    }

    if (searchBuffer.length > 0) { // merge and render to this.SEARCH
      let mergedSearch = BufferGeometryUtils.mergeBufferGeometries(searchBuffer);
      this.SEARCH.geometry = mergedSearch;
      this.SEARCH.material = env.material.search;
      this.SEARCH.renderOrder = 500;
      this.SEARCH.visible = true;
    }else{
      this.SEARCH.visible = false;
    }
  }

  //
  // **LOADING CALLS**
  //

  initNode = (layer, nodeJSON, bufferJSON) => { // init()

    let meta = this.state.layer.filter(obj => { return obj.layer === layer })[0];
    let nodes = nodeJSON[layer + "_node"];
    let buffer = bufferJSON[layer + "_buffer"];

    let metaBlock = {
      meta: meta,
      node: nodes,
      buffer: buffer,
      material: mat.profile(meta),
      active: {
        mesh: {},
        frame: {},
        gpu: {}
      },
    }
    
    let mainID = meta.key.charAt(0);
    let subID = meta.key.charAt(1);

    if (!this.environment[mainID]) this.environment[mainID] = {};

    if (meta.key.length === 1) {
      this.environment[mainID] = metaBlock;
    }else{
      this.environment[mainID][subID] = metaBlock;
    }

    this.loadVisual(meta);
  }

  loadVisual = (meta) => {
    const { layer, mesh } = meta;
    let env = this.accessLayer(meta.key);
    let buffer = env.buffer;

    for (let subtype in buffer) {
      env.active.gpu[subtype] = {};
      let mergedBuffer = mesh === "Point" 
        ? this.pointGPU(env, meta, buffer, subtype) 
        : mesh === "Path"
        ? this.pathGPU(env, meta, buffer, subtype)
        : this.meshGPU(env, meta, buffer, subtype);

      if (mesh === "Point") {
        let pointCloud = new THREE.Points(mergedBuffer, env.material.base[subtype]);
        env.active.mesh[subtype] = pointCloud;
        env.active.mesh[subtype].visible = meta.visible;
        this.scene.add(pointCloud);
      }else{
        // add edges
        if (mesh === "Mesh" || layer === "parcel" || layer === "hex") { 
          let mergedEdges = new THREE.EdgesGeometry(mergedBuffer);
          let mergedFrame = new THREE.LineSegments(mergedEdges, env.material.edge);
          env.active.frame[subtype] = mergedFrame;
          env.active.frame[subtype].visible = meta.visible;
          this.scene.add(mergedFrame);
        }

        // add vertex colors
        if (mesh === "Mesh" || mesh === "Morph") {
          let meshmat = env.material.base[subtype];
          let basehex = env.material.base[subtype].name;
          let vertColors = mesh === "Morph" 
            ? this.getVertColors(mergedBuffer, basehex, 0x74339a) // basehex 0xa03ca0
            : this.getVertColors(mergedBuffer, basehex);

          mergedBuffer.setAttribute("color", vertColors); // purple
          
          if (mesh === "Morph") {
            let yellowAttr = this.getVertColors(mergedBuffer, 0xffd200, 0xe4a900);
            let blueAttr = this.getVertColors(mergedBuffer, 0x5aa9e6, 0x157ac7); // 0xbed2ff);
            let greenAttr = this.getVertColors(mergedBuffer, 0x8fc93a, 0x548908);
            mergedBuffer.setAttribute("morphColor0", yellowAttr); // will get switched
            mergedBuffer.setAttribute("morphColor1", blueAttr);
            mergedBuffer.setAttribute("morphColor2", yellowAttr);
            mergedBuffer.setAttribute("morphColor3", blueAttr);
            mergedBuffer.setAttribute("morphColor4", greenAttr);
            //let opAttr = this.getOpacity(mergedBuffer);
            //mergedBuffer.setAttribute("opacity", opAttr);
          }

          let mergedMesh = new THREE.Mesh(mergedBuffer, meshmat);
          env.active.mesh[subtype] = mergedMesh;
          env.active.mesh[subtype].visible = meta.visible;
          this.scene.add(mergedMesh);
        }else{
          let mergedMesh = new THREE.Mesh(mergedBuffer, env.material.base[subtype]);
          env.active.mesh[subtype] = mergedMesh;
          env.active.mesh[subtype].visible = meta.visible;
          this.scene.add(mergedMesh);
        } 
      }
    }
  }

/*
  getOpacity = (geometry) => {
    const posObj = geometry.getAttribute("position");
    let opacityAttr = [];
    for (let i = 0; i < posObj.array.length; i++) {
      if ((i-1) % 3 === 0) { // get y coord
        opacityAttr.push(posObj.array[i] === 0 ? 1.0 : 1.0); 
      }
    }
  
    return new THREE.Float32BufferAttribute(opacityAttr, 1);
  }
*/

  getVertColors = (geometry, hex, alt) => { // alt optional
    const posObj = geometry.getAttribute("position");
    let vertColors = [];
    let yCoords = posObj.array.filter((num, i) => (i-1) % 3 === 0);
    let althex = alt || hex;
    let color = new THREE.Color();
    for (let i = 0; i < posObj.count; i++) {
      if (yCoords[i] === 0) {
        color.set(althex);
        Array.prototype.push.apply(vertColors, color.toArray());
      }else{
        color.set(hex);
        Array.prototype.push.apply(vertColors, color.toArray());
      }
    }
    return new THREE.Float32BufferAttribute(vertColors, 3);
  }

  meshGPU = (env, meta, buffer, subtype) => {
    const { visible, mesh } = meta;
    var mergeArray = [];
    var meshIndex = {};
    for (let key in buffer[subtype]) {
      let bufferGeometry = util.loadBuffer(mesh, buffer[subtype][key]);
      mergeArray.push(bufferGeometry);

      let bufferMesh = new THREE.Mesh(bufferGeometry, mat.getGPU(key));
      meshIndex[key] = bufferMesh.geometry.attributes.position.count;

      bufferMesh.visible = visible;
      env.active.gpu[subtype][key] = bufferMesh;
      this.gpuScene.add(bufferMesh);
      // this.scene.add(bufferMesh);
    }
    let mergedBuffer = BufferGeometryUtils.mergeBufferGeometries(mergeArray, true);
    mergedBuffer.meshIndex = meshIndex;
    return mergedBuffer;
  };

  pathGPU = (env, meta, buffer, subtype) => {
    const { visible, mesh } = meta;
    var pathArray = [];
    
    for (let key in buffer[subtype]) {
      let bufferGeometry = util.loadBuffer(mesh, buffer[subtype][key]);
      pathArray.push(bufferGeometry);

      let bufferData = buffer[subtype][key];
      let bufferTube = util.loadBufferTube(bufferData);
      let pathMesh = new THREE.Mesh(bufferTube, mat.getGPU(key));
      pathMesh.visible = visible;
      env.active.gpu[subtype][key] = pathMesh;
      this.gpuScene.add(pathMesh);
    }

    let mergedPaths = BufferGeometryUtils.mergeBufferGeometries(pathArray, true);
    return mergedPaths;
  }

  pointGPU = (env, meta, buffer, subtype) => {
    const pointCloud = new THREE.BufferGeometry();
    const PARTICLE_SIZE = 99;
    var positions = [];
    var sizes = [];
    
    for (let key in buffer[subtype]) {
      let bufferData = buffer[subtype][key];
      Array.prototype.push.apply(positions, bufferData.position);
      sizes.push(PARTICLE_SIZE);

      let bufferSphere = util.loadBufferSphere(bufferData, 35, 4);
      let pointMesh = new THREE.Mesh(bufferSphere, mat.getGPU(key));
      pointMesh.visible = meta.visible;
      env.active.gpu[subtype][key] = pointMesh;
      this.gpuScene.add(pointMesh);
    }

    pointCloud.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    pointCloud.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return pointCloud;
  };

  updateScope = (layer) => {
    // increased scope: move geometries to buffer from external
    // decreased scope: move geometries to external from buffer
  }

  accessLayer = (key) => { // id is first two chars
    let mainID = key.charAt(0);
    let subID = key.charAt(1);
    return this.environment[mainID][subID] || this.environment[mainID];
  }
    
  loadMono = (state) => { // Create the protractor to add to the scene
    const { v0, g, x } = state;
    const vx = monocentric.calcMain(v0, g, x);
    this.setState({ vx: vx });
    const mast = monocentric.mast([0,0], v0);
    const frontier = monocentric.frontier(vx, x);
    const vectors = monocentric.genCurve(v0, vx, g, x);
    const curve = monocentric.curve(vectors);
    const buttress = new THREE.Mesh();
  
    this.environment.mono = {};
    this.environment.mono.mast = mast;
    this.environment.mono.frontier = frontier;
    this.environment.mono.curve = curve;
    this.environment.mono.buttress = buttress;
    this.environment.mono.material = monocentric.getGradient();

    let buttgeo = monocentric.buttress(curve.getPoints(15));
    buttress.geometry = buttgeo;
    buttress.morphTargetInfluences = []; // prepare for morph
    buttress.material = mat.monocentric("buttress");
    buttress.visible = false;

    this.scene.add(mast);
    this.scene.add(frontier);
    this.scene.add(buttress);
    this.scene.add(curve.mesh);
  }

  loadBoundary = (radius) => {
    const boundary = util.boundary([0,0], radius);
    boundary.visible = false;
    this.environment.boundary = {};
    this.environment.boundary.instance = boundary;
    this.scene.add(boundary);
  }

  //
  // **MONOCENTRIC MODEL**
  //
  
  // renders monocentric model
  renderMonocentric = (active, eq, mode, param) => {
    if (active) {
      if (eq === "density") this.monoDensity(mode, param);
      if (eq === "land value") this.monoLandValue(mode);
      if (eq === "transit") this.monoTransit(mode);
    }else{
      // this.revertGradient();
      this.isolate("hex", "street", "block", "building");
      const { mast, frontier, curve, buttress } = this.environment.mono;
      mast.visible = frontier.visible = curve.mesh.visible = buttress.visible = false;
    }
  }

  monoDensity = (mode, param) => {
    if (mode === "existing") { 
      this.isolate("hex", "street", "block", "graph");
      this.morphGraph(param);
    }
    if (mode === "expected") {
      this.isolate("hex", "street", "block", "graph");
      this.morphGraph(mode);
    }

    if (mode === "distortion") {
      this.isolate("hex", "street", "block", "building", "parking");
      const { v0, vx, g, x } = this.state.density;
      const { mast, frontier, curve, buttress } = this.environment.mono;
      const newVectors = monocentric.genCurve(v0, vx, g, x);
      mast.visible = frontier.visible = curve.mesh.visible = buttress.visible = true;

      this.morphSpline(curve, buttress, newVectors);
      this.morphY(frontier, vx);
      this.morphY(mast, v0);
      this.moveFrontier(frontier, x, 0);
      
      //const delay = t => new Promise(resolve => setTimeout(resolve, t));
      //delay(750).then(() => this.renderGradient(v0, g));
    }else{
      //this.revertGradient();
      const { mast, frontier, curve, buttress } = this.environment.mono;
      mast.visible = frontier.visible = curve.mesh.visible = buttress.visible = false;
    }
  }

  monoLandValue = (mode) => {
    this.isolate("hex", "street", "zoning", "block", "capacity");
    const { mast, frontier, curve, buttress } = this.environment.mono;
    mast.visible = frontier.visible = curve.mesh.visible = buttress.visible = false;
  }

  monoTransit = (mode) => {
    // isolate hex, block, street
    // color blocks by proximity to transit
  }

  // MORPH FUNCTIONS
  morphGraph = (morph) => {
    const env = this.environment["c"];
    const graphMesh = env.active.mesh.population;
    const gpuMesh = env.active.gpu.population;
    const influences = graphMesh.morphTargetInfluences;
    const prevState = influences[0] ? "residential"
      : influences[1] ? "office"
      : influences[2] ? "expected"
      : "total";

    if (prevState === morph) return;

    let resColor = graphMesh.geometry.getAttribute('morphColor2');
    let offColor = graphMesh.geometry.getAttribute('morphColor3');
    let expColor = graphMesh.geometry.getAttribute('morphColor4');

    // gpu morph
    for (let key in gpuMesh) {
      gpuMesh[key].updateMorphTargets();
      if (morph === "residential") {
        gpuMesh[key].morphTargetInfluences[0] = 1;
      }else if (morph === "office") {
        gpuMesh[key].morphTargetInfluences[1] = 1;
      }else if (morph === "expected") {
        gpuMesh[key].morphTargetInfluences[2] = 1;
      }
    }
    
    if (prevState === "total") {
      if (morph === "residential") graphMesh.geometry.setAttribute('morphColor0', resColor);
      if (morph === "office") graphMesh.geometry.setAttribute('morphColor0', offColor);
      if (morph === "expected") graphMesh.geometry.setAttribute('morphColor0', expColor);
    }
    
    // morphTargets SEEM to favor original placement
    if (prevState === "residential") { // natural morph0: yellow
      if (morph === "office") graphMesh.geometry.setAttribute('morphColor1', offColor);
      if (morph === "expected") graphMesh.geometry.setAttribute('morphColor1', expColor);
    }

    if (prevState === "office") { // natural morph1: blue
      if (morph === "residential") graphMesh.geometry.setAttribute('morphColor0', resColor);
      if (morph === "expected") graphMesh.geometry.setAttribute('morphColor1', expColor);
    }
    
    // graph morph
    new TWEEN.Tween({ morph: 0.0, revert: 1.0 }).to({ morph: 1.0, revert: 0.0 }, 750)
    .easing(TWEEN.Easing.Sinusoidal.Out)
    .on("update", function () {
      if (prevState === "residential") { // [1,0,0]
        influences[0] = this.object.revert;
      }else if (prevState === "office") { // [0,1,0]
        influences[1] = this.object.revert;
      }else if (prevState === "expected") { // [0,0,1]
        influences[2] = this.object.revert;
      }

      if (morph === "residential") { // [1,0,0]
        influences[0] = this.object.morph;
      }else if (morph === "office") { // [0,1,0]
        influences[1] = this.object.morph;
      }else if (morph === "expected") { // [0,0,1]
        influences[2] = this.object.morph;
      }
    })
    .on("complete", function () { // unused influences collapse to morphTarget0
      if (morph === "residential") graphMesh.geometry.setAttribute('morphColor0', resColor);
      if (morph === "office") graphMesh.geometry.setAttribute('morphColor0', offColor);
      if (morph === "expected") graphMesh.geometry.setAttribute('morphColor0', expColor);
    })
    .start();
  }

  morphSpline = (curve, buttress, np) => {
    let og = curve.points;
    let p = new THREE.Vector3();
    let q = new THREE.Vector3();
    let r = new THREE.Vector3();
    let s = new THREE.Vector3();

    let newButtressGeo = monocentric.buttress(np);
    let positions = newButtressGeo.attributes.position.array;

    buttress.geometry.morphAttributes.position[ 0 ] = 
      new THREE.Float32BufferAttribute(positions, 3);

    new TWEEN.Tween({
      morph: 0,
      x: [ og[0].x, og[1].x, og[2].x, og[3].x ],
      y: [ og[0].y, og[1].y, og[2].y, og[3].y ],
      z: [ og[0].z, og[1].z, og[2].z, og[3].z ], })
      .to({
        morph: 1,
        x: [ np[0].x, np[1].x, np[2].x, np[3].x ],
        y: [ np[0].y, np[1].y, np[2].y, np[3].y ],
        z: [ np[0].z, np[1].z, np[2].z, np[3].z ], }, 750)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .on("update", function () {
        let curvePoints = [ 
          p.set(this.object.x[0], this.object.y[0], this.object.z[0]),
          q.set(this.object.x[1], this.object.y[1], this.object.z[1]),
          r.set(this.object.x[2], this.object.y[2], this.object.z[2]),
          s.set(this.object.x[3], this.object.y[3], this.object.z[3]),
        ]
        curve.points = curvePoints;
        curve.mesh.geometry.setFromPoints(curve.getPoints(15));
        buttress.morphTargetInfluences[0] = this.object.morph;
      })
      .on("complete", function () {
        buttress.geometry.dispose();
        buttress.geometry = newButtressGeo;
        buttress.morphTargetInfluences[0] = 0;
      })
      .start();

    curve.mesh.geometry.attributes.position.needsUpdate = true;
  }

  morphY = (obj, val) => { 
    return new TWEEN.Tween(obj.scale).to({ y: val / 1000 }, 750)
      .easing(TWEEN.Easing.Sinusoidal.Out).start();
  }

  moveFrontier = (frontier, x, theta) => {
    let v = monocentric.rVector(convert.kmToFt(x), theta);
    return new TWEEN.Tween(frontier.position).to({ x: v.x, z: v.z }, 750)
      .easing(TWEEN.Easing.Sinusoidal.Out).start();
  }

  renderGradient = (v0, g) => {
    /*
    const env = this.environment[0];
    const bldgMesh = env.active.mesh.building;
    const meshIndex = bldgMesh.geometry.meshIndex;
    
    let vertColors = [];
    let color = new THREE.Color();
    
    for (let key in meshIndex) {
      const child = env.node[key]
      const { "distance:cbd": dCBD, "distance:transit": dTrn, "density:hectare":dHect } = child;
      const modelDensity = monocentric.modelDensity(v0, g, dCBD, dTrn);
      const distortion = monocentric.distortion(dHect, modelDensity);
      color.set(this.environment.mono.material[distortion]);

      const count = meshIndex[key];
      for (let i = 0; i < count; i++) {
        Array.prototype.push.apply(vertColors, color.toArray());
      }
    }

    bldgMesh.geometry.setAttribute( "color", new THREE.Float32BufferAttribute( vertColors, 3));
    */
  }
  
  revertGradient = () => {
    /*
    const env = this.environment[0];
    const bldgMesh = env.active.mesh.building;
    const meshIndex = bldgMesh.geometry.meshIndex;
    let vertColors = [];
    let color = new THREE.Color(0xffffff);

    for (let key in meshIndex) {
      const count = meshIndex[key];
      for (let i = 0; i < count; i++) {
        Array.prototype.push.apply(vertColors, color.toArray());
      }
    }

    bldgMesh.geometry.setAttribute("color", new THREE.Float32BufferAttribute( vertColors, 3));
    */
  }

  /*
  scaleScope = (scope, val) => {
    let x = convert.kmToFt(val);
    return new TWEEN.Tween(scope.scale).to({ x: x/1000, z: x/1000 }, 900)
      .easing(TWEEN.Easing.Sinusoidal.Out).start();
  }
  */

  //
  // **TOGGLES**
  //
  
  toggleModel = () => { 
    this.setState(prevState => ({ 
      viewModel: !prevState.viewModel 
    }), () => { 
      const { equation, mode, param } = this.state.model;
      this.renderMonocentric(this.state.viewModel, equation, mode, param); 
    });
  }

  toggle3D = () => { this.setState(prevState => ({ view3D: !prevState.view3D })); }

  //
  // **ANIMATION AND CONTROLS**
  //

  // getObjectById( id: Integer );
  // getObjectByName( name: String );
  // getObjectByProperty( name: String, value: Float );
  onMouseClick = (event) => { /*console.log(this.environment);*/ }

  onDoubleClick = () => {
    this.setState({ 
      selected: this.state.hovered,
      focus: false
    }, () => {
      this.renderSelect(this.state.selected);
    });
  }

  pick = () => {
    this.camera.setViewOffset( // set subcam to single pixel under mouse
      this.renderer.domElement.width, 
      this.renderer.domElement.height, 
      this.mouse.x * window.devicePixelRatio | 0, 
      this.mouse.y * window.devicePixelRatio | 0, 
      1, 1 
    );
    
    this.renderer.setRenderTarget( this.gpuWindow );
    this.renderer.render( this.gpuScene, this.camera );
    var pixelBuffer = new Uint8Array(4); // create buffer to read single pixel
    this.camera.clearViewOffset(); // clear view offset - returns rendering to normal
    this.renderer.readRenderTargetPixels(this.gpuWindow, 0, 0, 1, 1, pixelBuffer);

    let hex = pixelBuffer
      .slice(0, -1) // remove alpha channel from rgba
      .reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), ""); // convert rgb->hex
    
    if (!this.state.hovered || hex !== this.state.hovered.key || hex[0] === "c") {
      console.log(hex);
      let layerID = hex.substring(0,2);
      let localEnv = this.accessLayer(layerID);
      let node = localEnv.node[hex] || null;
      let subtype = node ? node.subtype : null;

      this.setState({ 
        hovered: node 
      }, () => {
        this.renderHover(localEnv, subtype, hex);
      });
    }
  }

  onMouseMove = (event) => {
    event.preventDefault();
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  componentDidMount() {
    this.init();
    window.addEventListener("resize", this.handleWindowResize);
    window.addEventListener("keydown", this.handleKeyDown);
    this.renderer.domElement.addEventListener("mousemove", this.onMouseMove, true);
    this.renderer.domElement.addEventListener("click", this.onMouseClick, false);
    this.renderer.domElement.addEventListener("dblclick", this.onDoubleClick, true);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.removeEventListener("keydown", this.handleKeyDown)
    window.cancelAnimationFrame(this.requestID);
    this.controls.dispose();
  }

  handleWindowResize = () => {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  handleKeyDown = (event) => {
    const F_KEY = 70;
    const SPACE_KEY = 32;
    const ENTER_KEY = 13;
    const E_KEY = 69;
    switch(event.keyCode) {
      case F_KEY:
        this.selectFocus();
        break;
      case ENTER_KEY:
        this.searchFocus();
        break;
      case SPACE_KEY:
        // this.morphGraph();
        break;
      case E_KEY:
        console.log(this.environment);
        break;
      default: 
        break;
    }
  }

  searchFocus = () => {
    let searched = this.SEARCH.geometry;
    console.log(searched);
    //focus(searched)
  }

  selectFocus = () => {
    if (this.state.selected) this.focus(this.state.selected);
  }

  focus = (obj) => {
    const self = this;
    this.setState(prevState => ({
      focus: !prevState.focus 
    }), () => {
      if (this.state.focus) {
        // let obj = this.state.selected;
        let posX = obj.centroid[0];
        let posZ = -obj.centroid[1];
        let posY = obj.height && obj.height instanceof Array
          ? obj.height[0]
          : obj.height
          ? Math.max(obj.height, 200) 
          : 275;

        const gpX = Math.sign(self.camera.position.x)
        const gpZ = Math.sign(self.camera.position.z)

        var fromCam = {
          x : self.camera.position.x,
          y : self.camera.position.y,
          z : self.camera.position.z
        };

        var toCam = {
          x : posX + (1200 * gpX),
          y : posY + 1800,
          z : posZ + (1200 * gpZ)
        };

        var fromTarget = {
          x : self.controls.target.x,
          y : self.controls.target.y,
          z : self.controls.target.z
        };

        var toTarget = {
          x : posX,
          y : posY / 2,
          z : posZ
        };
        
        new TWEEN.Tween(fromCam).to(toCam, 1500)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .on("update", function () {
            self.camera.position.set(this.object.x, this.object.y, this.object.z);
            self.camera.lookAt(posX,posY/2,posZ);
          })
          .on("complete", function () {
            self.camera.lookAt(posX,posY/2,posZ);
            self.camera.updateProjectionMatrix();
          })
          .start()
        
        new TWEEN.Tween(fromTarget).to(toTarget, 1500)
          .easing(TWEEN.Easing.Sinusoidal.Out)
          .on("update", function () {
            self.controls.target.set(this.object.x, this.object.y, this.object.z);
          })
          .on("complete", function () {
            self.controls.target.set(posX, posY/2, posZ);
          })
          .start()
      }
    }); 
  }

  animate = () => { // don't change the order
    TWEEN.update();
    this.controls.update();
    this.camera.updateProjectionMatrix();
    this.renderer.setRenderTarget( null );
    this.renderer.render(this.scene, this.camera);
    this.pick();
    this.requestID = window.requestAnimationFrame(this.animate);
  };

  render() {
    return (
      <div>
        <Interface  
          layer={this.state.layer}
          meta={this.state.meta}
          focused={this.state.focus}
          selected={this.state.selected}
          hovered={this.state.hovered}
          density={this.state.density}

          hlLayer={this.hlLayer}
          focus={this.focus}
          returnDensity={this.receiveDensity}
          returnMenuObj={this.receiveMenuObj}
          returnTab={this.receiveTab}
          returnScale={this.receiveScale}
          toggleModel={this.toggleModel}
          toggle3D={this.toggle3D} 
        />
        <div ref={ref => (this.el = ref)} />
      </div>
    );
  }
}

export default Modeler;