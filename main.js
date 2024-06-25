import * as THREE from 'three'

import TWEEN from '@tweenjs/tween.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer, LoopOnce } from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let mixer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 8, 5)
camera.lookAt(0, 0, 0)

let warriormodel = 'assets/warrior.glb'
if (localStorage.getItem('warriormodel') !== null) {
  warriormodel = localStorage.getItem("warriormodel");
  document.getElementById("select").style.display = "none";
  
}
const renderer = new THREE.WebGLRenderer()

renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setClearColor(0x000000);

let doubleshoot = false
let bigshoot = 0
let slow = 0
let length = 5
let cubez = 3
let crabz = 0
let crabvisible = false
let norm = 0
let bricktxt = './assets/bricks.png'
let bricktxt2 = './assets/brick.png'
let modify = 0
let bg = './assets/background.png'
//const controls = new OrbitControls(camera, renderer.domElement)
if (localStorage.getItem("boss") == 1){
bricktxt ='./assets/desert.png'
bricktxt2 = './assets/brickdesert.png'
bg = './assets/desertground.png'
modify = 1}
if (localStorage.getItem("boss") == 2){
  bricktxt ='./assets/toxic.png'
  bricktxt2 = './assets/bricktoxic.png'
  bg = './assets/industry.png'
  modify = 2}
const textureLoader = new THREE.TextureLoader();
const brick = new THREE.TextureLoader().load(bricktxt)
brick.minFilter = THREE.LinearFilter;
brick.magFilter = THREE.LinearFilter;
const bricksmall = new THREE.TextureLoader().load(bricktxt2)
bricksmall.minFilter = THREE.LinearFilter;
bricksmall.magFilter = THREE.LinearFilter;
const nature = new THREE.TextureLoader().load('./assets/nature.jpg')
const cubeboss = new THREE.TextureLoader().load('./assets/cube.png')
const cubeboss2 = new THREE.TextureLoader().load('./assets/cubeangry.png')
scene.background = new THREE.TextureLoader().load(bg)

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

class BoxText extends THREE.Mesh {

  constructor({ width, height, walltype = "null", opacity, transparent = false, depth, texture = '#e82323', velocity = { x: 0, y: 0, z: 0 }, position = { x: 0, y: 0, z: 0 }, z = false }) {
    super(

      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ map: texture, transparent, opacity }))
    this.height = height
    this.width = width
    this.depth = depth
    this.walltype = walltype

    this.position.set(position.x, position.y, position.z)

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

    this.velocity = velocity
    this.gravity = 0.002

    this.z = z
    this.collided = false;

  }

  resetCollision() {
    this.collided = false;
  }

  updateSides() {

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

  }

  update(grounds) {
    this.updateSides();

    if (this.z == true) {
      this.velocity.z += 0.0001;
    }

    let isOnGround = false;
    for (const ground of grounds) {
      const xCollision = this.right >= ground.left && this.left <= ground.right;
      const yCollision = this.bottom <= ground.top && this.top >= ground.bottom;
      const zCollision = this.front >= ground.back && this.back <= ground.front;

      if (xCollision && yCollision && zCollision) {
        isOnGround = true;
        this.position.y = ground.top + this.height / 2;
        this.velocity.y = 0; 
        break; 
      }
    }

    if (!isOnGround) {
      this.applyGravity();
    }
  }


  applyGravity(ground) {
    this.velocity.y += this.gravity

    if (boxCollision({
      box1: this,
      box2: ground
    })) {
      this.velocity.y *= 0.8
      this.velocity.y = -this.velocity.y
    }
    else this.position.y -= this.velocity.y

  }

}

class Box extends THREE.Mesh {

  constructor({ width, height, name = null,test = 1, depth, hp = 1, boss = 0, opacity, alive = true, transparent = true, color = '#e82323', velocity = { x: 0, y: 0, z: 0 }, position = { x: 0, y: 0, z: 0 }, z = false, isEnemyBullet = false }) {
    super(

      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, transparent, opacity }))
    this.height = height
    this.width = width
    this.depth = depth
    this.opacity = opacity
    this.alive = alive
    this.transparent = transparent
    this.hp = hp
    this.name = name
    this.boss = boss

    this.position.set(position.x, position.y, position.z)

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

    this.velocity = velocity
    this.gravity = 0.002
    this.test = test
    this.z = z
    this.collided = false;
    this.isEnemyBullet = isEnemyBullet

  }

  resetCollision() {
    this.collided = false;
  }

  updateSides() {

    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2

  }

  update(ground) {

    this.updateSides()

    if (this.z == true) {
      this.velocity.z += 0.0001
    }

    this.position.z += this.velocity.z
    this.position.x += this.velocity.x

    const xCollision = this.right >= ground.left && this.left <= ground.right
    const yCollision = this.bottom <= ground.top && this.top >= ground.bottom
    const zCollision = this.front >= ground.back && this.back <= ground.front

    if (xCollision && yCollision && zCollision) {


    }


    this.applyGravity(ground)

  }

  applyGravity(ground) {
    this.velocity.y += this.gravity


    //padanie
    if (boxCollision({
      box1: this,
      box2: ground
    })) {
      this.velocity.y *= 0.8
      this.velocity.y = -this.velocity.y
    }
    else this.position.y -= this.velocity.y

  }

}

let index = 999
new Audio('./assets/music/game.mp3').play()
class GLTFModel extends THREE.Group {
  constructor(url, options = {}) {
    super();

    const { position = { x: 0, y: 0, z: 0 },starter = false, scale = 1,special = false, hasinteracted = false, onCollision = null, rotate = 0, loop = false, pos = 50,pos2 = 50, velocity = { x: 0, y: 0, z: 0 } } = options;

    const loader = new GLTFLoader();

    loader.load(url, (gltf) => {
      const model = gltf.scene;

      model.scale.set(scale, scale, scale);
      model.position.set(position.x / pos2, position.y, position.z / pos);

      this.mixer = new THREE.AnimationMixer(model);

      gltf.animations.forEach((clip) => {

        let action = this.mixer.clipAction(clip);

        action.clampWhenFinished = true;
        if (loop != true) {
          action.setLoop(THREE.LoopOnce);
        }
        action.play(0)

      });
      this.hasinteracted = hasinteracted
      this.velocity = velocity
      this.special = special
      this.starter = starter
      this.add(model);
      this.rotation.set(0, rotate, 0)
      this.width = model.scale.x;
      this.height = model.scale.y;
      this.depth = model.scale.z;
      this.position.set(position.x, position.y, position.z);

      this.right = this.position.x + this.width / 2
      this.left = this.position.x - this.width / 2

      this.bottom = this.position.y - this.height / 2
      this.top = this.position.y + this.height / 2

      this.front = (this.position.z + this.depth / 2) - 0.14
      this.back = (this.position.z - this.depth / 2) - 0.24




    });


  }

  update(ground) {


    this.right = this.position.x + this.width / 2
    this.left = this.position.x - this.width / 2

    this.bottom = this.position.y - this.height / 2
    this.top = this.position.y + this.height / 2

    this.front = this.position.z + this.depth / 2
    this.back = this.position.z - this.depth / 2


  }

  updateMixer(time) {
    if (this.mixer) {
      this.mixer.update(time); 
    }
  }
}



function bosssave(num){
  localStorage.setItem("screen", 1);
  localStorage.setItem("boss", num);
  localStorage.setItem("hp", hp);
  localStorage.setItem("shield", shield);
  localStorage.setItem("norm", norm);
  localStorage.setItem("money", money);
  localStorage.setItem("slow", slow);
  localStorage.setItem("doubleshoot", doubleshoot);
  localStorage.setItem("bigshoot", bigshoot);
  const gunsJSON = JSON.stringify(guns);
  localStorage.setItem('guns', gunsJSON);
  const selectedGunJSON = JSON.stringify(selectedGun);
  localStorage.setItem('selectedGun', selectedGunJSON);
  const potionsJSON = JSON.stringify(potions);
  localStorage.setItem('potions', potionsJSON);
  localStorage.setItem("cubez", 3);
  localStorage.setItem("crabz", 0);
  localStorage.setItem("crabvisible", crabvisible);
}

window.GameSave = function(){
  localStorage.setItem("screen", 1);
  localStorage.setItem("hp", hp);
  localStorage.setItem("shield", shield);
  localStorage.setItem("norm", norm);
  localStorage.setItem("slow", slow);
  localStorage.setItem("doubleshoot", doubleshoot);
  localStorage.setItem("bigshoot", bigshoot);
  localStorage.setItem("money", money);
  localStorage.setItem("crabz", petcrab.position.z);
  localStorage.setItem("crabvisible", crabvisible);
  const gunsJSON = JSON.stringify(guns);
  localStorage.setItem('guns', gunsJSON);
  const selectedGunJSON = JSON.stringify(selectedGun);
  localStorage.setItem('selectedGun', selectedGunJSON);
  const potionsJSON = JSON.stringify(potions);
  localStorage.setItem('potions', potionsJSON);
  if(cube.position.z<-30){
    localStorage.setItem("cubez", -30);
    localStorage.setItem("length", 5);
  }
  if(cube.position.z<-80){
    localStorage.setItem("cubez", -80);
    localStorage.setItem("length", 105);
  }
  if(cube.position.z<-130){
    localStorage.setItem("cubez", -130);
    localStorage.setItem("length", 105);
  }
  if(cube.position.z<-180){
    localStorage.setItem("cubez", -180);
    localStorage.setItem("length", 205);
  }
  if(cube.position.z<-230){
    localStorage.setItem("cubez", -230);
    localStorage.setItem("length", 205);
  }
  if(cube.position.z<-280){
    localStorage.setItem("cubez", -280);
    localStorage.setItem("length", 305);
  }
  
}

let hp = 4
let maxhp = hp
let shield = 2
let money = 0
let guns = []
let shieldRegenerationTimer = null;
let canHpDown = true;

function hpdown() {
  if (canHpDown) {
    let originalColor = ambientLight.color.getHex();
    ambientLight.color.set(0xf00000);

    setTimeout(function() {
      ambientLight.color.set(originalColor);
    }, 1000);
    if(untarget == false){
    if (shield > 0) {
      shield = shield - 1;
    } else {
      hp = hp - 1;
    }
    canHpDown = false;
    setTimeout(() => {
      canHpDown = true;
    }, 1000);}
  }
}

function health() {

  document.getElementById("heart").innerHTML = hp;
  document.getElementById("shield").innerHTML = shield;
  if (shield < 2 && !shieldRegenerationTimer) {

    shieldRegenerationTimer = setInterval(() => {
      if (shield < 2) {
        shield += 1;
        document.getElementById("shield").innerHTML = shield;
      } else {

        clearInterval(shieldRegenerationTimer);
        shieldRegenerationTimer = null;
      }
    }, 5000);
  }

}

    function boxCollision({ box1, box2 }) {
      const xCollision = box1.right >= box2.left && box1.left <= box2.right
      const yCollision = box1.bottom - box1.velocity.y <= box2.top && box1.top >= box2.bottom
      const zCollision = box1.front >= box2.back && box1.back <= box2.front

      return xCollision && yCollision && zCollision
    }

function boxCollisions({ boxy, box2 }) {
  const xCollision = boxy.right >= box2.left && boxy.left <= box2.right
  const yCollision = boxy.bottom - boxy.velocity.y <= box2.top && boxy.top >= box2.bottom
  const zCollision = boxy.front >= box2.back && boxy.back <= box2.front

  if (boxy.back <= box2.front && zCollision && boxy.position.distanceTo(box2.position) < box2.width * 1.4 && boxy.left) {

    //console.log(boxy.position.distanceTo(box2.front) + "daleko")
    // boxy.position.distanceTo(box2.position) < box2.width /2
  } else {

  }


}

function modeldel({ enemiesarray, modelsarray }) {

  if (enemiesarray.length === modelsarray.length) {
    for (let i = 0; i < enemiesarray.length; i++) {
      const enemy = enemiesarray[i];
      const modelenemy = modelsarray[i];

      enemy.update(ground)
      if (enemy.alive == false) {
        scene.remove(modelenemy)
      }


    }
  }
}



let Spawned = false;

const platforms = [];
const platformsmele = [];
const enemies = [];
const modelenemies = [];
const renemies = [];
const enemiesarray = [];
const modelsarray = [];
const rmodelsarray = [];
const renemiesarray = [];
const modelrenemies = [];
const allmodels = [];
const allenemies = [];

class spider {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/spider.glb';
    this.name = "spider";
    this.hp = 3 + modify;
    this.scale = 1;
    this.speed = 0
  }
}

