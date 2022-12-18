import * as config from "config";
import { Avatar, message as showMessage, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { makeFileUploadRequest } from "helpers";
import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  original?: string;
  action: string;
}

export function AvatarUpload({ original = "", action }: Props) {
  const [imageUrl, setImageUrl] = useState(original);
  const [uploading, setUploading] = useState(false);

  const handleBeforeUpload = (file: UploadFile) => {
    handleUpload(file);
    return false;
  };

  const handleUpload = async (toUpload: UploadFile) => {
    const formData = new FormData();

    formData.append("avatar", toUpload as RcFile);

    setUploading(true);

    try {
      const { url } = (await makeFileUploadRequest(action, formData)) as {
        url: string;
      };

      setImageUrl(`${config.FILE_UPLOAD_URL}/${url}`);

      showMessage.success("Chatroom avatar changed.");
    } catch (error) {
      console.error({ error });

      showMessage.error("Unabled to change chatroom avatar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImgCrop shape="round" rotate={true}>
      <Upload
        listType="picture-card"
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
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
