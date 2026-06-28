import { useState } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type LoginFormValues = {
  login: string;
  password: string;
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values);
      message.success("Вход выполнен");
      navigate("/", { replace: true });
    } catch {
      message.error("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" title="Вход">
        <Form<LoginFormValues>
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
            name="password"
            label="Пароль"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
};
