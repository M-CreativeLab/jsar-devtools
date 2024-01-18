import {
  SpatialDocumentImpl,
  DOMParser,
  NativeDocument,
  NativeEngine,
  RequestManager,
  ResourceLoader,
  UserAgent,
  UserAgentInit,
  JSARDOM,
  MediaPlayerConstructor,
  MediaPlayerBackend,
  JSARInputEvent,
  cdp
} from '@yodaos-jsar/dom';
import ImageDataImpl from '@yodaos-jsar/dom/src/living/image/ImageData';
import 'babylonjs';

declare var acquireVsCodeApi: () => {
  postMessage(message: any): void;
};
let vscode = acquireVsCodeApi();
let vfsOrigin: string;

function canParseURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return false;
  }
}

interface EngineOnBabylonjs extends BABYLON.Engine, EventTarget { }
class EngineOnBabylonjs extends BABYLON.Engine implements NativeEngine {
  // TODO
}

class HeadlessResourceLoader implements ResourceLoader {
  fetch(url: string, options: { accept?: string; cookieJar?: any; referrer?: string; }, returnsAs: 'string'): Promise<string>;
  fetch(url: string, options: { accept?: string; cookieJar?: any; referrer?: string; }, returnsAs: 'json'): Promise<object>;
  fetch(url: string, options: { accept?: string; cookieJar?: any; referrer?: string; }, returnsAs: 'arraybuffer'): Promise<ArrayBuffer>;
  fetch<T = string | object | ArrayBuffer>(url: string, options: { accept?: string; cookieJar?: any; referrer?: string; }, returnsAs?: 'string' | 'json' | 'arraybuffer'): Promise<T>;
  fetch(url: string, options: { accept?: string; cookieJar?: any; referrer?: string; }, returnsAs?: 'string' | 'json' | 'arraybuffer'): Promise<object> | Promise<ArrayBuffer> | Promise<string> {
    if (!canParseURL(url)) {
      throw new TypeError('Invalid URL');
    }

    const urlObj = new URL(url);
    if (urlObj.protocol === 'file:') {
      const vfsUrl = new URL(vfsOrigin);
      vfsUrl.searchParams.set('path', urlObj.pathname);
      url = vfsUrl.href;
    }
    return fetch(url, options)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }
        if (returnsAs === 'string') {
          return resp.text();
        } else if (returnsAs === 'json') {
          return resp.json();
        } else if (returnsAs === 'arraybuffer') {
          return resp.arrayBuffer();
        }
      });
  }
}

/**
 * This is a MediaPlayerBackend implementation for Babylon.js. Which is a MediaPlayerBackend 
 * implementation based on HTMLAudioElement.
 */
class AudioPlayerOnBabylonjs implements MediaPlayerBackend {
  private _audioInstance: HTMLAudioElement;

  constructor() {
    this._audioInstance = new Audio();
  }
  load(buffer: ArrayBuffer | ArrayBufferView, onloaded: () => void): void {
    this._audioInstance.src = URL.createObjectURL(new Blob([buffer]));
    this._audioInstance.onloadeddata = onloaded;
  }
  play(when?: number | undefined): void {
    this._audioInstance.play();
    this._audioInstance.currentTime = when || 0;
  }
  pause(): void {
    this._audioInstance.pause();
  }
  canPlayType(type: string): CanPlayTypeResult {
    return this._audioInstance.canPlayType(type);
  }
  dispose(): void {
    // TODO
  }
  get paused(): boolean {
    return this._audioInstance.paused;
  }
  get currentTime(): number {
    return this._audioInstance.currentTime;
  }
  get duration(): number {
    return this._audioInstance.duration;
  }
  get volume(): number {
    return this._audioInstance.volume;
  }
  set volume(value: number) {
    this._audioInstance.volume = value;
  }
  get loop(): boolean {
    return this._audioInstance.loop;
  }
  set loop(value: boolean) {
    this._audioInstance.loop = value;
  }
  get onended(): () => void {
    return this._audioInstance.onended as any;
  }
  set onended(value: () => void) {
    this._audioInstance.onended = value;
  }
}

class UserAgentOnBabylonjs implements UserAgent {
  versionString: string = '1.0';
  vendor: string = '';
  vendorSub: string = '';
  language: string = 'zh-CN';
  languages: readonly string[] = [
    'zh-CN',
    'en-US',
  ];
  defaultStylesheet: string;
  devicePixelRatio: number;
  deviceMemory?: number;
  domParser: DOMParser;
  resourceLoader: ResourceLoader;
  requestManager: RequestManager;

  constructor(init: UserAgentInit) {
    this.defaultStylesheet = init.defaultStylesheet;
    this.devicePixelRatio = init.devicePixelRatio;
    this.resourceLoader = new HeadlessResourceLoader();
    // this.requestManager = null;
    this.deviceMemory = (navigator as any).deviceMemory;
  }
  alert(message?: string): void {
    throw new Error('Method not implemented.');
  }
  confirm(message?: string): boolean {
    throw new Error('Method not implemented.');
  }
  prompt(message?: string, defaultValue?: string): string {
    throw new Error('Method not implemented.');
  }
  vibrate(pattern: VibratePattern): boolean {
    return navigator.vibrate(pattern);
  }
  getWebSocketConstructor(): typeof WebSocket {
    return globalThis.WebSocket;
  }
  getMediaPlayerConstructor(): MediaPlayerConstructor {
    return AudioPlayerOnBabylonjs;
  }
}

