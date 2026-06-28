import {
  BellOutlined,
  CheckOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Button, Empty, List, Space, Spin, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as notificationsApi from "../api/notifications.api";
import type { NotificationContractDto } from "../types/domain";

const { Text, Title } = Typography;

const notifyNotificationsUpdated = () => {
  window.dispatchEvent(new Event("notifications-updated"));
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    notificationsApi
      .getNotifications()
      .then((data) => {
        if (!alive) return;
        setNotifications(data ?? []);
      })
      .catch(() => {
        if (!alive) return;
        message.error("Не удалось загрузить уведомления");
        setNotifications([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const markRead = async (id: number) => {
    setMarkingId(id);
    try {
      await notificationsApi.markNotificationRead(id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      notifyNotificationsUpdated();
      message.success("Уведомление отмечено прочитанным");
    } catch {
      message.error("Не удалось отметить уведомление прочитанным");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="notifications-page">
      <div className="list-page-toolbar">
        <Title level={3} style={{ margin: 0 }}>
          Уведомления
        </Title>
      </div>

      <Spin spinning={loading}>
        {!loading && notifications.length === 0 ? (
          <Empty description="Нет уведомлений" />
        ) : (
          <List
            className="notifications-list"
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(notification) => {
              const actions = [
                ...(notification.contractId
                  ? [
                      <Button
                        key="contract"
                        type="link"
                        icon={<FileTextOutlined />}
                        onClick={() => navigate(`/contracts/${notification.contractId}`)}
                      >
                        К контракту
                      </Button>,
                    ]
                  : []),
                ...(!notification.isRead
                  ? [
                      <Button
                        key="read"
                        type="link"
                        icon={<CheckOutlined />}
                        loading={markingId === notification.id}
                        onClick={() => void markRead(notification.id)}
                      >
                        Прочитано
                      </Button>,
                    ]
                  : []),
              ];

              return (
                <List.Item
                  className={
                    notification.isRead
                      ? "notification-item"
                      : "notification-item notification-item-unread"
                  }
                  actions={actions}
                >
                  <List.Item.Meta
                    avatar={<BellOutlined className="notification-item-icon" />}
                    title={
                      <Space wrap size={[8, 6]}>
                        <Text strong>{notification.title}</Text>
                        {notification.isRead ? (
                          <Tag>Прочитано</Tag>
                        ) : (
                          <Tag color="blue">Новое</Tag>
                        )}
                      </Space>
                    }
                    description={notification.body}
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Spin>
    </div>
  );
};
