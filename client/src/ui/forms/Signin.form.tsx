import { Button, Divider, Form, Input } from "antd";
import { useFormFields } from "hooks";
import { clientSigninSchema } from "schemas";

interface Props {
  onSubmit(username: string, password: string): Promise<unknown>;
}

export type SigninFormValues = typeof SIGNIN_INITIAL_VALUES;

export const SIGNIN_INITIAL_VALUES = {
  username: "",
  password: "",
} as {
  username: string;
  password: string;
};

export function SigninForm({ onSubmit }: Props) {
  const [form] = Form.useForm();
  const { clearErrors, handleError } = useFormFields<SigninFormValues>(
    form,
    "username",
    "password"
  );

  async function onFinish(values: typeof SIGNIN_INITIAL_VALUES) {
    try {
      const { username, password } = await clientSigninSchema.validate(values);
      return onSubmit(username, password);
    } catch (error) {
      return handleError(error);
    }
  }

  return (
    <Form
      form={form}
      name="basic"
      layout="vertical"
      labelCol={{ span: 12 }}
      wrapperCol={{ span: 24 }}
      initialValues={SIGNIN_INITIAL_VALUES}
      onFieldsChange={clearErrors}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item label="Username" name="username">
        <Input autoFocus={true} />
      </Form.Item>
      <Divider />
      <Form.Item label="Password" name="password">
        <Input.Password />
      </Form.Item>
      <Divider />
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
        Submit
      </Button>
    </Form>
  );
}