const MIN_WIDTH_SHOW_DEBUGGER = 1024;

class NativeDocumentOnBabylonjs extends EventTarget implements NativeDocument {
  engine: NativeEngine;
  userAgent: UserAgent;
  baseURI: string;
  console: Console;
  attachedDocument: SpatialDocumentImpl;
  closed: boolean = false;
  cdpTransport?: cdp.ITransport;

  private _scene: BABYLON.Scene;
  private _preloadMeshes: Map<string, Array<BABYLON.AbstractMesh | BABYLON.TransformNode>> = new Map();
  private _preloadAnimationGroups: Map<string, BABYLON.AnimationGroup[]> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    super();

    this.engine = new EngineOnBabylonjs(canvas, true);
    this.userAgent = new UserAgentOnBabylonjs({
      defaultStylesheet: '',
      devicePixelRatio: 1,
    });
    const cdpTransport = this.cdpTransport = new cdp.LoopbackTransport();
    cdpTransport.onDidSend((data) => {
      vscode.postMessage({
        command: 'cdp',
        args: [
          data,
        ],
      });
    });
    this.console = globalThis.console;

    const scene = this._scene = new BABYLON.Scene(this.engine);
    this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
    this._scene.debugLayer.hide();

    // create camera and targets
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2,
      2,
      BABYLON.Vector3.Zero(),
      this._scene
    );
    camera.upperRadiusLimit = 5;
    camera.lowerRadiusLimit = 2;
    camera.wheelDeltaPercentage = 0.01;

    camera.setPosition(new BABYLON.Vector3(0, 1, -2.5));
    camera.setTarget(BABYLON.Vector3.Zero());

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 2, -5), this._scene);
    light.intensity = 0.7;

    this.engine.setHardwareScalingLevel(1 / window.devicePixelRatio);
    this.engine.runRenderLoop(() => {
      this._scene.render();
    });
    window.addEventListener('resize', () => {
      this._scene.debugLayer.hide();
      this.engine.resize();
    });

    let lastCameraState = [camera.alpha, camera.beta, camera.radius];
    let isCameraMoving = false;
    scene.onAfterCameraRenderObservable.add(() => {
      if (lastCameraState[0] !== camera.alpha || lastCameraState[1] !== camera.beta || lastCameraState[2] !== camera.radius) {
        isCameraMoving = true;
      } else {
        isCameraMoving = false;
      }
      lastCameraState = [camera.alpha, camera.beta, camera.radius];
    });
    scene.onBeforeRenderObservable.add(() => {
      if (isCameraMoving === true) {
        return;
      }
      const pickingInfo = scene.pick(scene.pointerX, scene.pointerY);
      if (currentDom && pickingInfo.pickedMesh) {
        const raycastEvent = new JSARInputEvent('raycast', {
          sourceId: 'scene_default_ray',
          sourceType: 'mouse',
          targetSpatialElementInternalGuid: pickingInfo.pickedMesh.metadata?.['jsardom.guid'] || '',
          uvCoord: pickingInfo.getTextureCoordinates(),
        });
        currentDom.dispatchInputEvent(raycastEvent);
      }
    });

    function handlePointerDown() {
      if (!isCameraMoving && currentDom) {
        currentDom.dispatchInputEvent(
          new JSARInputEvent('raycast_action', {
            sourceId: 'scene_default_ray',
            type: 'down',
          })
        );
      }
    }
    function handlePointerUp() {
      if (!isCameraMoving && currentDom) {
        currentDom.dispatchInputEvent(
          new JSARInputEvent('raycast_action', {
            sourceId: 'scene_default_ray',
            type: 'up',
          })
        );
      }
    }
    scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERUP:
          handlePointerUp();
          break;
        case BABYLON.PointerEventTypes.POINTERDOWN:
          handlePointerDown();
          break;
        default:
          break;
      }
    });
  }

  getNativeScene(): BABYLON.Scene {
    return this._scene;
  }
  getContainerPose(): XRPose {
    throw new Error('Method not implemented.');
  }
  getPreloadedMeshes(): Map<string, Array<BABYLON.AbstractMesh | BABYLON.TransformNode>> {
    return this._preloadMeshes;
  }
  getPreloadedAnimationGroups(): Map<string, BABYLON.AnimationGroup[]> {
    return this._preloadAnimationGroups;
  }
  observeInputEvent(name?: string): void {
    // TODO
  }
  createBoundTransformNode(nameOrId: string): BABYLON.TransformNode {
    throw new Error('Method not implemented.');
  }
  createImageBitmap(image: ArrayBuffer | ArrayBufferView): Promise<ImageBitmap> {
    return window.createImageBitmap(new Blob([image]));
  }
  decodeImage(bitmap: ImageBitmap, size?: [number, number]): Promise<ImageDataImpl> {
    let expectedWidth = size[0];
    let expectedHeight = size[1];
    if (typeof expectedWidth !== 'number') {
      expectedWidth = bitmap.width;
    }
    if (typeof expectedHeight !== 'number') {
      expectedHeight = bitmap.height;
    }

    const offscreenCanvas = new window.OffscreenCanvas(expectedWidth, expectedHeight);
    const ctx = offscreenCanvas.getContext('2d');
    ctx?.drawImage(
      bitmap,
      0, 0,
      bitmap.width, bitmap.height,
      0, 0,
      offscreenCanvas.width, offscreenCanvas.height
    );
    const imageData = ctx?.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height) as unknown as ImageDataImpl;
    return Promise.resolve(imageData);
  }
  stop(): void {
    // TODO
  }
  close(): void {
    this.engine.stopRenderLoop();
    this.engine.dispose();
    this._scene.dispose();
  }
}

