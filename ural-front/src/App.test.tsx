import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./api/client", () => ({
  initApiAuthFromStorage: jest.fn(),
  setAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
  getAccessToken: jest.fn(() => null),
  api: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("antd", () => {
  const React = require("react");
  const LayoutRoot = ({ children, ...rest }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "app-layout", ...rest }, children);
  LayoutRoot.Header = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("header", null, children);
  LayoutRoot.Content = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("main", null, children);

  return {
    Layout: LayoutRoot,
    Menu: () => null,
    theme: {
      useToken: () => ({ token: { colorBgContainer: "#ffffff" } }),
    },
    Button: ({
      children,
      htmlType,
      block: _b,
      loading: _l,
      type: _t,
      ...rest
    }: {
      children?: React.ReactNode;
      htmlType?: string;
      block?: boolean;
      loading?: boolean;
      type?: string;
    } & React.ComponentProps<"button">) =>
      React.createElement("button", { type: htmlType ?? "button", ...rest }, children),
    Card: ({ title, children }: { title?: React.ReactNode; children?: React.ReactNode }) =>
      React.createElement("div", null, title, children),
    Form: Object.assign(
      ({ children, onFinish }: { children?: React.ReactNode; onFinish?: (v: unknown) => void }) =>
        React.createElement(
          "form",
          {
            onSubmit: (e: React.FormEvent) => {
              e.preventDefault();
              onFinish?.({});
            },
          },
          children
        ),
      {
        Item: ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) =>
          React.createElement("div", null, label, children),
      }
    ),
    Input: Object.assign(
      (p: React.ComponentProps<"input">) => React.createElement("input", p),
      { Password: (p: React.ComponentProps<"input">) => React.createElement("input", { type: "password", ...p }) }
    ),
    Typography: {
      Paragraph: ({ children }: { children?: React.ReactNode }) => React.createElement("p", null, children),
      Title: ({ children }: { children?: React.ReactNode }) => React.createElement("h2", null, children),
      Link: ({ children }: { children?: React.ReactNode }) => React.createElement("span", null, children),
    },
    message: { success: jest.fn(), error: jest.fn() },
  };
});

jest.mock("@ant-design/icons", () => ({
  UserOutlined: () => null,
  LockOutlined: () => null,
  MailOutlined: () => null,
  CarOutlined: () => null,
  InboxOutlined: () => null,
  LogoutOutlined: () => null,
  PlusOutlined: () => null,
  ArrowLeftOutlined: () => null,
}));

test("app mounts and shows login when not authenticated", () => {
  render(<App />);
  expect(screen.getByText("Вход")).toBeInTheDocument();
});
