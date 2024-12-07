import * as THREE from 'three';

export class DimensionControls {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;
  private _enableFourthDimension: boolean = false;
  private wAxis: THREE.Vector4;
  private position4D: THREE.Vector4;

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;
    this.wAxis = new THREE.Vector4(0, 0, 0, 1);
    this.position4D = new THREE.Vector4(0, 0, 5, 0);
    this.setupControls();
  }

  private setupControls() {
    this.element.addEventListener('wheel', (e) => {
      if (this._enableFourthDimension) {
        e.preventDefault();
        this.rotate4D(e.deltaY * 0.001);
      }
    });
  }

  private rotate4D(angle: number) {
    // Create 4D rotation matrices for XW, YW, and ZW planes
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // XW rotation matrix
    const rotXW = new THREE.Matrix4().set(
      cos, 0, 0, -sin,
      0, 1, 0, 0,
      0, 0, 1, 0,
      sin, 0, 0, cos
    );

    // YW rotation matrix  
    const rotYW = new THREE.Matrix4().set(
      1, 0, 0, 0,
      0, cos, 0, -sin,
      0, 0, 1, 0,
      0, sin, 0, cos
    );

    // ZW rotation matrix
    const rotZW = new THREE.Matrix4().set(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, cos, -sin,
      0, 0, sin, cos
    );

    // Apply rotations to 4D position
    const pos = new THREE.Vector4(
      this.camera.position.x,
      this.camera.position.y, 
      this.camera.position.z,
      this.position4D.w
    );

    pos.applyMatrix4(rotXW);
    pos.applyMatrix4(rotYW);
    pos.applyMatrix4(rotZW);

    // Project back to 3D
    const w = pos.w;
    const projectionFactor = 1 / (5 - w); // 5 is viewing distance in 4D

    this.camera.position.set(
      pos.x * projectionFactor,
      pos.y * projectionFactor, 
      pos.z * projectionFactor
    );

    this.position4D.set(pos.x, pos.y, pos.z, w);
    this.camera.lookAt(0, 0, 0);
  }

  set enableFourthDimension(value: boolean) {
    this._enableFourthDimension = value;
  }

  resetView() {
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    this.wAxis.set(0, 0, 0, 1);
    this.position4D.set(0, 0, 5, 0);
  }

  toggleDimension() {
    this._enableFourthDimension = !this._enableFourthDimension;
  }
}