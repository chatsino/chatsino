import { Button, Divider, Form, Input } from "antd";
import { useFormFields } from "hooks";
import { clientSignupSchema } from "schemas";

interface Props {
  onSubmit(
    username: string,
    password: string,
    passwordAgain: string
  ): Promise<unknown>;
}

export type SignupFormValues = typeof SIGNUP_INITIAL_VALUES;

export const SIGNUP_INITIAL_VALUES = {
  username: "",
  password: "",
  passwordAgain: "",
} as {
  username: string;
  password: string;
  passwordAgain: string;
};

export function SignupForm({ onSubmit }: Props) {
  const [form] = Form.useForm();
  const { clearErrors, handleError } = useFormFields<SignupFormValues>(
    form,
    "username",
    "password",
    "passwordAgain"
  );

  async function onFinish(values: typeof SIGNUP_INITIAL_VALUES) {
    try {
      const { username, password, passwordAgain } =
        await clientSignupSchema.validate(values);
      return onSubmit(username, password, passwordAgain);
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
      initialValues={SIGNUP_INITIAL_VALUES}
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

      <Form.Item label="Password (again)" name="passwordAgain">
        <Input.Password />
      </Form.Item>

      <Divider />

      <Button type="primary" htmlType="submit" block={true} size="large">
        Submit
      </Button>
      <Form.Item style={{ marginTop: "3rem" }}></Form.Item>
    </Form>
  );
}
