import { LoadingOutlined } from "@ant-design/icons";
import { Avatar, message as showMessage, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { makeFileUploadRequest, makeFileUrl } from "helpers";
import { useCallback, useState } from "react";

interface Props {
  original?: string;
  action: string;
}

export function AvatarUpload({ original = "", action }: Props) {
  console.log(makeFileUrl(original));
  const [imageUrl, setImageUrl] = useState(makeFileUrl(original));
  const [uploading, setUploading] = useState(false);
  const handleUpload = useCallback(
    async (file: UploadFile) => {
      const formData = new FormData();

      formData.append("avatar", file as RcFile);

      setUploading(true);

      try {
        const { url } = (await makeFileUploadRequest(action, formData)) as {
          url: string;
        };

        setImageUrl(makeFileUrl(url));

        showMessage.success("Avatar changed.");
      } catch (error) {
        console.error({ error });

        showMessage.error("Unabled to change avatar.");
      } finally {
        setUploading(false);
      }

      return false;
    },
    [action]
  );

  return (
    <ImgCrop shape="round" rotate={true}>
      <Upload
        listType="picture-card"
        showUploadList={false}
        beforeUpload={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <LoadingOutlined spin={true} />
        ) : (
          <Avatar
            src={imageUrl}
            style={{
              width: "80%",
              height: "80%",
            }}
          />
        )}
      </Upload>
    </ImgCrop>
  );
}
