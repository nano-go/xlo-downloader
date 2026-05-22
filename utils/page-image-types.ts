export type PageImage = {
  src: string;
  name: string;
  type: ImageType;
  width: number;
  height: number;
};

export type ImageType = "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg";
export const VALID_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export function isValidImageType(type: string): type is ImageType {
  return VALID_EXTS.includes(type);
}
