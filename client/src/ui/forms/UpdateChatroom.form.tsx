import { Button, Col, Divider, Form, Input, Mentions, Row, Space } from "antd";
import { useFormFields } from "hooks";
import type { ChatroomUpdate } from "loaders";
import { updateChatroomSchema } from "schemas";
import { AvatarUpload } from "../AvatarUpload";

interface Props {
  chatroom: ChatroomData;
  onSubmit(update: ChatroomUpdate): Promise<unknown>;
  onCancel(): unknown;
}

export type UpdateChatroomFormValues = ChatroomUpdate;

export function UpdateChatroomForm({ chatroom, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm();
  const { clearErrors, handleError } = useFormFields<UpdateChatroomFormValues>(
    form,
    "blacklist",
    "description",
    "password",
    "title",
    "whitelist"
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
    <>
      <Form
        form={form}
        name="update-chatroom"
        layout="vertical"
        initialValues={{
          blacklist: [],
          description: chatroom.description,
          password: "",
          title: chatroom.title,
          whitelist: [],
        }}
        onFieldsChange={clearErrors}
        onFinish={onFinish}
        autoComplete="off"
        size="middle"
      >
        <Divider orientation="left" style={{ margin: "2rem 0" }}>
          General
        </Divider>
        <Row gutter={12}>
          <Col xs={24} sm={4}>
            <Form.Item label="Avatar">
              <AvatarUpload
                original={chatroom.avatar}
                action={`/chat/chatrooms/${chatroom.id}/avatar`}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={20}>
            <Form.Item label="Title" name="title">
              <Input type="text" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea />
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left" style={{ margin: "2rem 0" }}>
          Security
        </Divider>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Password" name="password">
              <Input type="text" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Whitelist" name="whitelist">
              <Mentions />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Blacklist" name="blacklist">
              <Mentions />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Space style={{ float: "right" }}>
        <Button type="text" size="large" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" size="large" onClick={form.submit}>
          Update
        </Button>
      </Space>
    </>
  );
}
