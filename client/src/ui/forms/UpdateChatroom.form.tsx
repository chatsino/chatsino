import { Button, Col, Form, Input, Row, Space } from "antd";
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
    "description",
    "title"
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
          description: chatroom.description,
          title: chatroom.title,
        }}
        onFieldsChange={clearErrors}
        onFinish={onFinish}
        autoComplete="off"
        size="middle"
      >
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
