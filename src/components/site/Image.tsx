import type { ImgHTMLAttributes } from "react";

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string;
  alt: string;
  /** Preenche o pai (que deve ser relative). Mesma API de fill do next/image. */
  fill?: boolean;
  priority?: boolean;
  width?: number;
  height?: number;
}

/** Imagem compatível com a API do next/image: carregamento lazy por padrão, fill e priority. */
export default function Image({ src, alt, fill, priority, width, height, className = "", ...rest }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
      {...rest}
    />
  );
}