class hermit {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/hermit.glb';
    this.name = "hermit";
    this.hp = 4 + modify;
    this.scale = 1;
    this.speed = 0
  }
}

class gargoyle {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/gargoyle.glb';
    this.name = "gargoyle";
    this.hp = 3 + modify;
    this.scale = 1.2;
    this.speed = 0
  }
}


class cobra {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/cobra.glb';
    this.name = "cobra";
    this.hp = 3 + modify;
    this.scale = 1.2;
    this.speed = 0
  }
}

class assassin {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/assassin.glb';
    this.name = "assassin";
    this.hp = 3 + modify;
    this.scale = 1.8;
    this.speed = 0
  }
}

class rat {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/rat.glb';
    this.name = "rat";
    this.hp = 3 + modify;
    this.scale = 0.7;
    this.speed = 0
  }
}

class nuclear {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/nuclear.glb';
    this.name = "nuclear";
    this.hp = 3 + modify;
    this.scale = 1.3;
    this.speed = 0
  }
}

class trashcan {
  constructor() {
    this.width = 0.8;
    this.texture = './assets/trashcan.glb';
    this.name = "trashcan";
    this.hp = 3 + modify;
    this.scale = 1.3;
    this.speed = 0
  }
}

let melevariants = [new gargoyle(),new cobra(),new hermit(),new spider(),new rat()]
let desertvariants = [new cobra(),new hermit(),new spider(),new assassin()]
let toxicvariants = [new cobra(),new rat(),new trashcan(),new nuclear()]
let meleinfo= new gargoyle ();

function spawnmele({ xax, zax }) {
  const randomIndex = Math.floor(Math.random() * melevariants.length);
  meleinfo= melevariants[randomIndex];
  if (localStorage.getItem("boss") == 1){
    const randomIndex = Math.floor(Math.random() * desertvariants.length);
    meleinfo= desertvariants[randomIndex];
  }

  if (localStorage.getItem("boss") == 2){
    const randomIndex = Math.floor(Math.random() * toxicvariants.length);
    meleinfo= toxicvariants[randomIndex];
  }
  
  scene.remove(...platformsmele);
  platformsmele.splice(0, platformsmele.length);
  for (let i = 0; i < 3; i++) {
    enemiescount += 1
    const x = Math.random() * 10 - 5;
    const z = Math.random() * 10 - 5;

    const platformmele = new Box({
      width: 1,
      height: 0.1,
      depth: 1,
      color: 0x00ff00,
      position: { x: x + xax, y: -0.5, z: z + zax },
    });
    //platformmele.map = cubeboss2;
    scene.add(platformmele);
    platformsmele.push(platformmele);
  }

  setTimeout(() => {
    platformsmele.forEach(platformmele => {
      const enemy = new Box({
        width: meleinfo.width,
        height: 0.8,
        depth: meleinfo.width,
        color: 0xff0000,
        transparent: true,
        opacity: 0,
        position: { x: platformmele.position.x, y: 0.25, z: platformmele.position.z },
        velocity: { x: 0, y: 0, z: 0 },
        z: false,
        hp: meleinfo.hp,
        name: meleinfo.name,
      });

      scene.add(enemy);
      enemies.push(enemy);
      enemiesarray.push(enemy);
      allenemies.push(enemy);

      const meleenemy = new GLTFModel(meleinfo.texture, {
        position: { x: platformmele.position.x, y: -0.2, z: platformmele.position.z },
        velocity: { x: 0, y: 0, z: 0 },
        scale: meleinfo.scale,
        loop: true,
        pos: 999,

      });

      scene.add(meleenemy);
      modelenemies.push(meleenemy);
      modelsarray.push(meleenemy);
      allmodels.push(meleenemy);
    });
  }, 2000);

}

function spawnpirates({ xax, zax }) {

    scene.remove(...platformsmele);
    platformsmele.splice(0, platformsmele.length);
    for (let i = 0; i < 2; i++) {
      enemiescount += 1;
      const x = Math.random() * 10 - 5;
      const z = Math.random() * 10 - 5;

      const platformmele = new Box({
        width: 1,
        height: 0.1,
        depth: 1,
        color: 0x00ff00,
        position: { x: x + xax, y: -0.5, z: z + zax },
      });

      scene.add(platformmele);
      platformsmele.push(platformmele);
    }

    platformsmele.forEach(platformmele => {
      const enemy = new Box({
        width: 0.8,
        height: 0.8,
        depth: 0.8,
        color: 0xff0000,
        transparent: true,
        opacity: 0,
        position: { x: platformmele.position.x, y: 0.25, z: platformmele.position.z },
        velocity: { x: 0, y: 0, z: 0 },
        z: false,
        hp: 3,
        name: "pirate",
      });

      scene.add(enemy);
      enemies.push(enemy);
      enemiesarray.push(enemy);
      allenemies.push(enemy);

      const meleenemy = new GLTFModel('./assets/pirate.glb', {
        position: { x: platformmele.position.x, y: -0.2, z: platformmele.position.z },
        velocity: { x: 0, y: 0, z: 0 },
        scale: 1.5,
        loop: true,
        pos: 999,
      });

      scene.add(meleenemy);
      modelenemies.push(meleenemy);
      modelsarray.push(meleenemy);
      allmodels.push(meleenemy);
    });
  
}

let hasSpawnedblob = false

function spawnblob({ xax, zax }) {
  if (!hasSpawnedblob) { 
  scene.remove(...platformsmele);
  platformsmele.splice(0, platformsmele.length);
  for (let i = 0; i < 2; i++) {
    enemiescount += 1;
    const x = Math.random() * 10 - 5;
    const z = Math.random() * 10 - 5;

    const platformmele = new Box({
      width: 1,
      height: 0.1,
      depth: 1,
      color: 0x00ff00,
      position: { x: x + xax, y: -0.5, z: z + zax },
    });

    scene.add(platformmele);
    platformsmele.push(platformmele);
  }

  platformsmele.forEach(platformmele => {
    const enemy = new Box({
      width: 0.8,
      height: 0.8,
      depth: 0.8,
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      position: { x: platformmele.position.x, y: 0.25, z: platformmele.position.z },
      velocity: { x: 0, y: 0, z: 0 },
      z: false,
      hp: 3,
      name: "blob",
    });

    scene.add(enemy);
    enemies.push(enemy);
    enemiesarray.push(enemy);
    allenemies.push(enemy);

    const meleenemy = new GLTFModel('./assets/blob.glb', {
      position: { x: platformmele.position.x, y: -0.2, z: platformmele.position.z },
      velocity: { x: 0, y: 0, z: 0 },
      scale: 1.5,
      loop: true,
      pos: 999,
    });

    scene.add(meleenemy);
    modelenemies.push(meleenemy);
    modelsarray.push(meleenemy);
    allmodels.push(meleenemy);
  });
}
hasSpawnedblob = true
}


const lootenemies = []
let boss = 0
let hasSpawned = false; 

function spawncubeboss({ x, z }) {
  if (!hasSpawned) {
    boss = 1
    hasSpawned = true;
    enemiescount += 1
    const enemy = new Box({
      width: 7,
      height: 7,
      depth: 7,
      transparent: true,
      opacity: 0.7,
      color: 0xA9A9A9,
      position: { x, y: 2.5, z },
      velocity: { x: 0, y: 0, z: 0 },
      z: false,
      hp: 20,
      boss: 1,
      name: "cube",
    });

    enemy.material.map = cubeboss2;
    scene.add(enemy);
    enemies.push(enemy);
    allenemies.push(enemy);
    lootenemies.push(enemy);
  }
}

let hasSpawnedPirateShipBoss = false
let warnings = []
let explosives = []

let hasSpawnedMirror = false;

const mirrors = [];

function spawnMirror({ x, z }) {

  const spawnSingleMirror = (mirrorName, mirrorPosition, color) => {
    enemiescount += 1;
    boss = 3;

    const Mirror = new Box({
      width: 4.4,
      height: 4,
      depth: 2,
      transparent: true,
      opacity: 0,
      color: color,
      position: mirrorPosition,
      velocity: { x: 0, y: 0, z: 0 },
      z: false,
      hp: 30,
      boss: 3,
      name: mirrorName,
    });

    scene.add(Mirror);
    enemies.push(Mirror);
    enemiesarray.push(Mirror);
    if(Mirror.name == "Mirror"){
    allenemies.push(Mirror);}
    lootenemies.push(Mirror);

    const bossenemy = new GLTFModel("./assets/mirror.glb", {
      position: mirrorPosition,
      velocity: { x: 0, y: -0.5, z: 0 },
      scale: 2,
      loop: true,
      pos: 999,
      special: true,
    });

    scene.add(bossenemy);
    modelenemies.push(bossenemy);
    modelsarray.push(bossenemy);
    allmodels.push(bossenemy);

    return Mirror;
  };

  if (!hasSpawnedMirror) {
    hasSpawnedMirror = true;

    let originalMirror = spawnSingleMirror("Mirror", { x, y: -0.5, z }, 0x223300);
    mirrors.push(originalMirror);

    setTimeout(() => {
      let cloneMirror1 = spawnSingleMirror(
        "CloneMirror",
        { x: x + 8, y: -0.5, z: z },
        0x663300
      );

      mirrors.push(cloneMirror1);
    }, 2000); 

    setTimeout(() => {
      let cloneMirror2 = spawnSingleMirror(
        "CloneMirror",
        { x: x - 8, y: -0.5, z: z },
        0x663300
      );
      
      mirrors.push(cloneMirror2);
    }, 4000); 
  }
}

function moveMirrorForwardAndBack(mirror, duration, distance) {
  const originalPosition = { ...mirror.position };

  const forwardPosition = { ...mirror.position };
  forwardPosition.z += distance;

  const backwardPosition = { ...originalPosition };

  new TWEEN.Tween(mirror.position)
    .to(forwardPosition, duration / 2)
    .onComplete(() => {
      new TWEEN.Tween(mirror.position)
        .to(backwardPosition, duration / 2)
        .start();
    })
    .start();
}

function updateMirrors() {
  const duration = 500; 

  const tempPosition = { ...mirrors[0].position };

  for (let i = 0; i < mirrors.length - 1; i++) {
    const targetPosition = mirrors[i + 1].position;

    new TWEEN.Tween(mirrors[i].position)
      .to(targetPosition, duration)
      .start();

    new TWEEN.Tween(modelsarray[i].position)
      .to(targetPosition, duration)
      .start();
  }

  new TWEEN.Tween(mirrors[mirrors.length - 1].position)
    .to(tempPosition, duration)
    .onComplete(() => {
      
      const randomIndex = Math.floor(Math.random() * mirrors.length);
      const randomMirror = mirrors[randomIndex];
      moveMirrorForwardAndBack(randomMirror, duration, 22); 
    })
    .start();

  new TWEEN.Tween(modelsarray[mirrors.length - 1].position)
    .to(tempPosition, duration)
    .start();
}


function shuffleMirrors() {
  
  setInterval(updateMirrors, 5000);
}

function spawnPirateShipBoss({ x, z }) {
  if (!hasSpawnedPirateShipBoss) {
    hasSpawnedPirateShipBoss = true;
    enemiescount += 1;
    boss = 2
    const pirateShipBoss = new Box({
      width: 20,
      height: 5,
      depth: 10,
      transparent: true,
      opacity: 0,
      color: 0x663300, 
      position: { x, y: 2.5, z },
      velocity: { x: 0, y: 0, z: 0 },
      z: false,
      hp: 30,
      boss: 2,
      name: "pirateShipBoss",
    });

    scene.add(pirateShipBoss);
    enemies.push(pirateShipBoss);
    enemiesarray.push(pirateShipBoss);
    allenemies.push(pirateShipBoss);
    lootenemies.push(pirateShipBoss);

    const bossenemy = new GLTFModel('./assets/ship.glb', {
      position: { x, y: -1, z },
      velocity: { x: 0, y: 0, z: 0 },
      scale: 6,
      loop: true,
      pos: 999,
      rotate:1.55,
      special:true,

    });

    scene.add(bossenemy);
    modelenemies.push(bossenemy);
    modelsarray.push(bossenemy);
    allmodels.push(bossenemy);
  }
}
function spawnevilchest({ x, z }) {
  
  enemiescount += 1
      const enemy = new Box({
        width: 2,
        height: 2,
        depth: 1.5,
        transparent:true,
        opacity:0,
        color: 0xff0000,
        position: { x, y: 0.25, z },
        velocity: { x: 0, y: 0, z: 0 },
        z: false,
        hp: 8,
        name: "evilchest",
      });

      scene.add(enemy);
      enemies.push(enemy);
      enemiesarray.push(enemy);
      allenemies.push(enemy);
      lootenemies.push(enemy)

      const meleenemy = new GLTFModel('./assets/evilchest.glb', {
        position: { x, y: -0.2, z },
        velocity: { x: 0, y: 0, z: 0 },
        scale: 2.5,
        loop: true,
        pos: 999,

      });

      scene.add(meleenemy);
      modelenemies.push(meleenemy);
      modelsarray.push(meleenemy);
      allmodels.push(meleenemy);
      



}

