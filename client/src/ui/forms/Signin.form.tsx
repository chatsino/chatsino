import { Button, Form, Input } from "antd";
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
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={SIGNIN_INITIAL_VALUES}
      onFieldsChange={clearErrors}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item label="Username" name="username">
        <Input autoFocus={true} />
      </Form.Item>

      <Form.Item label="Password" name="password">
        <Input.Password />
      </Form.Item>

      <Form.Item
        wrapperCol={{ offset: 4, span: 16 }}
        style={{ marginTop: "3rem" }}
      >
        <Button type="primary" htmlType="submit" block={true}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}