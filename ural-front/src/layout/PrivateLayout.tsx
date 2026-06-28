import {
  BellOutlined,
  CarOutlined,
  FileTextOutlined,
  InboxOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Dropdown, Layout, Menu, theme } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getAccessToken } from "../api/client";
import * as filesApi from "../api/files.api";
import * as notificationsApi from "../api/notifications.api";
import * as usersApi from "../api/users.api";
import { useAuth } from "../auth/AuthProvider";
import { getCurrentUserUuid } from "../auth/currentUser";

const { Header, Content } = Layout;

export const PrivateLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/cars")) return "cars";
    if (location.pathname.startsWith("/cargo")) return "cargo";
    if (location.pathname.startsWith("/contracts")) return "contracts";
    if (location.pathname.startsWith("/notifications")) return "notifications";
    return "";
  }, [location.pathname]);

  const loadAvatar = useCallback(async () => {
    const uuid = getCurrentUserUuid();
    if (!uuid) {
      setAvatarUrl(null);
      return;
    }

    try {
      const user = await usersApi.getUserByUuid(uuid);
      const avatarFileId = user.avatar?.photoThumbnailId ?? user.avatar?.photoId;
      if (!avatarFileId) {
        setAvatarUrl(null);
        return;
      }

      const files = await filesApi.getFiles([avatarFileId]);
      setAvatarUrl(files[0]?.url ?? null);
    } catch {
      setAvatarUrl(null);
    }
  }, []);

  const loadNotificationsCount = useCallback(async () => {
    if (!getAccessToken()) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const notifications = await notificationsApi.getNotifications();
      setUnreadNotificationsCount(
        notifications.filter((notification) => !notification.isRead).length
      );
    } catch {
      setUnreadNotificationsCount(0);
    }
  }, []);

  useEffect(() => {
    void loadAvatar();
    window.addEventListener("profile-updated", loadAvatar);
    return () => window.removeEventListener("profile-updated", loadAvatar);
  }, [loadAvatar]);

  useEffect(() => {
    void loadNotificationsCount();
    window.addEventListener("notifications-updated", loadNotificationsCount);
    return () => window.removeEventListener("notifications-updated", loadNotificationsCount);
  }, [loadNotificationsCount]);

  if (!getAccessToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-header-brand">CarGo</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={[
            {
              key: "cars",
              icon: <CarOutlined />,
              label: <Link to="/cars">Транспорт</Link>,
            },
            {
              key: "cargo",
              icon: <InboxOutlined />,
              label: <Link to="/cargo">Грузы</Link>,
            },
            {
              key: "contracts",
              icon: <FileTextOutlined />,
              label: <Link to="/contracts">Контракты</Link>,
            },
            {
              key: "notifications",
              icon: (
                <Badge count={unreadNotificationsCount} size="small">
                  <BellOutlined />
                </Badge>
              ),
              label: <Link to="/notifications">Уведомления</Link>,
            },
          ]}
          className="app-header-menu"
        />
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: "profile",
                icon: <UserOutlined />,
                label: "Настроить профиль",
              },
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Выйти",
              },
            ],
            onClick: ({ key }) => {
              if (key === "profile") {
                navigate("/profile");
                return;
              }
              if (key === "logout") {
                void logout();
              }
            },
          }}
        >
          <button className="app-header-profile-btn" type="button" aria-label="Профиль">
            <Avatar size={40} src={avatarUrl ?? undefined} icon={<UserOutlined />} />
          </button>
        </Dropdown>
      </Header>
      <Content className="app-content" style={{ background: colorBgContainer }}>
        <div className="app-content-inner">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};