function follow({ box1, box2 }) {
  if (box2) {
    box1.position.x = box2.position.x
    box1.position.z = box2.position.z
  }
  else {
    scene.remove(box1)

  }
}

class wind {
  constructor() {
    this.width = 1.2;
    this.texture = './assets/wind.glb';
    this.name = "wind";
    this.hp = 2 + modify;
    this.scale = 1;
    this.speed = 0.4
    this.bullet = 0xadd8e6
    this.size = 0.24
  }
}

class lich {
  constructor() {
    this.size = 0.3
    this.width = 1.2;
    this.texture = './assets/lich.glb';
    this.name = "lich";
    this.hp = 4 + modify; 
    this.scale = 1;
    this.speed = 0.1
    this.bullet = 0xAA336A
  }
}

class ghost {
  constructor() {
    this.size = 0.3
    this.width = 0.8;
    this.texture = './assets/ghost.glb';
    this.name = "ghost";
    this.hp = 3 + modify;
    this.scale = 1.4;
    this.speed = 0.15
    this.bullet = 0xFFA500
  }
}

class skeleton {
  constructor() {
    this.size = 0.2
    this.width = 1;
    this.texture = './assets/skeleton.glb';
    this.name = "skeleton";
    this.hp = 3 + modify;
    this.scale = 1.8;
    this.speed = 0.22
    this.bullet = 0xffffff
  }
}

class mosq {
  constructor() {
    this.size = 0.2
    this.width = 1;
    this.texture = './assets/mosq.glb';
    this.name = "mosq";
    this.hp = 3 + modify;
    this.scale = 3;
    this.speed = 0.22
    this.bullet = 0xffffff
  }
}

class skelemage {
  constructor() {
    this.size = 0.35
    this.width = 1;
    this.texture = './assets/skelemage.glb';
    this.name = "skelemage";
    this.hp = 4 + modify;
    this.scale = 1.5;
    this.speed = 0.15
    this.bullet = 0xffffff
  }
}

class eye {
  constructor() {
    this.size = 0.35
    this.width = 1;
    this.texture = './assets/eye.glb';
    this.name = "eye";
    this.hp = 3 + modify;
    this.scale = 1;
    this.speed = 0.18
    this.bullet = 0xffffff
  }
}

class mage {
  constructor() {
    this.size = 0.2
    this.width = 1;
    this.texture = './assets/mage.glb';
    this.name = "mage";
    this.hp = 3 + modify;
    this.scale = 1.3;
    this.speed = 0.18
    this.bullet = 0xffffff
  }
}

class frog {
  constructor() {
    this.size = 0.2
    this.width = 1;
    this.texture = './assets/frog.glb';
    this.name = "frog";
    this.hp = 3 + modify;
    this.scale = 1.5;
    this.speed = 0.18
    this.bullet = 0xffffff
  }
}

let rangevariants = [new skeleton(),new ghost(),new lich(),new wind()]
let desertrvariants = [new skeleton(),new skelemage(),new mosq(),]
let toxicrvariants = [new frog(),new mage(),new eye(),new lich(),]
let rangeinfo= new lich ();

function spawnrange({ xax, zax }) {

  const randomIndex = Math.floor(Math.random() * rangevariants.length);
  rangeinfo= rangevariants[randomIndex];
  if (localStorage.getItem("boss") == 1){
    const randomIndex = Math.floor(Math.random() * desertrvariants.length);
    rangeinfo= desertrvariants[randomIndex];
  }

  if (localStorage.getItem("boss") == 2){
    const randomIndex = Math.floor(Math.random() * toxicrvariants.length);
    rangeinfo= toxicrvariants[randomIndex];
  }
  Spawned = true;
  scene.remove(...platforms);
  platforms.splice(0, platforms.length);

  for (let i = 0; i < 3; i++) {

    enemiescount += 1

    const x = Math.random() * 10 - 5;
    const z = Math.random() * 10 - 5;

    const platform = new Box({
      width: 1,
      height: 0.1,
      depth: 1,
      color: 3333,
      position: { x: x + xax, y: -0.5, z: z + zax },
    });

    scene.add(platform);
    platforms.push(platform);

  }

  setTimeout(() => {
    platforms.forEach(platform => {
      const rangeenemy = new Box({
        width: rangeinfo.width,
        height: 0.8,
        depth: rangeinfo.width,
        color: 0xff0000,
        position: { x: platform.position.x, y: 0.25, z: platform.position.z },
        velocity: { x: 0, y: 0, z: 0 },
        opacity: 0,
        transparent: true,
        z: false,
        hp: rangeinfo.hp,
        name: rangeinfo.name,
      });

      scene.add(rangeenemy);
      renemies.push(rangeenemy);
      renemiesarray.push(rangeenemy);
      allenemies.push(rangeenemy);

      const skeleton = new GLTFModel(rangeinfo.texture, {
        position: { x: platform.position.x, y: -0.25, z: platform.position.z },
        scale: rangeinfo.scale,
        loop: true,
        pos: 999,
      });

      scene.add(skeleton);
      modelrenemies.push(skeleton);
      rmodelsarray.push(skeleton);
      allmodels.push(skeleton);
    });
  }, 2000);


}
let doors = []
let animates = []
let cobwebs = []
let lavas = []
let wells = []
let lavatxt = './assets/lava.glb'
if (localStorage.getItem("boss") == 1){
  lavatxt = './assets/cactus.glb'
}
if (localStorage.getItem("boss") == 2){
  lavatxt = './assets/toxiclava.glb'
}
function spawnobstacles({ x, z }) {
  const numCobwebs = Math.floor(Math.random() * 3) + 3;
  const numLavas = Math.floor(Math.random() * 2) + 1;
  const minDistance = 5; 

  let positions = [];

  for (let i = 0; i < numCobwebs; i++) {
    let position;
    do {
      position = {
        x: x + getRandomInRange(-10, 10),
        y: -0.3,
        z: z + getRandomInRange(-10, 10),
      };
    } while (isTooClose(position, positions, minDistance));

    positions.push(position);

    const cobweb = new GLTFModel('./assets/cobweb.glb', {
      position,
      scale: 1.5,
      pos: 250,
    });

    scene.add(cobweb);
    cobwebs.push(cobweb);
  }

  for (let i = 0; i < numLavas; i++) {
    let position;
    do {
      position = {
        x: x + getRandomInRange(-5, 5),
        y: -0.3,
        z: z + getRandomInRange(-5, 5),
      };
    } while (isTooClose(position, positions, minDistance));

    positions.push(position);

    const lava = new GLTFModel(lavatxt, {
      position,
      scale: 3,
      loop: true,
      pos: 250,
    });

    scene.add(lava);
    animates.push(lava);
    lavas.push(lava);
  }
}

function isTooClose(position, positions, minDistance) {
  return positions.some(pos => Math.hypot(pos.x - position.x, pos.z - position.z) < minDistance);
}

function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}


let heals = []
let shops = []
let gunshops = []
let knifeshops = []
let chests = []

function spawnloot(z) {
  let loot = Math.floor(Math.random() * 5) + 1;
  //let loot = 4
  if (loot == 1){

  const chest = new GLTFModel('./assets/chest.glb', {
    position: { x: 0, y: -0.3, z: z },
    scale: 2.5,
    rotate: 3.14,
    pos: 999,
  });

  scene.add(chest);
  chests.push(chest)


  const shop = new GLTFModel('./assets/shop.glb', {
    position: { x: 10, y: -0.3, z: z - 5 },
    scale: 3,
    rotate: 3.14,
    pos: 2000,
  });


  scene.add(shop);
  shops.push(shop)

  const shopbox = new BoxText({
    width: 9,
    height: 4,
    depth: 7,
    transparent: true, 
    opacity: 0, 
    texture: brick,
    position: { x: 10, y: -0.5, z: z -5 },
  });

  scene.add(shopbox);
  shops.push(shopbox)

  const heal = new GLTFModel('./assets/heal.glb', {
    position: { x: -10, y: -0.3, z: z - 5 },
    scale: 1.8,
    rotate: 3.14,
    pos: 999,
  });

  scene.add(heal);
  heals.push(heal)}

  if (loot == 2){

    const chest = new GLTFModel('./assets/chest.glb', {
      position: { x: 0, y: -0.3, z: z },
      scale: 2.5,
      rotate: 3.14,
      special:true,
      pos: 999,
    });
  
    scene.add(chest);
    chests.push(chest)


  }

  if (loot == 3){

    const chest = new GLTFModel('./assets/chest.glb', {
      position: { x: 0, y: -0.3, z: z },
      scale: 2.5,
      rotate: 3.14,
      pos: 999,
    });
  
    scene.add(chest);
    chests.push(chest)
  
    const gunshop = new GLTFModel('./assets/gunshop.glb', {
      position: { x: 10, y: -0.3, z: z - 5 },
      scale: 0.4,
      rotate: 3.14,
      pos: 2000,
    });
  
  
    scene.add(gunshop);
    gunshops.push(gunshop)
  
    const shopbox = new BoxText({
      width: 9,
      height: 4,
      depth: 7,
      opacity: 0,
      transparent:true,
      texture: brick,
      position: { x: 10, y: -0.5, z: z -5 },
    });
  
    scene.add(shopbox);
    gunshops.push(shopbox)
  
    const heal = new GLTFModel('./assets/heal.glb', {
      position: { x: -10, y: -0.3, z: z - 5 },
      scale: 1.8,
      rotate: 3.14,
      pos: 999,
    });
  
    scene.add(heal);
    heals.push(heal)}

    if (loot == 4){

      const knife = new GLTFModel('./assets/knife.glb', {
        position: { x: 0, y: -0.3, z: z },
        scale: 2.5,
        rotate: 3.14,
        pos: 999,
      });
    
      scene.add(knife);
      knifeshops.push(knife)
  
  
  
    }
    if (loot == 5){

      const well = new GLTFModel('./assets/well.glb', {
        position: { x: 0, y: -0.3, z: z },
        scale: 2.5,
        rotate: 3.14,
        pos: 999,
      });
    
      scene.add(well);
      wells.push(well)
  
  
  
    }

}

