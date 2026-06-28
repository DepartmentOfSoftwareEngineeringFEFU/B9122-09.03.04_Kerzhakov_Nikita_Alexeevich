import { ArrowLeftOutlined, StarFilled } from "@ant-design/icons";
import { Button, Empty, List, Space, Spin, Statistic, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as contractsApi from "../api/contracts.api";
import * as usersApi from "../api/users.api";
import type { UserCompletedContractsDto, UserDto } from "../types/domain";
import { formatDateTime, formatDecimal } from "../utils/format";
import {
  getContractCarTitle,
  getContractCargoTitle,
  getContractStatusText,
} from "./contracts/contractView";

export const UserCompletedContractsPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDto | null>(null);
  const [summary, setSummary] = useState<UserCompletedContractsDto | null>(null);
  const [loading, setLoading] = useState(true);

  const userTitle = useMemo(() => {
    if (!user) return uuid ?? "Пользователь";
    return [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(" ");
  }, [user, uuid]);

  useEffect(() => {
    if (!uuid) {
      message.error("Некорректный пользователь");
      navigate(-1);
      return;
    }

    let alive = true;
    setLoading(true);
    Promise.all([
      usersApi.getUserByUuid(uuid),
      contractsApi.getUserCompletedContracts(uuid),
    ])
      .then(([loadedUser, loadedSummary]) => {
        if (!alive) return;
        setUser(loadedUser);
        setSummary(loadedSummary);
      })
      .catch(() => {
        message.error("Не удалось загрузить историю пользователя");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [uuid, navigate]);

  return (
    <div className="detail-page">
      <div className="detail-page-toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </div>

      <Spin spinning={loading}>
        <section className="contract-detail-panel">
          <Typography.Title level={3} style={{ marginTop: 0 }}>
            {userTitle}
          </Typography.Title>
          <Typography.Text type="secondary">{uuid}</Typography.Text>
          <div className="rating-summary-grid">
            <Statistic
              title="Средний рейтинг"
              value={user?.averageRating ?? 5}
              precision={2}
              prefix={<StarFilled />}
            />
            <Statistic title="Оценок" value={user?.ratingsCount ?? 0} />
            <Statistic title="Завершенных контрактов" value={summary?.completedContractsCount ?? 0} />
          </div>
        </section>

        <section className="contract-detail-panel">
          <Typography.Title level={4}>Завершенные контракты</Typography.Title>
          {summary?.contracts?.length ? (
            <List
              dataSource={summary.contracts}
              renderItem={(contract) => (
                <List.Item
                  actions={[
                    <Link key="open" to={`/contracts/${contract.id}`}>
                      Открыть
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    title={getContractCargoTitle(contract)}
                    description={
                      <Space direction="vertical" size={4}>
                        <Typography.Text>{getContractCarTitle(contract)}</Typography.Text>
                        <Space wrap>
                          <Tag color="green">{getContractStatusText(contract.status)}</Tag>
                          <Typography.Text type="secondary">
                            {formatDecimal(contract.price)}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {formatDateTime(contract.updatedAt ?? contract.createdAt)}
                          </Typography.Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Завершенных контрактов пока нет" />
          )}
        </section>
      </Spin>
    </div>
  );
};
