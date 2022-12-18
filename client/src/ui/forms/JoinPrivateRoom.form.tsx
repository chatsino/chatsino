import { Button, Form, Input } from "antd";
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
    <>
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
        size="middle"
      >
        <Form.Item label="Room" name="room">
          <Input />
        </Form.Item>
        <Form.Item label="Password" name="password">
          <Input.Password />
        </Form.Item>
      </Form>
      <Button
        key="join"
        type="primary"
        size="middle"
        block={true}
        onClick={form.submit}
      >
        Join
      </Button>
    </>
  );
}
