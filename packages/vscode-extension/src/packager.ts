import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import * as glob from 'glob';

import { correctVscodePath } from './utils';

// type Icon3D = {
//   /**
//    * The path to the base glb file.
//    */
//   base: string;
//   /**
//    * The transforms to optimize the base model as an icon3d.
//    */
//   transforms: Partial<{
//     /**
//      * If true, this removes lights.
//      * @default false
//      */
//     unlit: boolean;
//     /**
//      * The draco compression parameters.
//      */
//     draco: Parameters<typeof draco>[0];
//     /**
//      * If true, this uses meshopt to compress.
//      * @default false
//      */
//     meshopt: boolean;
//     /**
//      * The quantization parameters.
//      */
//     quantize: Parameters<typeof quantize>[0];
//     /**
//      * The simplification parameters.
//      */
//     simplify: Parameters<typeof simplify>[0];
//     /**
//      * The texture compression parameters.
//      */
//     textureCompression: Parameters<typeof textureCompress>[0];
//   }>;
// };

export default class Packager {
  #packageJson: any;
  #projectRoot: string;
  #projectName: string;
  #projectVersion: string;

  #outPath: string;
  #outStream: fs.WriteStream;
  #outArchive: archiver.Archiver;

  constructor(projectRoot: string) {
    this.#projectRoot = path.normalize(projectRoot);
    this.#packageJson = this.#getPackageJson();
    this.#projectName = this.#packageJson.name;
    if (!this.#projectName || typeof this.#projectName !== 'string') {
      throw new TypeError(`package.json must contain a "name" field.`);
    }
    if (this.#projectName.indexOf('/') !== -1) {
      throw new TypeError(`JSAR could not support scoped packages for now.`);
    }

    this.#projectVersion = this.#packageJson.version;
    if (!this.#projectVersion || typeof this.#projectVersion !== 'string') {
      throw new TypeError(`package.json must contain a "version" field.`);
    }

    this.#outPath = path.join(this.#projectRoot, `${this.#projectName}-${this.#projectVersion}.idp`);
    this.#outArchive = archiver('zip', {
      zlib: { level: 9 }
    });
  }

  get projectFullName() {
    return `${this.#projectName}@${this.#projectVersion}`;
  }

  #getPackageJson() {
    const jsonText = fs.readFileSync(path.join(this.#projectRoot, 'package.json'), 'utf8');
    return JSON.parse(jsonText);
  }

  #getVersionCode(): number {
    const pkgVersion = this.#packageJson.version;
    if (!pkgVersion) {
      throw new TypeError(`package.json must contain a "version" field.`);
    }
    const [ major, minor, patch ] = pkgVersion.split('.')
      .map(v => parseInt(v))
      .map(v => isNaN(v) ? 0 : v);
    return major * 1000000 + minor * 1000 + patch;
  }

  async pack(onProgressChange?: (progress: number, message: string) => void) {
    if (typeof onProgressChange !== 'function') {
      onProgressChange = () => { };
    }

    const packageJson = this.#packageJson;
    if (!packageJson.main) {
      throw new TypeError(`package.json must contain a "main" field.`);
    }

    // Generate the small glb file for icon display.
    // TODO: disable the icon glb generating for now.
    // const iconGlbBuffer = this.#iconGlbBuffer = await this.generateIconGlb(packageJson.icon3d);
    // this.#outArchive.append(iconGlbBuffer, { name: 'icon.glb' });
    // this.#outArchive.append(this.#calculateBufferMD5(iconGlbBuffer), { name: 'icon.glb.md5' });
    onProgressChange(10, 'Generated small glb file.');

    // Add files to the archive
    let files = ((packageJson.files || []) as string[])
      .reduce((files, globPattern) => {
        const matches = glob.sync(correctVscodePath(`${this.#projectRoot}/${globPattern}`));
        return files.concat(matches);
      }, [] as string[]);

    // Append the main file if not present.
    if (!files.includes(packageJson.main)) {
      files.push(path.join(this.#projectRoot, packageJson.main));
    }

    // Append the package.json if not present.
    if (!files.includes('package.json')) {
      files.push(path.join(this.#projectRoot, 'package.json'));
    }
    files = files.map(filename => path.normalize(filename));

    // Read and add all files to the archive
    let totalFilesSize = 0;
    await Promise.all(
      files.map(async filename => {
        const fileOrDir = await fs.promises.stat(filename);
        const name = filename.replace(this.#projectRoot, '');
        if (fileOrDir.isFile()) {
          if (name === '/package.json') {
            // append the package.json.
            this.#outArchive.append(
              JSON.stringify(
                {
                  ...packageJson,
                  jsar: {
                    versionCode: this.#getVersionCode(),
                  },
                },
                null,
                2
              ),
              {
                name,
                stats: fileOrDir,
              });
          } else {
            // append the file.
            this.#outArchive.file(filename, {
              name,
              stats: fileOrDir,
            });
          }

          // append the md5 hash of this file.
          const fileMD5 = await this.#calculateFileMD5(filename);
          this.#outArchive.append(fileMD5, { name: `${name}.md5` });

          // compute the total file size and check if it is larger than maxiumum allowed.
          totalFilesSize += fileOrDir.size;
          if (totalFilesSize > 10 * 1024 * 1024) {
            throw new TypeError(`Total file size is too large. Must be less than 10MB.`);
          }
        } else if (fileOrDir.isDirectory()) {
          this.#outArchive.directory(filename, name);
        }
      })
    );

    let currentEntry: archiver.EntryData;
    this.#outArchive.on('entry', (entry: archiver.EntryData) => {
      currentEntry = entry;
    });
    this.#outArchive.on('progress', (progress: archiver.ProgressData) => {
      onProgressChange(1 / progress.entries.total * 90, `Compressing ${currentEntry?.name}...`);
    });
    this.#outArchive.finalize();
  }

  async save(): Promise<string> {
    console.info(`Start saving to ${this.#outPath}...`);
    return new Promise<string>((resolve, reject) => {
      this.#outArchive.pipe(fs.createWriteStream(this.#outPath))
        .once('error', reject)
        .once('finish', () => {
          console.info('Saved.');
          resolve(this.#outPath);
        });
    });
  }

  #calculateFileMD5(filename: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filename);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('base64')));
      stream.on('error', reject);
    });
  }
}