let currentDom: JSARDOM<NativeDocumentOnBabylonjs>;
let lastLoadArgs: string[] = null;
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('renderCanvas');

  window.addEventListener('message', async (event) => {
    const { data } = event;
    if (data?.command === 'load' && data.args?.length > 0) {
      await load(data.args);
    } else if (data?.command === 'reload') {
      await load(lastLoadArgs);
    } else if (data?.command === 'cdp' && data.args?.[0]) {
      const cdpTransport = currentDom.nativeDocument.cdpTransport as cdp.LoopbackTransport;
      cdpTransport.receive(data.args[0]);
      console.log('recived an CDP message', data.args[0]);
    }
  });
  vscode.postMessage({ command: 'ready' });

  {
    // add event listeners for controls
    const resetSceneBtn = document.querySelector('button#reset-scene');
    const reloadSceneBtn = document.querySelector('button#reload-scene');
    const rotateCameraBtn = document.querySelector('button#rotate-camera');

    resetSceneBtn.addEventListener('click', () => {
      if (currentDom) {
        const scene = currentDom.nativeDocument.getNativeScene();
        const camera = scene.activeCamera;
        if (camera instanceof BABYLON.ArcRotateCamera) {
          camera.setPosition(new BABYLON.Vector3(0, 0, -2.5));
        }
      }
    });
    reloadSceneBtn.addEventListener('click', () => {
      load(lastLoadArgs);
    });

    // Camera Rotation
    let isCameraRotatable = false;
    rotateCameraBtn.addEventListener('mousedown', (e) => {
      isCameraRotatable = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (isCameraRotatable === true) {
        isCameraRotatable = false;
      }
    });
    rotateCameraBtn.addEventListener('mousemove', (e: MouseEvent) => {
      if (isCameraRotatable === true && currentDom) {
        const scene = currentDom.nativeDocument.getNativeScene();
        const camera = scene.activeCamera;
        if (camera instanceof BABYLON.ArcRotateCamera) {
          camera.alpha -= e.movementX * 0.1;
          camera.beta -= e.movementY * 0.1;
        }
      }
    });

    // Zoom in/out
    window.addEventListener('wheel', (e: WheelEvent) => {
      if (currentDom) {
        const scene = currentDom.nativeDocument.getNativeScene();
        const camera = scene.activeCamera;
        if (camera instanceof BABYLON.ArcRotateCamera) {
          camera.radius -= e.deltaY * 0.01;
        }
      }
    });
  }

  async function load(loadArgs: string[]) {
    lastLoadArgs = loadArgs;
    const firstArg = loadArgs[0];
    const vfsUrlObject = new URL(firstArg);
    const pathParam = decodeURIComponent(vfsUrlObject.searchParams.get('path'));
    vfsOrigin = vfsUrlObject.origin;

    const entryXsmlCode = await (await fetch(firstArg)).text();
    await execute(entryXsmlCode, pathParam);
  }

  async function execute(code: string, urlBase: string = 'https://example.com/') {
    if (currentDom) {
      await currentDom.unload();
    }
    const nativeDocument = new NativeDocumentOnBabylonjs(canvas as HTMLCanvasElement);
    currentDom = new JSARDOM(code, {
      url: urlBase,
      nativeDocument,
      devtools: {
        log: true,
      }
    });

    await currentDom.load();
    const scene = currentDom.nativeDocument.getNativeScene();
    const spaceNode = scene.rootNodes.find(node => node.name === 'space' && node instanceof BABYLON.TransformNode);
    if (!(spaceNode instanceof BABYLON.TransformNode)) {
      return;
    } else {
      spaceNode.setEnabled(false);
    }

    await currentDom.waitForSpaceReady();
    const boundingVectors = spaceNode.getHierarchyBoundingVectors(true);
    const sceneSize = boundingVectors.max.subtract(boundingVectors.min);
    const scalingRatio = Math.min(1 / sceneSize.x, 1 / sceneSize.y, 1 / sceneSize.z);
    spaceNode.scaling = new BABYLON.Vector3(scalingRatio, scalingRatio, scalingRatio);
    spaceNode.setEnabled(true);
    vscode.postMessage({ command: 'documentReady' });
  }
});