function spawnroom({ distance, type }) {


  const roomground = new BoxText({ width: 30, height: 0.5, depth: 30, texture: brick, position: { x: 0, y: -1, z: distance } })
  roomground.receiveShadow = true
  scene.add(roomground)

  const groundhall = new BoxText({ width: 10, height: 0.5, depth: 20, texture: brick, position: { x: 0, y: -1, z: distance - 25 } })
  groundmain.receiveShadow = true

  scene.add(groundhall)

  const wallroom = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: -8.1, y: 0, z: distance - 15.5 } })
  wallroom.receiveShadow = true

  scene.add(wallroom)
  walls.push(wallroom)

  const wallroomback = new BoxText({ width: 14.8, height: 8, depth: 0.5, transparent: true, opacity: 0, texture: brick, walltype: "back", position: { x: -8.1, y: 0, z: distance - 15.9 } })
  wallroomback.receiveShadow = true

  scene.add(wallroomback)
  walls.push(wallroomback)

  const wallroomA = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: 8.1, y: 0, z: distance - 15.5 } })
  wallroomA.receiveShadow = true

  scene.add(wallroomA)
  walls.push(wallroomA)

  const wallroomB = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: -8.1, y: 0, z: distance + 15.5 } })
  wallroomB.receiveShadow = true

  scene.add(wallroomB)
  walls.push(wallroomB)

  const wallroomC = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: 8.1, y: 0, z: distance + 15.5 } })
  wallroomC.receiveShadow = true

  scene.add(wallroomC)
  walls.push(wallroomC)

  const wallroomCback = new BoxText({ width: 14.8, height: 8, depth: 0.5, texture: brick, transparent: true, opacity: 0, walltype: "back", position: { x: 8.1, y: 0, z: distance + 15.1 } })
  wallroomCback.receiveShadow = true

  scene.add(wallroomCback)
  walls.push(wallroomCback)

  const wallroomAC = new BoxText({ width: 1.5, height: 2.5, depth: 1, texture: bricksmall, walltype: "front", position: { x: 0, y: 2.75, z: distance + 15.5 } })
  wallroomAC.receiveShadow = true

  scene.add(wallroomAC)
  walls.push(wallroomAC)

  const wallC = new BoxText({ width: 1.5, height: 2.5, depth: 1, texture: bricksmall, walltype: "front", position: { x: 0, y: 2.75, z: distance - 15.5 } })
  wallC.receiveShadow = true

  scene.add(wallC)
  walls.push(wallC)

  const wall1 = new BoxText({ width: 1, height: 8, depth: 30, texture: brick, walltype: "left", position: { x: -15, y: 0, z: distance + 0 } })
  wall1.receiveShadow = true

  scene.add(wall1)
  walls.push(wall1)

  const wall2 = new BoxText({ width: 1, height: 8, depth: 30, texture: brick, walltype: "right", position: { x: 15, y: 0, z: distance + 0 } })
  wall2.receiveShadow = true

  scene.add(wall2)
  walls.push(wall2)

  const wallhallA = new BoxText({ width: 1, height: 8, depth: groundhall.depth - 1, texture: brick, walltype: "left", position: { x: -5, y: 0, z: distance - 25.5 } })
  wallhallA.receiveShadow = true
  scene.add(wallhallA)
  walls.push(wallhallA)

  const wallhallB = new BoxText({ width: 1, height: 8, depth: groundhall.depth - 1, texture: brick, walltype: "right", position: { x: 5, y: 0, z: distance - 25.5 } })
  wallhallB.receiveShadow = true
  scene.add(wallhallB)
  walls.push(wallhallB)

  const door = new GLTFModel('./assets/door.glb', {
    position: { x: 0, y: -0.3, z: distance - 15 },
    scale: 2,
    rotate: 3.14,
    pos: 1,
    pos2:-999,


  });

  scene.add(door);
  doors.push(door)

  const modelParent = new THREE.Group();

  modelParent.add(door);

  door.position.y = door.height / 2;
  modelParent.position.z = distance - 14.9

  scene.add(modelParent);

  const halldoor = new GLTFModel('./assets/door.glb', {
    position: { x: 0, y: -0.3, z: distance - 34.5 },
    scale: 2,
    rotate: 3.14,
    pos: 1,
    pos2:-999,

  });

  scene.add(halldoor);
  doors.push(halldoor);

  const modelhallParent = new THREE.Group();

  modelhallParent.add(halldoor);

  halldoor.position.y = halldoor.height / 2;
  modelhallParent.position.z = distance - 33.9

  scene.add(modelhallParent);

  if (type == 1) {

    spawnobstacles({ x: 0, z: distance });

  }
  if (type == 2) {
    spawnloot(distance)
  }

}

function spawnbossroom({ distance, type }) {


  const roomground = new BoxText({ width: 45, height: 0.5, depth: 45, texture: brick, position: { x: 0, y: -1, z: distance - 7 } })
  roomground.receiveShadow = true
  scene.add(roomground)

  const wallroom = new BoxText({ width: 21.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: -11.6, y: 0, z: distance - 29.5 } })
  wallroom.receiveShadow = true

  scene.add(wallroom)
  walls.push(wallroom)

  const wallroomback = new BoxText({ width: 14.8, height: 8, depth: 0.5, transparent: true, opacity: 0, texture: brick, walltype: "back", position: { x: -8.1, y: 0, z: distance - 29.9 } })
  wallroomback.receiveShadow = true

  scene.add(wallroomback)
  walls.push(wallroomback)

  const wallroomA = new BoxText({ width: 21.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: 11.6, y: 0, z: distance - 29.5 } })
  wallroomA.receiveShadow = true

  scene.add(wallroomA)
  walls.push(wallroomA)

  const wallroomB = new BoxText({ width: 21.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: -11.6, y: 0, z: distance + 15.5 } })
  wallroomB.receiveShadow = true

  scene.add(wallroomB)
  walls.push(wallroomB)

  const wallroomC = new BoxText({ width: 21.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: 11.6, y: 0, z: distance + 15.5 } })
  wallroomC.receiveShadow = true

  scene.add(wallroomC)
  walls.push(wallroomC)

  const wallroomCback = new BoxText({ width: 14.8, height: 8, depth: 0.5, texture: brick, transparent: true, opacity: 0, walltype: "back", position: { x: 8.1, y: 0, z: distance + 15.1 } })
  wallroomCback.receiveShadow = true

  scene.add(wallroomCback)
  walls.push(wallroomCback)

  const wallroomAC = new BoxText({ width: 1.5, height: 2.5, depth: 1, texture: bricksmall, walltype: "front", position: { x: 0, y: 2.75, z: distance + 15.5 } })
  wallroomAC.receiveShadow = true

  scene.add(wallroomAC)
  walls.push(wallroomAC)

  const wallC = new BoxText({ width: 1.5, height: 2.5, depth: 1, texture: bricksmall, walltype: "front", position: { x: 0, y: 2.75, z: distance - 29.5 } })
  wallC.receiveShadow = true

  scene.add(wallC)
  walls.push(wallC)

  const wall1 = new BoxText({ width: 1, height: 8, depth: 46, texture: brick, walltype: "left", position: { x: -23, y: 0, z: distance -7 } })
  wall1.receiveShadow = true

  scene.add(wall1)
  walls.push(wall1)

  const wall2 = new BoxText({ width: 1, height: 8, depth: 46, texture: brick, walltype: "right", position: { x: 23, y: 0, z: distance -7 } })
  wall2.receiveShadow = true

  scene.add(wall2)
  walls.push(wall2)


  const door = new GLTFModel('./assets/door.glb', {
    position: { x: 0, y: -0.3, z: distance - 30 },
    scale: 2,
    rotate: 3.14,
    pos: 1,
    pos2:-999,


  });

  scene.add(door);
  doors.push(door)

  const modelParent = new THREE.Group();

  modelParent.add(door);

  door.position.y = door.height / 2;
  modelParent.position.z = distance - 28.9

  scene.add(modelParent);
  

}

let canShoot = true;
const bullets = []

function enemyshoot(renemies) {
  if (!canShoot) {
    return
  }

  renemies.forEach((enemy) => {
    const direction = new THREE.Vector3();
    direction.subVectors(cube.position, enemy.position).normalize();
    if (enemy.alive == true) {
      const enemybullet = new Box({
        width: rangeinfo.size,
        height: rangeinfo.size,
        depth: rangeinfo.size,
        color: rangeinfo.bullet,
        position: {
          x: enemy.position.x,
          y: enemy.position.y + 0.5,
          z: enemy.position.z,
        },
        velocity: {
          x: direction.x * rangeinfo.speed,
          y: 0,
          z: direction.z * rangeinfo.speed,
        },
        z: true,
        isEnemyBullet: true,

      });

      scene.add(enemybullet);
      bullets.push(enemybullet);
    }
  });


  canShoot = false;
  setTimeout(() => {
    canShoot = true;
  }, 2000);

}

function updateBullet(bullet) {
  bullet.updateSides();


  bullet.position.x += bullet.velocity.x;
  bullet.position.y += bullet.velocity.y;
  bullet.position.z += bullet.velocity.z;

}


const chest = new GLTFModel('./assets/chest.glb', {
  position: { x: 0, y: -0.3, z: 0 },
  scale: 2.5,
  rotate: 3.14,
  starter:true,
})

scene.add(chest);
chests.push(chest)



const warrior = new GLTFModel(warriormodel, {
  position: { x: 3, y: -0.3, z: 2 },
  scale: 1.5,
  loop:true,
});

scene.add(warrior);
window.Character = function(model){
  warriormodel = model
  document.getElementById("select").style.display = "none";
  warrior.map = warriormodel;
  ground.update(warrior)
  localStorage.setItem("warriormodel", warriormodel);
  window.location.reload();

}

let pets = []


const Shotgunx = new GLTFModel('./assets/guns/Shotgun.glb', {
  position: { x: 3, y: 0.4, z: 99 },
  scale: 0.02,
  pos: 140,
});

scene.add(Shotgunx);

const Machinegunx = new GLTFModel('./assets/guns/Machinegun.glb', {
  position: { x: 5, y: 0.4, z: 99 },
  scale: 0.02,
  pos: 999,
});

scene.add(Machinegunx);

const Dualx = new GLTFModel('./assets/guns/Duualx.glb', {
  position: { x: 7, y: 0.4, z: 99 },
  scale: 1.2,
  pos: 9999,

});

scene.add(Dualx);


const Handgunx = new GLTFModel('./assets/guns/Handgun.glb', {
  position: { x: 9, y: 0.4, z: 99 },
  scale: 0.02,
  pos: 200,

});

scene.add(Handgunx);

const Grenadex = new GLTFModel('./assets/grenade.glb', {
  position: { x: 12, y: 0.4, z: 99 },
  pos: 999,
  scale: 0.2,
});

scene.add(Grenadex);

const door = new GLTFModel('./assets/door.glb', {
  position: { x: 0, y: -0.3, z: -15.1 },
  scale: 2,
  rotate: 3.14,
});

scene.add(door);

const halldoor = new GLTFModel('./assets/door.glb', {
  position: { x: 0, y: -0.3, z: -34.5 },
  scale: 2,
  rotate: 3.14,
});

scene.add(halldoor);
doors.push(halldoor);
if(localStorage.getItem("cubez") && localStorage.getItem("cubez") < 3){
  cubez = parseInt(localStorage.getItem("cubez"));
  length = parseInt(localStorage.getItem("length"));
}

const cube = new Box({ width: 1, height: 1.5, depth: 1, color: 0xff5733, transparent:true, opacity:0, velocity: { x: 0, y: 0.01, z: 0 }, position: { x: 0, y: 1, z: cubez } })
scene.add(cube)


const petcrab = new GLTFModel('./assets/crabpet.glb', {
  position: { x: warrior.position.x, y: -0.3, z: crabz },
  velocity: { x: 0, y: 0, z: 0 },
  scale: 0.7,
  pos: 1,
});

pets.push(petcrab)
scene.add(petcrab);

const followSpeed = 0.05;

function updatePetCrabPosition() {
  pets.forEach((pet) =>{
  const direction = new THREE.Vector3().copy(cube.position).sub(pet.position);
  const distance = direction.length();
  direction.normalize();
  if (distance > 2) {
    pet.position.addScaledVector(direction, followSpeed);
  }
  if (distance > 10) {
    pet.position.addScaledVector(direction, 5);
  }
  pet.lookAt(cube.position);})
}


const ground = new Box({ width: 999, height: 0.5, depth: 999, transparent: true, opacity: 0.0, position: { x: 0, y: -1, z: 0 } })
ground.receiveShadow = true

scene.add(ground)

const groundmain = new BoxText({ width: 30, height: 0.5, depth: 30, texture: brick, position: { x: 0, y: -1, z: 0 } })
groundmain.receiveShadow = true

scene.add(groundmain)

const groundhall = new BoxText({ width: 10, height: 0.5, depth: 20, texture: brick, position: { x: 0, y: -1, z: groundmain.z - 25 } })
groundmain.receiveShadow = true

scene.add(groundhall)

const walls = []

const wallA = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: -8.1, y: 0, z: -15.5 } })
wallA.receiveShadow = true

scene.add(wallA)
walls.push(wallA)
const wallAback = new BoxText({ width: 14.8, height: 8, depth: 0.5, transparent: true, opacity: 0, texture: brick, walltype: "back", position: { x: -8.1, y: 0, z: -15.9 } })
wallAback.receiveShadow = true

scene.add(wallAback)
walls.push(wallAback)

const wallB = new BoxText({ width: 14.8, height: 8, depth: 1, texture: brick, walltype: "front", position: { x: 8.1, y: 0, z: -15.5 } })
wallB.receiveShadow = true

scene.add(wallB)
walls.push(wallB)
wallB.updateMatrix()
const wallC = new BoxText({ width: 1.5, height: 2.5, depth: 1, texture: bricksmall, walltype: "front", position: { x: 0, y: 2.75, z: -15.5 } })
wallC.receiveShadow = true

scene.add(wallC)
walls.push(wallC)
wallC.updateMatrix()


const wall0 = new BoxText({ width: 31, height: 8, depth: 1, texture: brick, walltype: "back", position: { x: 0, y: 0, z: 15 } })
wall0.receiveShadow = true

