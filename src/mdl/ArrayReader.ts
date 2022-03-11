/**
 *
 */
export class ArrayReader {
  private offset = 0;

  constructor(private arrayBuffer: ArrayBuffer) {}

  public static async createFromBlob(blob: Blob) {
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.addEventListener("load", () => {
        resolve(fileReader.result as ArrayBuffer);
      });

      fileReader.addEventListener("error", (evt) => {
        reject(evt);
      });

      fileReader.readAsArrayBuffer(blob);
    });

    return new ArrayReader(arrayBuffer);
  }

  public readUint8Array(length: number) {
    const array = new Uint8Array(this.arrayBuffer, this.offset, length);
    this.offset += array.byteLength;
    return array;
  }

  public readInt32Array(length: number) {
    const array = new Int32Array(this.arrayBuffer, this.offset, length);
    this.offset += array.byteLength;
    return array;
  }

  public readFloat32Array(length: number) {
    const array = new Float32Array(this.arrayBuffer, this.offset, length);
    this.offset += array.byteLength;
    return array;
  }

  public skipBytes(bytes: number) {
    this.offset += bytes;
  }
}
