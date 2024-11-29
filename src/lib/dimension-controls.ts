import * as THREE from 'three';

export class DimensionControls {
  private camera: THREE.PerspectiveCamera;
  private element: HTMLElement;
  private _enableFourthDimension: boolean = false;
  private wAxis: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;
    this.wAxis = new THREE.Vector3(1, 1, 1);
    this.setupControls();
  }

  private setupControls() {
    // Add 4D rotation controls
    this.element.addEventListener('wheel', (e) => {
      if (this._enableFourthDimension) {
        e.preventDefault();
        this.rotate4D(e.deltaY * 0.001);
      }
    });
  }

  private rotate4D(angle: number) {
    // Implement 4D rotation matrix
    // This is a simplified version - you might want to implement proper 4D rotation
    this.wAxis.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.camera.position.applyAxisAngle(this.wAxis, angle);
    this.camera.lookAt(0, 0, 0);
  }

  set enableFourthDimension(value: boolean) {
    this._enableFourthDimension = value;
  }

  resetView() {
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    this.wAxis.set(1, 1, 1);
  }

  toggleDimension() {
    this._enableFourthDimension = !this._enableFourthDimension;
  }
} 