scene.add(wall0)
walls.push(wall0)

const wall1 = new BoxText({ width: 1, height: 8, depth: 30, texture: brick, walltype: "left", position: { x: -15, y: 0, z: 0 } })
wall1.receiveShadow = true

scene.add(wall1)
walls.push(wall1)

const wall2 = new BoxText({ width: 1, height: 8, depth: 30, texture: brick, walltype: "right", position: { x: 15, y: 0, z: 0 } })
wall2.receiveShadow = true

scene.add(wall2)
walls.push(wall2)

const wallhallA = new BoxText({ width: 1, height: 8, depth: groundhall.depth - 1, texture: brick, walltype: "left", position: { x: -5, y: 0, z: -25.5 } })
wallhallA.receiveShadow = true
scene.add(wallhallA)
walls.push(wallhallA)

const wallhallB = new BoxText({ width: 1, height: 8, depth: groundhall.depth - 1, texture: brick, walltype: "right", position: { x: 5, y: 0, z: -25.5 } })
wallhallB.receiveShadow = true
scene.add(wallhallB)
walls.push(wallhallB)

const Light = new THREE.DirectionalLight(0xffffff, 1);
Light.position.set(0, 2, 1).normalize();
Light.castShadow = true
scene.add(Light);

var ambientLight = new THREE.AmbientLight(0xa0a0a0); 
scene.add(ambientLight);

camera.position.z = 5

const keys = {

  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  },
  shift: {
    pressed: false
  },

}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
    case 'ShiftLeft':
      keys.shift.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
    case 'ShiftLeft':
      keys.shift.pressed = false
      break
  }
})


window.addEventListener('keypress', (event) => {
  if (event.keyCode == 32) {
    cube.velocity.y = 0.08
  }

})

let isbullet = 0
let bullet;

function updateBullets() {
  const bulletsDiv = document.getElementById("bullets");
  bulletsDiv.innerHTML = ""; 

  for (let i = 0; i < bulletscount; i++) {
    const bulletDiv = document.createElement("div");
    bulletDiv.id = "bullet";
    bulletsDiv.appendChild(bulletDiv);
  }
}

let canShootRegular = true;
let canShootFourth = true;
let shotsFired = 0;
let bulletscount = 4


let currentIndex = 0;


document.addEventListener('keydown', function(event) {

    if (event.key === ';' && guns.length>1) {
        currentIndex = (currentIndex + 1) % guns.length;
        selectedGun = guns[currentIndex];
    }});

class Dual {
  constructor() {
    this.bulletSpeed = 0.07;
    this.shootInterval = 300;
    this.bulletColor = 0xff0000;
    this.bulletSize = 0.2;
    this.name = "Dual";
  }
}

class Handgun {
  constructor() {
    this.bulletSpeed = 0.07;
    this.shootInterval = 300;
    this.bulletColor = 0xff0000;
    this.bulletSize = 0.2;
    this.name = "Handgun";
  }
}

class Shotgun {
  constructor() {
    this.bulletSpeed = 0.05;
    this.shootInterval = 500;
    this.bulletColor = 0x00ff00;
    this.bulletSize = 0.3;
    this.name = "Shotgun";
  }
}

class Grenade {
  constructor() {
    this.bulletSpeed = 0.05;
    this.shootInterval = 500;
    this.bulletColor = 0x00ff00;
    this.bulletSize = 0.3;
    this.name = "Grenade";
  }
}

class MachineGun {
  constructor() {
    this.bulletSpeed = 0.1;
    this.shootInterval = 100;
    this.bulletColor = 0x0000ff;
    this.bulletSize = 0.15;
    this.name = "Machinegun";
  }
}
class None{
  constructor(){
    this.name = "None";
  }
}

let selectedGun = new None ();
let potions = [];

if (localStorage.getItem("boss") >= 1 || localStorage.getItem("cubez") && localStorage.getItem("cubez") < 3){
  hp = parseInt(localStorage.getItem("hp"));
  shield = parseInt(localStorage.getItem("shield"));
  money = parseInt(localStorage.getItem("money"));
  norm = parseFloat(localStorage.getItem("norm"));
  crabz = parseInt(localStorage.getItem("crabz"));
  crabvisible = localStorage.getItem("crabvisible");
  doubleshoot = localStorage.getItem("doubleshoot");
  bigshoot = parseFloat(localStorage.getItem("bigshoot"));
  slow = parseFloat(localStorage.getItem("slow"));
  const gunsJSON = localStorage.getItem('guns');
  guns = JSON.parse(gunsJSON)
  const selectedGunJSON = localStorage.getItem('selectedGun');
  selectedGun = JSON.parse(selectedGunJSON);
  const potionsJSON = localStorage.getItem('potions');
  potions = JSON.parse(potionsJSON);
  cubez = parseInt(localStorage.getItem("cubez"));
}
document.getElementById("money").innerHTML = money;

if(crabvisible === false || crabvisible === 'false' ){
petcrab.visible = false; 
} else{
  console.log(crabvisible + "xd")
  console.log("smiech")
  petcrab.visible = true; 
}
if(selectedGun.name == "None"){
  bulletscount = 0;
}

function holdgun(){

  if(selectedGun.name == "Machinegun"){
    Dualx.position.x = 999
    Grenadex.position.x = 999
    Handgunx.position.x = 999
    Shotgunx.position.x = 999
    Machinegunx.position.x = warrior.position.x+0.3
    Machinegunx.position.z = warrior.position.z
    Machinegunx.position.y = warrior.position.y+0.5
    Machinegunx.rotation.y = warrior.rotation.y - 3.14
    bulletscount = 0

  }

  if(selectedGun.name == "Shotgun"){
    Dualx.position.x = 999
    Grenadex.position.x = 999
    Handgunx.position.x = 999
    Machinegunx.position.x = 999
    Shotgunx.position.x = warrior.position.x+0.2
    Shotgunx.position.z = warrior.position.z
    Shotgunx.position.y = warrior.position.y+0.5
    Shotgunx.rotation.y = warrior.rotation.y - 3.14

  }

  if(selectedGun.name == "Handgun"){
    Dualx.position.x = 999
    Grenadex.position.x = 999
    Machinegunx.position.x = 999
    Shotgunx.position.x = 999
    Handgunx.position.x = warrior.position.x+0.1
    Handgunx.position.z = warrior.position.z
    Handgunx.position.y = warrior.position.y+0.7
    Handgunx.rotation.y = warrior.rotation.y - 3.14

  }

  if(selectedGun.name == "Grenade"){
    Dualx.position.x = 999
    Handgunx.position.x = 999
    Machinegunx.position.x = 999
    Shotgunx.position.x = 999
    Grenadex.position.x = warrior.position.x
    Grenadex.position.z = warrior.position.z
    Grenadex.position.y = warrior.position.y
    Grenadex.rotation.y = warrior.rotation.y

  }

  if(selectedGun.name == "Dual"){
    Grenadex.position.x = 999
    Handgunx.position.x = 999
    Machinegunx.position.x = 999
    Shotgunx.position.x = 999
    Dualx.position.x = cube.position.x
    Dualx.position.z = cube.position.z
    Dualx.position.y = cube.position.y
    Dualx.rotation.y = warrior.rotation.y - 3.14

  }
}

let warriorbullets = []
let bulletCount = 0;
document.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    if (dni == false && selectedGun.name != "None" ) {
      if (shotsFired < 4 && canShootRegular) {
        canShootRegular = false;
        
        if(selectedGun.name != "Machinegun"){
          bulletscount -= 1;
        }

        const positions2 = [cube.left, cube.right];
        const positions = [cube.front, cube.back];

        let x=cube.position.x+0.3
        let z=cube.position.z

        if(selectedGun.name == "Dual"){
          x=positions2[bulletCount % 2]
          z=positions[bulletCount % 2]
        }

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
          const target = intersects[0].point;
          const direction = new THREE.Vector3();
          direction.subVectors(target, cube.position).normalize();
          const bullet = new Box({
            width: selectedGun.bulletSize + bigshoot,
            height: selectedGun.bulletSize + bigshoot,
            depth: selectedGun.bulletSize + bigshoot,
            color: selectedGun.bulletColor,
            position: {
              x,
              y: cube.position.y+0.2,
              z,
            },
            velocity: {
              x: direction.x * selectedGun.bulletSpeed,
              y: 0,
              z: direction.z * selectedGun.bulletSpeed,
            },
            z: true,
            isEnemyBullet : false,
            test:2,
          });
          warriorbullets.push(bullet)
          scene.add(bullet);

          if(doubleshoot === true || doubleshoot === 'true'){

          const bullet2 = new Box({
            width: selectedGun.bulletSize,
            height: selectedGun.bulletSize,
            depth: selectedGun.bulletSize,
            color: selectedGun.bulletColor,
            position: {
              x: warrior.position.x+0.5,
              y: warrior.position.y,
              z: warrior.position.z+0.5,
            },
            velocity: {
              x: direction.x * selectedGun.bulletSpeed,
              y: 0,
              z: direction.z * selectedGun.bulletSpeed,
            },
            z: true,
            test:2
          });
        
          scene.add(bullet2);
          warriorbullets.push(bullet2)
        }



          bulletCount++; 
        

        
          if(selectedGun.name == "Shotgun"){

            const bullet = new Box({
              width: selectedGun.bulletSize,
              height: selectedGun.bulletSize,
              depth: selectedGun.bulletSize,
              color: selectedGun.bulletColor,
              position: {
                x: warrior.position.x+1,
                y: warrior.position.y+0.5,
                z: warrior.position.z+1,
              },
              velocity: {
                x: direction.x * selectedGun.bulletSpeed,
                y: 0,
                z: direction.z * selectedGun.bulletSpeed,
              },
              z: true,
              test:2
            });

            scene.add(bullet);
            warriorbullets.push(bullet)
            if(doubleshoot === true || doubleshoot === 'true'){

              const bullet3 = new Box({
                width: selectedGun.bulletSize,
                height: selectedGun.bulletSize,
                depth: selectedGun.bulletSize,
                color: selectedGun.bulletColor,
                position: {
                  x: warrior.position.x,
                  y: warrior.position.y,
                  z: warrior.position.z,
                },
                velocity: {
                  x: direction.x * selectedGun.bulletSpeed,
                  y: 0,
                  z: direction.z * selectedGun.bulletSpeed,
                },
                z: true,
                test:2
              });
            
              scene.add(bullet3);
              warriorbullets.push(bullet3)
            }
          }
        
          if(selectedGun.name == "Machinegun"){
            if (bullet.velocity.x > 0.069) {
              warrior.rotation.y = -1.5;
            } else if (bullet.velocity.x < -0.069) {

              warrior.rotation.y = 1.5;
            }

            if (bullet.velocity.z > 0 && bullet.velocity.x < 0.069 && bullet.velocity.x > -0.069) {
              warrior.rotation.y = 3;
            } else if (bullet.velocity.z < 0 && bullet.velocity.x < 0.069 && bullet.velocity.x > -0.069) {
              warrior.rotation.y = 0;
            }
          }
          if(selectedGun.name == "Shotgun" || selectedGun.name == "Handgun" || selectedGun.name == "Grenade" || selectedGun.name == "Dual"  ){
            if (bullet.velocity.x > 0.045) {
              warrior.rotation.y = -1.5;
            } else if (bullet.velocity.x < -0.045) {

              warrior.rotation.y = 1.5;
            }

            if (bullet.velocity.z > 0 && bullet.velocity.x < 0.045 && bullet.velocity.x > -0.045) {
              warrior.rotation.y = 3;
            } else if (bullet.velocity.z < 0 && bullet.velocity.x < 0.045 && bullet.velocity.x > -0.045) {
              warrior.rotation.y = 0;
            }
          }

          if(selectedGun.name == "Grenade"){
            setTimeout(() => {

              scene.remove(bullet);
          
              const explosionGeometry = new THREE.SphereGeometry(5, 82, 82);
              const explosionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
              const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
              explosion.position.copy(bullet.position);
              scene.add(explosion);
          
              const particleGeometry = new THREE.SphereGeometry(3, 32, 32);
              const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
          
              let particles = [];
              for(let i = 0; i < 100; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(bullet.position);
                scene.add(particle);
          
                particle.position.x += Math.random() - 0.5;
                particle.position.y += Math.random() - 0.5;
                particle.position.z += Math.random() - 0.5;
          
                particles.push(particle);
              }
              
              allenemies.forEach((enemy, index) => {
                if (explosion.position.distanceTo(enemy.position)<4.7) {
                  

                    enemy.hp = enemy.hp - 2;
      
                    if (enemy.hp <= 0) {
                      enemiescount -= 1
                      enemy.alive = false
                      money += 1
                      document.getElementById("money").innerHTML = money;
                      scene.remove(enemy);
                      modelenemies.splice(index, 1);
                      enemies.splice(index, 1);
                    }
               
                }
      
              });

              setTimeout(() => {
                scene.remove(explosion);
                particles.forEach(particle => scene.remove(particle));
              }, 1600);
            }, 1600);
          }
          
          
        }

        setTimeout(() => {
          canShootRegular = true;
        }, selectedGun.shootInterval);
        if(selectedGun.name != "Machinegun"){
          shotsFired++;
        }
      } else if (shotsFired === 4 && canShootFourth) {
        canShootFourth = false;

        setTimeout(() => {
          canShootFourth = true;
          shotsFired = 0;
          bulletscount = 4;
        }, 3000);
      }
    }
  }
});

