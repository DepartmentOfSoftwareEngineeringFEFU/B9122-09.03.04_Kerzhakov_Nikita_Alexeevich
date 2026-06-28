import { Col, Form, Input, Row } from "antd";

const addressRules = [{ required: true, message: "Заполните поле" }];

type AddressFieldsProps = {
  namePrefix: Array<string | number>;
};

function fieldName(namePrefix: Array<string | number>, field: string) {
  return [...namePrefix, field];
}

export function AddressFields({ namePrefix }: AddressFieldsProps) {
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Form.Item name={fieldName(namePrefix, "country")} label="Страна" rules={addressRules}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name={fieldName(namePrefix, "region")} label="Регион">
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name={fieldName(namePrefix, "city")} label="Город" rules={addressRules}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name={fieldName(namePrefix, "street")} label="Улица" rules={addressRules}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8} md={4}>
        <Form.Item name={fieldName(namePrefix, "house")} label="Дом" rules={addressRules}>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8} md={4}>
        <Form.Item name={fieldName(namePrefix, "apartment")} label="Квартира / офис">
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={8} md={4}>
        <Form.Item name={fieldName(namePrefix, "postalCode")} label="Индекс">
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );
}
