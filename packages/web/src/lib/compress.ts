import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export const compressOffer = (data: object) => compressToEncodedURIComponent(JSON.stringify(data));

export const decompressOffer = (str: string) => JSON.parse(decompressFromEncodedURIComponent(str));
