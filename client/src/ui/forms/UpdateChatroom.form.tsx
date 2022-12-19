import { LockOutlined } from "@ant-design/icons";
import {
  Alert,
  Col,
  Form,
  FormInstance,
  Input,
  Row,
  Space,
  Typography,
} from "antd";
import { useFormFields } from "hooks";
import type { ChatroomUpdate } from "loaders";
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
          <Form.Item
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
            name="password"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Alert
                type="warning"
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
                    <li>Private chatrooms do not appear in lists.</li>
                  </ul>
                }
              />
              <Input type="text" placeholder="Enter a password." />
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
