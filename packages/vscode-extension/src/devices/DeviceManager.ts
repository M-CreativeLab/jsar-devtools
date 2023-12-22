import { basename } from 'path';
import * as adbkit from '@devicefarmer/adbkit';

export class DeviceManager {
  private static Instance: DeviceManager;

  static getInstance(): DeviceManager {
    if (!DeviceManager.Instance) {
      DeviceManager.Instance = new DeviceManager();
    }
    return DeviceManager.Instance;
  }

  private devices: adbkit.DeviceClient[] = [];
  private adbClient: adbkit.Client;

  constructor() {
    this.setupAdbClient();
  }

  private setupAdbClient() {
    if (this.adbClient == null) {
      this.adbClient = adbkit.Adb.createClient();
    }
  }

  async getDevices() {
    this.setupAdbClient();
    await new Promise((resolve, reject) => {
      return this.adbClient.listDevices().then((devices) => {
        this.devices = devices.map(device => this.adbClient.getDevice(device.id));
        resolve(null);
      }, reject);
    });
    return this.devices;
  }

  async connectDevice(ip: string, port = 5555) {
    this.setupAdbClient();
    this.adbClient.connect(ip, port).then((serial) => {
      const device = this.adbClient.getDevice(serial);
      this.devices.push(device);
    });
  }

  async installToDebugFolder(deviceSerial: string, filePath: string) {
    const targetDebugRootPath = '/storage/emulated/0/tmpfs/jsar';
    const targetDebugPath = `${targetDebugRootPath}/${basename(filePath, '.zip')}`;
    await this.shell(deviceSerial, `rm -rf ${targetDebugPath}`);

    const targetArchivePath = `/data/local/tmp/jsar/${basename(filePath)}`;
    await this.push(deviceSerial, filePath, targetArchivePath);
    await this.shell(deviceSerial, `mkdir -p ${targetDebugRootPath}`);
    await this.shell(deviceSerial, `unzip ${targetArchivePath} -d ${targetDebugPath}`);
  }

  private async push(deviceSerial: string, sourcePath: string, targetPath: string) {
    const device = this.devices.find(device => device.serial === deviceSerial);
    if (!device) {
      throw new Error(`Device ${deviceSerial} not found`);
    }
    return new Promise((resolve, reject) => {
      device.push(sourcePath, targetPath).then((transfer) => {
        transfer.once('error', reject);
        transfer.once('end', resolve);
      }, reject);
    });
  }

  private async shell(deviceSerial: string, command: string) {
    const device = this.devices.find(device => device.serial === deviceSerial);
    if (!device) {
      throw new Error(`Device ${deviceSerial} not found`);
    }
    return new Promise((resolve, reject) => {
      device.shell(command).then((stream) => {
        adbkit.Adb.util.readAll(stream, (err, output) => {
          if (err) {
            reject(err);
          } else {
            console.info(output.toString('utf8'));
            resolve(null);
          }
        });
      }, reject);
    });
  }

  async disposeClient() {
    return new Promise((resolve, reject) => {
      this.adbClient.kill().then(() => {
        this.adbClient = null;
        resolve(null);
      }, (err) => {
        reject(err);
      });
    });
  }
}
