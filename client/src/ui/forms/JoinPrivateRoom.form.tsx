import { LockFilled } from "@ant-design/icons";
import { Button, Card, Divider, Form, Input } from "antd";
import { useFormFields } from "hooks";
import { joinPrivateRoomSchema } from "schemas";

interface Props {
  onSubmit(username: string, password: string): Promise<unknown>;
}

export type JoinPrivateRoomFormValues = typeof JOIN_PRIVATE_ROOM_INITIAL_VALUES;

export const JOIN_PRIVATE_ROOM_INITIAL_VALUES = {
  room: "",
  password: "",
} as {
  room: string;
  password: string;
};

export function JoinPrivateRoomForm({ onSubmit }: Props) {
  const [form] = Form.useForm();
  const { clearErrors, handleError } = useFormFields<JoinPrivateRoomFormValues>(
    form,
    "room",
    "password"
  );

  async function onFinish(values: JoinPrivateRoomFormValues) {
    try {
      const { room, password } = await joinPrivateRoomSchema.validate(values);
      return onSubmit(room, password);
    } catch (error) {
      return handleError(error);
    }
  }

  return (
    <Card title="Join private room" extra={<LockFilled />}>
      <Form
        form={form}
        name="basic"
        layout="vertical"
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 24 }}
        initialValues={JOIN_PRIVATE_ROOM_INITIAL_VALUES}
        onFieldsChange={clearErrors}
        onFinish={onFinish}
        autoComplete="off"
        size="small"
      >
        <Form.Item label="Room" name="room">
          <Input autoFocus={true} />
        </Form.Item>
        <Form.Item label="Password" name="password">
          <Input.Password />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block={true}
          size="large"
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
          }}
        >
          join
        </Button>
      </Form>
    </Card>
  );
}
