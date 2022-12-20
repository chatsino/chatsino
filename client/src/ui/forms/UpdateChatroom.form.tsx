import { LockOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  FormInstance,
  Input,
  Row,
  Space,
  Switch,
  Typography,
} from "antd";
import { useFormFields } from "hooks";
import { useState } from "react";
import type { ChatroomUpdate } from "loaders";
import { FaListAlt, FaRegListAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { updateChatroomSchema } from "schemas";
import { AvatarUpload } from "../AvatarUpload";

interface Props {
  form: FormInstance;
  chatroom: ChatroomData;
  onSubmit(update: ChatroomUpdate): Promise<unknown>;
  onCancel(): unknown;
}

export type UpdateChatroomFormValues = ChatroomUpdate;

export function UpdateChatroomForm({ form, chatroom, onSubmit }: Props) {
  const [showingSecurity, setShowingSecurity] = useState(false);
  const { clearErrors, handleError } = useFormFields<UpdateChatroomFormValues>(
    form,
    "description",
    "title",
    "password"
  );

  async function onFinish(values: UpdateChatroomFormValues) {
    try {
      const update = await updateChatroomSchema.validate(values);
      return onSubmit(update);
    } catch (error) {
      return handleError(error);
    }
  }

  return (
    <Form
      form={form}
      initialValues={{
        description: chatroom.description,
        title: chatroom.title,
        password: "",
      }}
      name="update-chatroom"
      layout="vertical"
      onFieldsChange={clearErrors}
      onFinish={onFinish}
      autoComplete="off"
      size="large"
    >
      <Row gutter={24}>
        <Col xs={24} sm={4}>
          <Form.Item label="Avatar">
            <AvatarUpload
              original={chatroom.avatar}
              action={`/chat/chatrooms/${chatroom.id}/avatar`}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={19} push={1}>
          <Form.Item label="Title" name="title">
            <Input type="text" placeholder="Enter a title." />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter a description." />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" style={{ marginBottom: "1rem" }}>
        <Space>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Security
          </Typography.Title>
          <Switch checked={showingSecurity} onChange={setShowingSecurity} />
        </Space>
      </Divider>
      {showingSecurity && (
        <>
          <Alert
            type="info"
            style={{
              padding: "0.25rem",
            }}
            showIcon={true}
            icon={
              <LockOutlined
                style={{ position: "relative", top: 9, left: 16 }}
              />
            }
            description={
              <ul style={{ margin: 0 }}>
                <li>Chatrooms with a password are considered private.</li>
                <li>
                  Chatrooms with anyone on a whitelist are considered private.
                </li>
                <li>Private chatrooms do not appear in lists.</li>
                <li>
                  Chatrooms with users on a blacklist are still considered
                  public.
                </li>
              </ul>
            }
          />
          <Form.Item
            name="password"
            label={
              <>
                Password{" "}
                <Typography.Text
                  type="secondary"
                  style={{ marginLeft: "0.5rem" }}
                >
                  <small>(optional)</small>
                </Typography.Text>
              </>
            }
          >
            <Input type="text" placeholder="Enter a password." />
          </Form.Item>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Blacklist">
                <Link to={`/chat/${chatroom.id}/settings/whitelist`}>
                  <Button
                    block={true}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <FaListAlt /> Modify Blacklist
                  </Button>
                </Link>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Whitelist">
                <Link to={`/chat/${chatroom.id}/settings/whitelist`}>
                  <Button
                    block={true}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <FaRegListAlt /> Modify Whitelist
                  </Button>
                </Link>
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </Form>
  );
}