document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


window.addEventListener('keydown', (event) => {
  if (keys.shift.pressed) {
    defualtvel = 0.03 + norm
  } else {
    defualtvel = 0.01 + norm
  }

})

function zaxis(box) {

  const zCollision = cube.front >= box.back && cube.back <= box.front;

  return zCollision

}

function xaxis(box) {

  const xCollision = cube.right >= box.left && cube.left <= box.right;

  return xCollision
}

function yaxis(box) {

  const yCollision = cube.bottom <= box.top && cube.top >= box.bottom;

  return yCollision
}

let dni = false

let language = 'english';

 window.Lang = function(lang) {
      let language = lang
  
      if (language === 'slovak') {
          language = 'slovak';
          localStorage.setItem("lang", 'slovak');

          document.getElementById("newgame").innerHTML = "Nova Hra"
          document.getElementById("loadgame").innerHTML = "Nacitaj ulozenu hru";
          document.getElementById("selectchar").innerHTML = "vyber si postavu";
          document.getElementById("keybindsimg").src = 'assets/keybindssk.png';
          document.getElementById("k1").innerHTML = "Dvojite Naboje"
          document.getElementById("k2").innerHTML = "Velke Naboje"
          document.getElementById("k3").innerHTML = "RYCHLOST"
          document.getElementById("k4").innerHTML = "Pomaly Nepriatelia"
          document.getElementById("k5").innerHTML = "Kamarat Krab"
          document.getElementById("p2a").innerHTML = "+ rychlost"
          document.getElementById("p3a").innerHTML = "+ nezacielenie (5s)"
          document.getElementById("again").innerHTML = "hrat odznova ?"
      } else {
          language = 'english';
          localStorage.setItem("lang", 'english');

          document.getElementById("newgame").innerHTML = "new game"
          document.getElementById("loadgame").innerHTML = "load game";
          document.getElementById("selectchar").innerHTML = "select your character";
          document.getElementById("keybindsimg").src = 'assets/keybinds.png';
          document.getElementById("k1").innerHTML = "Double the Bullets"
          document.getElementById("k2").innerHTML = "Bigger Bullets"
          document.getElementById("k3").innerHTML = "SPEEED!"
          document.getElementById("k4").innerHTML = "Slow Enemies"
          document.getElementById("k5").innerHTML = "Crab Companion"
          document.getElementById("p2a").innerHTML = "+ speed"
          document.getElementById("p3a").innerHTML = "+ untargetability (5s)"
          document.getElementById("again").innerHTML = "play again ?"

      }
  }

  if(localStorage.getItem("lang") === 'slovak'){

    document.getElementById("newgame").innerHTML = "Nova Hra"
    document.getElementById("loadgame").innerHTML = "Nacitaj ulozenu hru";
    document.getElementById("selectchar").innerHTML = "vyber si postavu";
    document.getElementById("keybindsimg").src = 'assets/keybindssk.png';
    document.getElementById("k1").innerHTML = "Dvojite Naboje"
    document.getElementById("k2").innerHTML = "Velke Naboje"
    document.getElementById("k3").innerHTML = "RYCHLOST"
    document.getElementById("k4").innerHTML = "Pomaly Nepriatelia"
    document.getElementById("k5").innerHTML = "Kamarat Krab"
    document.getElementById("p2a").innerHTML = "+ rychlost"
    document.getElementById("p3a").innerHTML = "+ nezacielenie (5s)"
    document.getElementById("again").innerHTML = "hrat odznova ?"
  }else{

    document.getElementById("newgame").innerHTML = "new game"
    document.getElementById("loadgame").innerHTML = "load game";
    document.getElementById("selectchar").innerHTML = "select your character";
    document.getElementById("keybindsimg").src = 'assets/keybinds.png';
    document.getElementById("k1").innerHTML = "Double the Bullets"
    document.getElementById("k2").innerHTML = "Bigger Bullets"
    document.getElementById("k3").innerHTML = "SPEEED!"
    document.getElementById("k4").innerHTML = "Slow Enemies"
    document.getElementById("k5").innerHTML = "Crab Companion"
    document.getElementById("p2a").innerHTML = "+ speed"
    document.getElementById("p3a").innerHTML = "+ untargetability (5s)"
    document.getElementById("again").innerHTML = "play again ?"
  }


window.Keybinds = function(){
  if(localStorage.getItem("lang") === 'slovak'){
    document.getElementById("keybindsimg").src = 'assets/keybindssk.png';
  }else{
    document.getElementById("keybindsimg").src = 'assets/keybinds.png';
  }
  document.getElementById("keybinds").style.display = "flex";
  
}

window.HideKeybinds = function(){
  document.getElementById("keybinds").style.display = "none";
}


window.Settings = function(){
  document.getElementById("options").style.display = "flex";
  dni = true
}

window.CloseSettings = function(){
  document.getElementById("options").style.display = "none";
  dni = false
}

window.NewGame = function() {
  console.log("xdd")
  localStorage.setItem("screen", 1);

if (localStorage.getItem("boss")) {
  localStorage.removeItem("boss");
}

if (localStorage.getItem("hp")) {
  localStorage.removeItem("hp");
}

if (localStorage.getItem("shield")) {
  localStorage.removeItem("shield");
}

if (localStorage.getItem("norm")) {
  localStorage.removeItem("norm");
}

if (localStorage.getItem("money")) {
  localStorage.removeItem("money");
}

if (localStorage.getItem("guns")) {
  localStorage.removeItem("guns");
}

if (localStorage.getItem("selectedGun")) {
  localStorage.removeItem("selectedGun");
}

if (localStorage.getItem("potions")) {
  localStorage.removeItem("potions");
}
if (localStorage.getItem("cubez")) {
  localStorage.removeItem("cubez");
}
if (localStorage.getItem("length")) {
  localStorage.removeItem("length");
}
if (localStorage.getItem("warriormodel")) {
  localStorage.removeItem("warriormodel");
}
if (localStorage.getItem("slow")) {
  localStorage.removeItem("slow");
}
if (localStorage.getItem("bigshoot")) {
  localStorage.removeItem("bigshoot");
}
if (localStorage.getItem("doubleshoot")) {
  localStorage.removeItem("doubleshoot");
}
if (localStorage.getItem("crabz")) {
  localStorage.removeItem("crabz");
}
if (localStorage.getItem("crabvisible")) {
  localStorage.removeItem("crabvisible");
}
location.reload(true);

}

window.LoadGame = function() {
  if(localStorage.getItem('warriormodel') !== null){
  localStorage.setItem("screen", 1);
  location.reload(true);}
  else{
    alert("No saves avalible")
  }
}

window.Close = function(id) {
  canShoot = true;
  document.getElementById(id).style.display = "none";
  cube.position.z = cube.position.z + 4
  cube.position.x = cube.position.x - 2
  dni = false
}



window.Buy = function(color) {
  canShoot = false;
  console.log("xd")
  let moneyneeded = 0
  if(color == "green" || color == "yellow" || color == "orange"){
    moneyneeded = 4
  } if(color == "brown"){
    moneyneeded = 2
  }
  if(color == "green" || color == "yellow" || color == "orange" || color == "brown" ){
    if(potions.length < 4 && money >= moneyneeded){
    potions.push(color)
    money = money - moneyneeded
    document.getElementById("money").innerHTML = money;
    hasPotionsBeenAdded = false
  }}
  if(color == "shotgun" && money >= 6){
    selectedGun = new Shotgun ();
    guns.push(new Shotgun())
    money = money - 6
  }
  if(color == "machine" && money >= 14){
    selectedGun = new MachineGun ();
    guns.push(new MachineGun())
    money = money - 14
  }
  if(color == "dual" && money >= 6){
    selectedGun = new Dual ();
    guns.push(new Dual())
    money = money - 6
  }
  if(color == "grenade" && money >= 14){
    selectedGun = new Grenade ();
    guns.push(new Grenade())
    money = money - 14
  }
  if(color === "u1" && hp >= 4 && doubleshoot === 'false'){
    console.log("test")
    doubleshoot = true
    hp = hp - 4
    maxhp = maxhp - 4
  }else{
    console.log(color)
    console.log(hp)
    console.log(doubleshoot)
  }
  if(color == "u2" && hp >= 2 && bigshoot == 0){
    bigshoot = 0.25
    hp = hp - 2
    maxhp = maxhp - 2
  }
  if(color == "u3" && hp >= 2 && norm < 0.15){
    norm = norm + 0.15
    hp = hp - 2
    maxhp = maxhp - 2
  }
  if(color == "u4" && hp >= 4 && slow == 0){
    slow = 0.3
    hp = hp - 4
    maxhp = maxhp - 4
  }
  if(color == "u5" && hp >= 6 && crabvisible === false || crabvisible === 'false' && color == "u5" ){
    crabvisible = true
    petcrab.visible = true; 
    hp = hp - 6
    maxhp = maxhp - 6
    petcrab.update(ground)
    console.log('xd')
  }
  document.getElementById("money").innerHTML = money;
}

function addMoney(num){
  money = money + num
  document.getElementById("money").innerHTML = money;
  document.getElementById('lootimg').style.backgroundImage="url(/assets/coin.png)";
  document.getElementById("lootname").innerHTML = `${num} Coins`;
  if(localStorage.getItem("lang") === 'slovak'){
    document.getElementById("loottext").innerHTML = "Leskle veci, za ktore si mozete kupit pekne veci.";
  }else{
  document.getElementById("loottext").innerHTML = "Shiny things to buy pretty things with.";}
}

function Equip(color) {
  if(color == "green" || color == "yellow" || color == "orange" || color == "brown" ){
    if(potions.length < 4){
    potions.push(color)
    hasPotionsBeenAdded = false
    if(color == "green"){
      document.getElementById("lootname").innerHTML = `Life Potion`;
      if(localStorage.getItem("lang") === 'slovak'){
        document.getElementById("loottext").innerHTML = "Vam da +1 zivot.";
      }else{
      document.getElementById("loottext").innerHTML = "gives you +1 hp.";}
    }
    if(color == "yellow"){
      document.getElementById("lootname").innerHTML = `Kindlebrew`;
      if(localStorage.getItem("lang") === 'slovak'){
        document.getElementById("loottext").innerHTML = "Chcete sa citi rychlejsie ?";
      }else{
      document.getElementById("loottext").innerHTML = "Wanna feel faster ?";}
    }
    if(color == "orange"){
      document.getElementById("lootname").innerHTML = `Protectorian Elixir`;
      if(localStorage.getItem("lang") === 'slovak'){
        document.getElementById("loottext").innerHTML = "Vam da nezacielitelnost (5s).";
      }
      else{
      document.getElementById("loottext").innerHTML = "gives you untargetability (5s).";}
    }
  }}
  if(color == "shotgun"){
    selectedGun = new Shotgun ();
    document.getElementById("lootname").innerHTML = `Shotgun`;
    if(localStorage.getItem("lang") === 'slovak'){
      document.getElementById("loottext").innerHTML = "Vsetko je lepsie v pare dvoch.";
    }
    else{
    document.getElementById("loottext").innerHTML = "Everything's better in a pair of 2.";}
    guns.push(new Shotgun())
    bulletscount = 4

  }
  if(color == "machine"){
    selectedGun = new MachineGun ();
    document.getElementById("lootname").innerHTML = `MachineGun`;
    document.getElementById("loottext").innerHTML = "RATATATATAA.";
    guns.push(new MachineGun())
  }
  if(color == "dual"){
    selectedGun = new Dual ();
    document.getElementById("lootname").innerHTML = `Dual Berettas`;
    if(localStorage.getItem("lang") === 'slovak'){
      document.getElementById("loottext").innerHTML = "Lava Prava Lava Prava.";
    }
    else{
    document.getElementById("loottext").innerHTML = "Left Right Left Right.";}
    bulletscount = 4
    guns.push(new Dual())
  }
  if(color == "grenade"){
    selectedGun = new Grenade ();
    document.getElementById("lootname").innerHTML = `Grenade Launcher`;
    if(localStorage.getItem("lang") === 'slovak'){
      document.getElementById("loottext").innerHTML = "Velke vybuchy s velkymi nasledkami.";
    }
    else{
    document.getElementById("loottext").innerHTML = "Big explosions with big consenquences.";}
    bulletscount = 4
    guns.push(new Grenade())
  }
  document.getElementById('lootimg').style.backgroundImage=`url(/assets/${color}.png)`
}

