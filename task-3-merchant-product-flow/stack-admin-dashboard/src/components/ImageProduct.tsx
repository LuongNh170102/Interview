import { Image } from "antd";
import { Fragment, type FunctionComponent } from "react";
interface ImageProductProps {
  urlImage: string;
  width?: number;
}
const ImageProduct: FunctionComponent<ImageProductProps> = ({ urlImage, width }) => {
  return <Fragment>{width ? <Image src={urlImage} width={width} /> : <Image src={urlImage} />}</Fragment>;
};

export default ImageProduct;
