import { Avatar, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import type {
  RcFile,
  UploadChangeParam,
  UploadFile,
} from "antd/es/upload/interface";
import { useCallback, useState } from "react";

interface Props {
  original?: string;
  action: string;
}

const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

export function AvatarUpload({ original = "", action }: Props) {
  const [imageUrl, setImageUrl] = useState(original);
  const [file, setFile] = useState<null | UploadFile>(null);
  const [uploading, setUploading] = useState(false);

  const handleRemove = () => {
    setImageUrl(original);
    setFile(null);
  };

  const handleBeforeUpload = (file: UploadFile) => {
    setFile(file);
    return true;
  };

  const handleChange = useCallback((info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === "uploading") {
      setUploading(true);
    }

    if (info.file.originFileObj) {
      getBase64(info.file.originFileObj as RcFile, (url) => setImageUrl(url));
    }
  }, []);

  const handlePreview = async (file: UploadFile) => {
    let src = file.url as string;

    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as RcFile);
        reader.onload = () => resolve(reader.result as string);
      });
    }

    const image = new Image();
    image.src = src;

    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  return (
    <ImgCrop shape="round" rotate={true}>
      <Upload
        listType="picture-card"
        showUploadList={false}
        fileList={file ? [file] : []}
        beforeUpload={handleBeforeUpload}
        onRemove={handleRemove}
        onChange={handleChange}
        onPreview={handlePreview}
      >
        <Avatar
          src={imageUrl}
          style={{
            width: "80%",
            height: "80%",
          }}
        />
      </Upload>
    </ImgCrop>
  );
}