function chestloot() {
  const functionsArray = [
    () => addMoney(2),
    () => addMoney(3),
    () => addMoney(4),
    () => addMoney(5),
    () => addMoney(6),
    () => addMoney(7),
    () => addMoney(10),
    () => addMoney(8),
    () => addMoney(4),
    () => addMoney(5),
    () => addMoney(6),
    () => addMoney(7),
    () => Equip('green'),
    () => Equip('green'),
    () => Equip('yellow'),
    () => Equip('yellow'),
    () => Equip('orange'),
    () => Equip('orange'),
    () => Equip('dual'),
    () => Equip('shotgun'),
    () => Equip('grenade'),
    () => Equip('machine'),
  ];

  const randomIndex = Math.floor(Math.random() * functionsArray.length);

  functionsArray[randomIndex]();
}

let defualtvel = 0.01
let frames = 0
let spawn = 200
let hasCollided = false;
let collidedWithAnyEnemy = false;
let hpDown = true

function handleBulletEnemyCollisions({ enemies, modelenemies }) {
  scene.children.forEach((object) => {
    if (object instanceof Box) {
      if(object.test == 2){
        enemies.forEach((enemy, index) => {

          if (object.position.distanceTo(enemy.position)<0.83 || enemy.boss > 0 && object.position.distanceTo(enemy.position)<4  ) {
            if (hpDown) {
              enemy.hp = enemy.hp - 1;

              if (enemy.hp <= 0) {

                enemiescount -= 1
                enemy.alive = false
                money += 1
                document.getElementById("money").innerHTML = money;
                scene.remove(enemy);
                modelenemies.splice(index, 1);
                enemies.splice(index, 1);
              }
              scene.remove(object);
              hpDown = false
              setTimeout(() => {
                hpDown = true;
              }, 200);
            }
          }

        });
      }
    }
  });
}


let random = Math.floor(Math.random() * 8);

let lasers = [];

setInterval(() => {
  enemies.forEach((enemy, index) => {
    if (enemy.boss === 1) {
      if (enemy.material.map === cubeboss ) {
        enemy.material.map = cubeboss2;
        const laser = new Box({
          width: 1,
          height: 7,
          depth: 40,
          transparent:true,
          opacity:0.5,
          color: 0xFF0000,
          position: { x:enemy.position.x, y: 0.5, z:enemy.position.z },
          velocity: { x: 0, y: 0, z: 0 },
          z: false,
          hp: 999,
          boss: 0,
          name: "laser",
        });
        scene.add(laser);
        lasers.push(laser);
        const laser2 = new Box({
          width: 40,
          height: 7,
          depth: 1,
          transparent:true,
          opacity:0.5,
          color: 0xFF0000,
          position: { x:enemy.position.x, y: 0.5, z:enemy.position.z },
          velocity: { x: 0, y: 0, z: 0 },
          z: false,
          hp: 999,
          boss: 0,
          name: "laser",
        });
        scene.add(laser2);
        lasers.push(laser2);
        
      } else {
        enemy.material.map = cubeboss;

      }
      enemy.material.needsUpdate = true;
      random = Math.floor(Math.random() * 8);
    }
    if(enemy.boss === 2){
      canShoot = true;

      
    }
    if(enemy.boss === 3){
      canShoot = true;

      
    }
  })
}, 2000);

let isShooting = false;

function bossmovement(){
let blue = ["f","b","l","r","1","2","3","4"]
  enemies.forEach((enemy,index) => {
    if (enemy.boss === 1) {
      if (!enemy.originalPosition && enemy.name != "laser") {
        enemy.originalPosition = enemy.position.clone();
      }

      if (enemy.material.map === cubeboss) {
        lasers.forEach((laser) =>{
          scene.remove(laser)
          const index = lasers.indexOf(laser);
          if (index > -1) {
            lasers.splice(index, 1);
          }
        })
        if(blue[random] == "r"){
          if(enemy.position.x <= 14 ){

          enemy.velocity.x = 0.05
          }
        }

        if(blue[random] == "l"){

          enemy.velocity.x = -0.05   
          }

          if(blue[random] == "f"){

            enemy.velocity.z = 0.05   
            }
          if(blue[random] == "b"){
  
            enemy.velocity.z = -0.05   
            }
          if(blue[random] == "2"){
            enemy.velocity.z = -0.04 
            enemy.velocity.x = 0.04 
          }
          if(blue[random] == "1"){
            enemy.velocity.z = -0.04 
            enemy.velocity.x = -0.04 
          }
          if(blue[random] == "3"){
            enemy.velocity.z = 0.04 
            enemy.velocity.x = -0.04 
          }
          if(blue[random] == "4"){
            enemy.velocity.z = 0.04 
            enemy.velocity.x = 0.04 
          }
        }
        if (enemy.material.map === cubeboss2 && enemy.name != "laser") {
          const direction = new THREE.Vector3();
          direction.subVectors(enemy.originalPosition, enemy.position).normalize();
  
          enemy.velocity.x = direction.x * 0.065;
          enemy.velocity.z = direction.z * 0.065;
  
          if (enemy.position.distanceTo(enemy.originalPosition) < 0.1) {
            enemy.velocity.z = 0
            enemy.velocity.x = 0
          }

        }

        lasers.forEach((laser) =>{
          follow({box1:laser,box2:enemy})
        })
      enemy.update(ground);
  }if(enemy.boss === 2){
    const direction = new THREE.Vector3();
    direction.subVectors(cube.position, enemy.position).normalize();

    if (enemy.alive == true && canShoot == true && !isShooting) {
      isShooting = true;
      let bulletCount = 0;
      let xPos = enemy.position.x - 6;
      let color = 0x000000
      
      const bulletInterval = setInterval(() => {
        
        let num = Math.floor(Math.random() * 5);
        if (num == 4){
          color = 0xfa0000
        }else{
          color = 0x000000
        }
        const enemybullet = new Box({
          width: 1,
          height: 1,
          depth: 1,
          color: color,
          position: {
            x: xPos,
            y: 0.7,
            z: enemy.position.z,
          },
          velocity: {
            x: direction.x * 0.08,
            y: 0,
            z: direction.z * 0.08,
          },
          z: true,
          isEnemyBullet: true,
        });
  
        scene.add(enemybullet);
        bullets.push(enemybullet);
  
        bulletCount++;
        xPos += 3;
        if (bulletCount >= 4) {
          clearInterval(bulletInterval);
          canShoot = false;
          xPos = enemy.position.x - 6;
          isShooting = false;
        }

        if (num === 4) {
          setTimeout(() => {
            
            scene.remove(enemybullet); 

          
              const explosionGeometry = new THREE.SphereGeometry(5, 82, 82);
              const explosionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
              const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
              explosion.position.copy(enemybullet.position);
              scene.add(explosion);
          
              const particleGeometry = new THREE.SphereGeometry(3, 32, 32);
              const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.6 });
          
              let particles = [];
              for(let i = 0; i < 100; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(enemybullet.position);
                scene.add(particle);
          
                particle.position.x += Math.random() - 0.5;
                particle.position.y += Math.random() - 0.5;
                particle.position.z += Math.random() - 0.5;
          
                particles.push(particle);
              }

              if(explosion.position.distanceTo(cube.position)<4.7){
                hpdown()
                hpdown()
              }
              
              setTimeout(() => {
                scene.remove(explosion);
                particles.forEach(particle => scene.remove(particle));
              }, 1600);


          }, 3300); 
        }

      }, 1000);
    }

    
    
  }
  
  
  
  
  

})

  
}
setInterval(function() {
  
if (boss == 2) {
  
    spawnpirates({ xax: 0, zax: cube.position.z - 10 });
  
}
if (boss == 3){
  shuffleMirrors();
  enemies.filter(enemy => enemy.name === "CloneMirror").forEach(cloneMirror => {
    if (cloneMirror.alive && canShoot && !isShooting) {
      isShooting = true;
  
      const bulletInterval = setInterval(() => {
        const direction = new THREE.Vector3();
        direction.subVectors(cube.position, cloneMirror.position).normalize();
  
        const color = 0xFFFFFF;
  
        const enemybullet = new Box({
          width: 0.6,
          height: 0.6,
          depth: 0.6,
          color: color,
          position: {
            x: cloneMirror.position.x,
            y: 0.7,
            z: cloneMirror.position.z,
          },
          velocity: {
            x: direction.x * 0.08,
            y: 0,
            z: direction.z * 0.08,
          },
          z: true,
          isEnemyBullet: true,
        });
  
        scene.add(enemybullet);
        bullets.push(enemybullet);
  
      }, 1000);
  
      setTimeout(() => {
        clearInterval(bulletInterval);
        isShooting = false;
      }, 5000); 
    }
  });
}}, 5000);





function removeAllObjects() {


    location.reload(true);

}

let bossnum = Math.floor(Math.random() * 2);



let hasPotionsBeenAdded = false;

function removeAllChildren() {
  for (let index = 0; index < 4; index++) {
    const fDiv = document.querySelector(`.f${index + 1}`);

    while (fDiv.firstChild) {
      fDiv.removeChild(fDiv.firstChild);
    }
  }
}

function addPotions() {
  if (!hasPotionsBeenAdded) {
    potions.forEach((potion, index) => {
      if (index < 4) {
        const fDiv = document.querySelector(`.f${index + 1}`);

        const existingDiv = fDiv.querySelector(`.${potion}`);
        if (!existingDiv) {

          const newDiv = document.createElement('div');
          newDiv.classList.add(potion);
          fDiv.appendChild(newDiv);
        }
      }
    });

    hasPotionsBeenAdded = true;
  }
}

document.addEventListener('keypress', function(e) {
  let keyNum = 0
  if(e.code == 'Digit1'){
    keyNum = 1
  }
  if(e.code == 'Digit2'){
    keyNum = 2
  }
  if(e.code == 'Digit3'){
    keyNum = 3
  }
  if(e.code == 'Digit4'){
    keyNum = 4  
  }

  if (keyNum >= 1 && keyNum <= 4) {

      DrinkPotion(potions[keyNum - 1])
      potions.splice(keyNum - 1, 1);
      
      removeAllChildren()
      hasPotionsBeenAdded = false
  }

});

let untarget = false

function DrinkPotion(color){
  if (color == "green"){
    hp += 1
  }
  if(color == "yellow"){
    norm += 0.01 //rýchlosť

  }
  if(color == "brown"){
    hp -=2
    shield += 5
    norm += 0.04 //rýchlosť
  }
  if(color == "orange"){
    untarget = true;
    cube.material.color.set(0x800080)  
    setTimeout(function() {
      untarget = false;
      cube.material.color.set(0xff5733) 
    }, 5000); 
  }
}

if(localStorage.getItem("screen") == 1){
  document.getElementById("screen").style.display = "none";
}





let roomspawned = false
let enemiescount = 0
const enemiesElement = document.getElementById("enemies");


