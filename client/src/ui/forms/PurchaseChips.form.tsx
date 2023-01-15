import { Button, Form, Input, Select } from "antd";
import { useFormFields } from "hooks";

interface Props {
  onSubmit(amount: number, paymentMethod: string): Promise<unknown>;
}

export type PurchaseChipsFormValues = typeof PURCHASE_CHIPS_FORM_INITIAL_VALUES;

export const PURCHASE_CHIPS_FORM_INITIAL_VALUES = {
  amount: 5,
  paymentMethod: "charity",
} as {
  amount: number;
  paymentMethod: string;
};

export function PurchaseChipsForm({ onSubmit }: Props) {
  const [form] = Form.useForm();
  const { clearErrors, handleError } = useFormFields<PurchaseChipsFormValues>(
    form,
    "amount",
    "paymentMethod"
  );

  async function onFinish(values: PurchaseChipsFormValues) {
    try {
      const { amount, paymentMethod } = values;

      return onSubmit(amount, paymentMethod);
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
        initialValues={PURCHASE_CHIPS_FORM_INITIAL_VALUES}
        onFieldsChange={clearErrors}
        onFinish={onFinish}
        autoComplete="off"
        size="middle"
      >
        <Form.Item label="Amount" name="amount">
          <Input type="number" />
        </Form.Item>
        <Form.Item label="Payment Method" name="paymentMethod">
          <Select
            placeholder="Select a payment method."
            onChange={(value) => form.setFieldValue("paymentMethod", value)}
            allowClear={true}
          >
            <Select.Option value="charity">Charity</Select.Option>
          </Select>
        </Form.Item>
      </Form>
      <Button type="primary" size="middle" block={true} onClick={form.submit}>
        Purchase
      </Button>
    </>
  );
}
