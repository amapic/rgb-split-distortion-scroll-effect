import * as THREE from "three";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

let scrollable = document.querySelector(".scrollable");

console.log(scrollable)

let current = 0;
let target = 0;
let ease = 0.075;

let click = false;

var rtime;
var timeout = false;
var delta = 200;

// Linear inetepolation used for smooth scrolling and image offset uniform adjustment

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

let raycaster = new THREE.Raycaster();

let pointer = new THREE.Vector2();

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
  click = true;
}

// init function triggered on page load to set the body height to enable scrolling and EffectCanvas initialised
function init(first = true) {
  // console.log("rr",scrollable.getBoundingClientRect().height)
  document.body.style.height = `${scrollable.getBoundingClientRect().height}px`;
  // document.querySelector(".scrollable").style.visibility = "hidden";

  document.addEventListener("mousemove", onPointerMove);

  document.addEventListener("click", onClick);
  // console.log(first)
  if (first) {
    for (let pas = 0; pas < 110; pas = pas + 5) {
      setTimeout(() => {
        // document.querySelector(".greybar").style.width = pas + "vw";
        // console.log("rr",document.querySelector(".greybar").style.width);
      }, 10 * pas);
    }

    setTimeout(() => {
      // document.querySelector(".wrapGreybar").style.display = "none";
      document.querySelector(".scrollable").style.visibility = "visible";
      document.querySelector(".link").style.visibility = "visible";
      document.querySelector(".preloader").style.display = "none";
      new EffectCanvas();
    }, 1200); //1200
  }
}

// translate the scrollable div using the lerp function for the smooth scrolling effect.
function smoothScroll() {
  target = window.scrollY;
  console.log(target);
  current = lerp(current, target, ease);
  scrollable.style.transform = `translate3d(0,${-current}px, 0)`;
}

class EffectCanvas {
  constructor() {
    this.container = document.querySelector("main");
    this.images = [...document.querySelectorAll("img")];
    this.meshItems = []; // Used to store all meshes we will be creating.
    this.setupCamera();
    this.createMeshItems();
    this.intersects = raycaster.intersectObjects(this.scene.children, false);
    this.render();
  }

  // Getter function used to get screen dimensions used for the camera and mesh materials
  get viewport() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let aspectRatio = width / height;
    return {
      width,
      height,
      aspectRatio,
    };
  }

  setupCamera() {
    // window.addEventListener("resize", this.onWindowResize.bind(this), false);

    // Create new scene
    this.scene = new THREE.Scene();

    // Initialize perspective camera

    let perspective = 1000;
    const fov =
      (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI; // see fov image for a picture breakdown of this fov setting.
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.viewport.aspectRatio,
      1,
      1000
    );
    this.camera.position.set(0, 0, perspective); // set the camera position on the z axis.

    // renderer
    // this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.viewport.width, this.viewport.height); // uses the getter viewport function above to set size of canvas / renderer
    this.renderer.setPixelRatio(window.devicePixelRatio); // Import to ensure image textures do not appear blurred.
    this.container.appendChild(this.renderer.domElement); // append the canvas to the main element
  }

  resizeend() {
    if (new Date() - rtime < delta) {
      setTimeout(this.resizeend, delta);
    } else {
      timeout = false;
      alert("Done resizing");
      init(false);
      this.camera.aspect = this.viewport.aspectRatio; // readjust the aspect ratio.
      this.camera.updateProjectionMatrix(); // Used to recalulate projectin dimensions.
      this.renderer.setSize(this.viewport.width, this.viewport.height);
    }
  }

  onWindowResize() {
    rtime = new Date();
    if (timeout === false) {
      timeout = true;
      setTimeout(this.resizeend, delta);
    }
  }

  createMeshItems() {
    let ii = 0;
    // Loop thorugh all images and create new MeshItem instances. Push these instances to the meshItems array.
    this.images.forEach((image) => {
      ii = ii + 1;
      let meshItem = new MeshItem(image, this.scene, ii);
      // meshItem
      this.meshItems.push(meshItem);
    });
  }

  // Animate smoothscroll and meshes. Repeatedly called using requestanimationdrame
  render() {
    smoothScroll();
    raycaster.setFromCamera(pointer, this.camera);
    // const
    // console.log(this.scene.children)

    if (this.intersects.length > 0) {
      document.body.style.cursor = "pointer";
      if (this.intersects[0].object.name == 3) {
        if (click) {
          window.open("/siteWeb1/index.html");
        }
      }

      if (this.intersects[0].object.name == 4) {
        if (click) {
          window.open("/agap2/agap2.html");
        }
      }

      if (this.intersects[0].object.name == 5) {
        if (click) {
          window.open("/planet/index.html");
        }
      }
    } else {
      document.body.style.cursor = "inherit";
    }

    for (let i = 0; i < this.meshItems.length; i++) {
      this.meshItems[i].render();
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
    click = false;
  }
}

class MeshItem {
  // Pass in the scene as we will be adding meshes to this scene.
  constructor(element, scene, name) {
    this.element = element;
    this.scene = scene;
    this.offset = new THREE.Vector2(0, 0); // Positions of mesh on screen. Will be updated below.
    this.sizes = new THREE.Vector2(0, 0); //Size of mesh on screen. Will be updated below.
    this.createMesh();
    this.name = name;
  }

  getDimensions() {
    const { width, height, top, left } = this.element.getBoundingClientRect();
    this.sizes.set(width, height);
    this.offset.set(
      left - window.innerWidth / 2 + width / 2,
      -top + window.innerHeight / 2 - height / 2
    );
  }

  createMesh() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100);
    this.imageTexture = new THREE.TextureLoader().load(this.element.src);
    this.uniforms = {
      uTexture: {
        //texture data
        value: this.imageTexture,
      },
      uOffset: {
        //distortion strength
        value: new THREE.Vector2(0.0, 0.0),
      },
      uAlpha: {
        //opacity
        value: 1,
      },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      // wireframe: true,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.getDimensions(); // set offsetand sizes for placement on the scene
    this.mesh.position.set(this.offset.x, this.offset.y, 0);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
    this.mesh.name = "rr";
    // console.log(this.name);
    this.scene.add(this.mesh);
  }

  render() {
    // this function is repeatidly called for each instance in the aboce
    this.getDimensions();
    this.mesh.position.set(this.offset.x, this.offset.y, 0);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
    this.uniforms.uOffset.value.set(
      this.offset.x * 0.0,
      -(target - current) * 0.0003
    );
    this.mesh.name = this.name;
  }
}

init();
// new EffectCanvas()