function animate() {
  updatePetCrabPosition()
  TWEEN.update();
  holdgun()
  health();
  addPotions();
  follow({box1:warrior,box2:cube})
  bossmovement();
  warrior.position.y = cube.position.y
  

  if (!roomspawned) {
    roomspawned = true
    spawnroom({ distance: -50, type: 1 })
    spawnroom({ distance: -100, type: 2 })
    spawnroom({ distance: -150, type: 1 })
    spawnroom({ distance: -200, type: 2 })
    spawnroom({ distance: -250, type: 1 })
    spawnbossroom({ distance: -300, type: 1 })
  }

  updateBullets()

  if (hp <= 0) {
    document.getElementById("gameover").style.display = "flex";
    cancelAnimationFrame(animationId);
  }

  let animationId = requestAnimationFrame(animate);

  renderer.render(scene, camera);

  cube.velocity.x = 0;
  cube.velocity.z = 0;

  const directions = {
    left: 1,
    right: 1,
    front: 1,
    back: 1,
  };
  let length2 = 255
  doors.forEach((doorx) => {
    if (cube.front <= doorx.front - length && enemiescount == 0) {
      
      spawnmele({xax:0,zax:cube.position.z-10})
      spawnrange({xax:0,zax:cube.position.z-10})
      length += 100

    }
    if (cube.front <= doorx.front - length2) {

      if(localStorage.getItem("boss") == 1){
      spawnPirateShipBoss({x:0,z:cube.position.z-20})}   
      else if(localStorage.getItem("boss") == 2){
        spawnMirror({x:0,z:cube.position.z-20})
      }else{
        spawncubeboss({x:0,z:cube.position.z-20})
      }

    }

    if (boxCollision({
      box1: cube,
      box2: doorx
    }) && enemiescount == 0) {
      doorx.updateMixer(0.01);
    } else if (enemiescount != 0 && boxCollision({
      box1: cube,
      box2: doorx
    })) {

      directions.front = 2
    }

  })
  walls.forEach((wall) => {

    if (wall.walltype === "left" && boxCollision({
      box1: cube,
      box2: wall
    })) {
      directions.left = 2
    } else if (wall.walltype === "right" && boxCollision({
      box1: cube,
      box2: wall
    })) {
      directions.right = 2
    }
    if (wall.walltype === "back" && zaxis(wall)) {
      directions.back = 2
    } else if (wall.walltype === "front" && boxCollision({
      box1: cube,
      box2: wall
    })) {
      directions.front = 2
    }
  });
  if(dni == false){
  if (keys.d.pressed && directions.right != 2) {
    cube.velocity.x = defualtvel;
    warrior.rotation.y = -1.5;

  } else if (keys.a.pressed && directions.left != 2) {
    cube.velocity.x = -defualtvel;
    warrior.rotation.y = 1.5;
  }
  if (keys.s.pressed && directions.back != 2) {
    cube.velocity.z = defualtvel;
    warrior.rotation.y = 3;
  } else if (keys.w.pressed && directions.front != 2) {
    cube.velocity.z = -defualtvel;
    warrior.rotation.y = 0;
  }
  cube.update(ground)}

  if (isbullet == 1) {
    isbullet = 0;
    let bullet = new Box({
      width: 0.2,
      height: 0.2,
      depth: 0.2,
      color: 0xff0000,
      position: {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z + cube.depth / 2 + 0.1,
      },
      velocity: {
        x: 0,
        y: 0,
        z: -0.2,
      },
      z: true,
    });

    scene.add(bullet);
    updateBullet(bullet);
  }

  lasers.forEach((laser) =>{
    laser.update(ground);
    if (boxCollision({
      box1: cube,
      box2: laser
    })) {
      hpdown();
    }
  })

  scene.children.forEach((object) => {
    if (object instanceof Box) {
      if (object.z) {
        updateBullet(object);
      }
    }
  });


  lootenemies.forEach((enemy) => {
    if (enemy.hp<=0){
      enemy.hp = 0
      if(enemy.hp == 0){

      if(enemy.name == "evilchest"){
        var healsound = new Audio('./assets/music/chest.mp3');
        console.log(healsound.play())
        chestloot()
        const heal = new GLTFModel('./assets/heal.glb', {
          position: { x: cube.position.x, y: -0.3, z: -3 },
          scale: 1.8,
          rotate: 3.14,
          pos: 999,
        });
      
        scene.add(heal);
        heals.push(heal)
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);
      }
      if(enemy.name == "cube"){

        chestloot()
        boss = 0
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);

        lasers.forEach((laser) =>{
          scene.remove(laser)
          const index = lasers.indexOf(laser);
          if (index > -1) {
            lasers.splice(index, 1);
          }})

          bosssave(1)
          removeAllObjects()
      }
      if(enemy.name == "pirateShipBoss"){
        chestloot()
        boss = 0
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);

        bosssave(2)
        removeAllObjects()

      }
      if(enemy.name == "Mirror"){
        chestloot()
        boss = 0
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);

        bosssave(3)
        removeAllObjects()

      }
      enemy.hp = 1
    }
    }
  })

  handleBulletEnemyCollisions({ enemies, modelenemies });
  handleBulletEnemyCollisions({ enemies: renemies, modelenemies: modelrenemies });

  camera.position.x = cube.position.x;
  camera.position.z = cube.position.z + 5;

  enemies.forEach((enemy) => {
    const direction = new THREE.Vector3();
    direction.subVectors(cube.position, enemy.position).normalize();

    if (enemy.position.distanceTo(cube.position) > 0.9 && enemy.boss < 1) {
      if(slow == 0){
      enemy.velocity.x = direction.x * 0.02;
      enemy.velocity.z = direction.z * 0.02;}
      else{
        enemy.velocity.x = direction.x * 0.02 * slow;
        enemy.velocity.z = direction.z * 0.02 * slow;

      }
    } else {
      enemy.velocity.z = 0
      enemy.velocity.x = 0
    }

    enemy.update(ground);
  });

  renemies.forEach((enemy) => {
    const direction = new THREE.Vector3();
    direction.subVectors(cube.position, enemy.position).normalize();
    if (enemy.position.distanceTo(cube.position) > 8) {
      enemy.velocity.x = direction.x * 0.008;
      enemy.velocity.z = direction.z * 0.008;
    } else {
      enemy.velocity.z = 0
      enemy.velocity.x = 0
      enemyshoot(renemies)
    }
    enemy.update(ground);
  });

  cube.update(ground);

  enemies.forEach((enemy) => {
    enemy.update(ground);
    chest.update(ground)

    if (boxCollision({
      box1: cube,
      box2: enemy
    })) {
      hpdown();
    }
  });

  allmodels.forEach((enemy) => {

    enemy.updateMixer(0.01)
    if(enemy.special != true){
    enemy.lookAt(cube.position)}

  })

  animates.forEach((anime) => {

    anime.updateMixer(0.01)

  })

  cobwebs.forEach((cobweb) => {
    if (boxCollision({
      box1: cube,
      box2: cobweb
    })) {
      defualtvel = 0.005
    }

  })

  enemiesElement.innerHTML = "";

  allenemies.forEach((enemy) => {
    if (enemy.hp > 0 ) {

      const enemyDiv = document.createElement("div");
      enemyDiv.className = "enemy w-32 h-44 bg-gray-600 flex flex-col gap-4 items-center justify-center";

      const imgDiv = document.createElement("div");
      imgDiv.className = "img w-24 h-24 bg-contain";
      imgDiv.style.backgroundImage = `url(./assets/${enemy.name}.png)`;


      const hpDiv = document.createElement("div");
      hpDiv.className = "hp h-6 w-28";
      for (let i = 0; i < enemy.hp; i++) {
        const oneDiv = document.createElement("div");
        oneDiv.className = "one";
        hpDiv.appendChild(oneDiv);
      }

      enemyDiv.appendChild(imgDiv);
      enemyDiv.appendChild(hpDiv);


      enemiesElement.appendChild(enemyDiv);
    } else {

      const index = allenemies.indexOf(enemy);
      if (index !== -1) {
        allenemies.splice(index, 1);
      }
    }
  });

  enemies.forEach((enemy) => {
    enemy.resetCollision();
  });

  bullets.forEach((bullet) => {
    if (boxCollision({
      box1: cube,
      box2: bullet
    }) && bullet.hp !=2) {
      hpdown();
      scene.remove(bullet);
      bullet.hp = 2
    }
  })

  shops.forEach((shop) => {
    if (boxCollision({
      box1: cube,
      box2: shop
    })) {
      document.getElementById("shop").style.display = "flex";
      dni = true
    }
  })



  knifeshops.forEach((shop) => {
    if (boxCollision({
      box1: cube,
      box2: shop
    })) {
      document.getElementById("knifeshop").style.display = "flex";
      dni = true;  
      spawnblob({ xax: 0, zax: cube.position.z - 10 });

    }
  });
  

  gunshops.forEach((shop) => {
    if (boxCollision({
      box1: cube,
      box2: shop
    })) {
      document.getElementById("gunshop").style.display = "flex";
      dni = true
    }
  })

  wells.forEach((shop) => {
    if (boxCollision({
      box1: cube,
      box2: shop
    })) {
      dni = true;
      let text = "Do you want to throw 5 gold?"
      if(localStorage.getItem("lang") === 'slovak'){
        text = "Chceš hodiť 5 zlata do studne?"
      }
      else{
        text = "Would you like to throw 5 gold?"
      }
      //let throwGold = window.confirm(text);
      Swal.fire({
        title: text,
        showDenyButton: true,
        confirmButtonText: "✓",
        denyButtonText: `x`
      }).then((result) => {
        if (result.isConfirmed) {
          dni = false;
          money = money - 5
          document.getElementById("money").innerHTML = money;
          if (Math.random() < 0.33) {
            chestloot()
            document.getElementById("loot").style.display = "flex";
            setTimeout(function() {
              document.getElementById("loot").style.display = "none"
          }, 3000);
          cube.position.z += 4
          cube.position.x += 4
          cube.velocity.z = 0
          cube.velocity.x = 0
          keys.w.pressed = false
          keys.a.pressed = false
          keys.s.pressed = false
          keys.d.pressed = false
          }else{
            cube.position.z += 4
            cube.position.x += 4
            cube.velocity.z = 0
            cube.velocity.x = 0
            keys.w.pressed = false
            keys.a.pressed = false
            keys.s.pressed = false
            keys.d.pressed = false
            alert("...")}
        } else if (result.isDenied) {
          dni = false;
          cube.position.z += 4
        cube.position.x += 4
        cube.velocity.z = 0
        cube.velocity.x = 0
        keys.w.pressed = false
        keys.a.pressed = false
        keys.s.pressed = false
        keys.d.pressed = false

        }
      });
      cube.position.z += 2
    }
  });

  warrior.updateMixer(0.01);

  chests.forEach((chest) => {
    if (boxCollision({
      box1: cube,
      box2: chest
    })) {

      if (chest.hasinteracted == false) {
        var healsound = new Audio('./assets/music/chest.mp3');
        if(chest.special != true && chest.starter == false || localStorage.getItem("boss")){
        console.log(healsound.play())
        chestloot()
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);}
        if(chest.special == true){
        spawnevilchest({x:chest.position.x,z:chest.position.z-2});
        scene.remove(chest)
      }
      if(chest.starter != false && !localStorage.getItem("boss")){
        selectedGun = new Handgun ()
        guns.push(new Handgun())
        bulletscount = 4;
        document.getElementById('lootimg').style.backgroundImage="url(/assets/Handgun.png)";
        document.getElementById("lootname").innerHTML = `Handgun`;
        if(localStorage.getItem("lang") === 'slovak'){
          document.getElementById("loottext").innerHTML = "Sikovna zbran na zaciatok.";
        }
        else{
        document.getElementById("loottext").innerHTML = "Handy gun to start with.";}
        document.getElementById("loot").style.display = "flex";
        setTimeout(function() {
          document.getElementById("loot").style.display = "none"
      }, 3000);
      }
        chest.hasinteracted = true
      }
      chest.updateMixer(0.05);
      setTimeout(function() {
        scene.remove(chest);
    }, 1000);
      

    }
  })


  lavas.forEach((lava) => {
    if (boxCollision({
      box1: cube,
      box2: lava
    })) {
      hpdown()
    }

  })

  heals.forEach((heal) => {
    if (boxCollision({
      box1: cube,
      box2: heal
    })) {
      if (hp < maxhp) {
        hp = maxhp
        let healsound = new Audio('./assets/music/heal.mp3');
        console.log(healsound.play())
      }
    }

  })


  if (zaxis(wallA) && cube.position.x < 0.8 && cube.position.x > -0.8) {
    door.updateMixer(0.01);
  }

  if (enemies.length === modelenemies.length) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const modelenemy = modelenemies[i];
      follow({
        box1: modelenemy,
        box2: enemy
      })
    }
  }

  if (renemies.length === modelrenemies.length) {
    for (let i = 0; i < renemies.length; i++) {
      const enemy = renemies[i];
      const modelenemy = modelrenemies[i];
      follow({
        box1: modelenemy,
        box2: enemy
      })
    }
  }

  modeldel({ enemiesarray, modelsarray })
  modeldel({ enemiesarray: renemiesarray, modelsarray: rmodelsarray })

  frames++;
}
animate();
