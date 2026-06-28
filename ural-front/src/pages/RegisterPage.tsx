import { useState } from "react";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import type { RegisterPayload } from "../types/auth";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: RegisterPayload) => {
    setLoading(true);
    try {
      await register({
        ...values,
        patronymic: (values.patronymic ?? "").trim(),
      });
      message.success("Регистрация прошла успешно");
      navigate("/", { replace: true });
    } catch {
      message.error("Не удалось зарегистрироваться. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" title="Регистрация">
        <Form<RegisterPayload>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          autoComplete="on"
        >
          <Form.Item
            name="login"
            label="Логин"
            rules={[{ required: true, message: "Введите логин" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Логин"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Введите email"
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Фамилия"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input placeholder="Фамилия" autoComplete="family-name" />
          </Form.Item>
          <Form.Item
            name="firstName"
            label="Имя"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input placeholder="Имя" autoComplete="given-name" />
          </Form.Item>
          <Form.Item name="patronymic" label="Отчество">
            <Input placeholder="Отчество (необязательно)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};
