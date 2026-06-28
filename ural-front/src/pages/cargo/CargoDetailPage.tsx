import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Empty, Image, Spin, Tag, Typography, message } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as cargoApi from "../../api/cargo.api";
import * as filesApi from "../../api/files.api";
import { getCurrentUserUuid } from "../../auth/currentUser";
import { formatBodyTypes, formatLoadingTypes } from "../../config/cargoOptions";
import type { AddressDto, CargoDto } from "../../types/domain";
import { calculateCargoVolume, formatAddress, formatDateTime, formatDecimal, formatKgAndTonnes, formatRoute } from "../../utils/format";

const { Text, Title, Paragraph } = Typography;

type DetailFieldProps = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

const DetailField = ({ label, value, wide }: DetailFieldProps) => (
  <div className={`cargo-detail-field${wide ? " cargo-detail-field-wide" : ""}`}>
    <Text type="secondary">{label}</Text>
    <div className="cargo-detail-field-value">{value}</div>
  </div>
);

const buildRouteStops = (
  loadingPlace: AddressDto | undefined | null,
  unloadingPlace: AddressDto | undefined | null
) => [
  { label: "Погрузка", address: formatAddress(loadingPlace ?? {}) },
  { label: "Разгрузка", address: formatAddress(unloadingPlace ?? {}) },
];

export const CargoDetailPage = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<CargoDto | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserUuid = getCurrentUserUuid();

  const id = useMemo(() => {
    if (!idParam) return NaN;
    const n = Number(idParam);
    return Number.isFinite(n) ? n : NaN;
  }, [idParam]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      message.error("Некорректный идентификатор груза");
      navigate("/cargo", { replace: true });
      return;
    }
    let alive = true;
    setLoading(true);
    setPhotoUrls([]);
    cargoApi
      .getCargoById(id)
      .then(async (data) => {
        if (!alive) return;
        setCargo(data);

        try {
          const files = await filesApi.getFiles(data.fileIds ?? []);
          if (alive) setPhotoUrls(files.map((file) => file.url));
        } catch {
          if (alive) setPhotoUrls([]);
        }
      })
      .catch(() => {
        message.error("Не удалось загрузить груз");
        navigate("/cargo", { replace: true });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  return (
    <div className="detail-page">
      <div className="detail-page-toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography.Link>
          <Link to="/cargo">К списку грузов</Link>
        </Typography.Link>
        {cargo && currentUserUuid && cargo.userUuid === currentUserUuid && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/cargo/${cargo.id}/edit`)}>
            Редактировать
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        {cargo && (
          <>
            <Title level={3} style={{ marginTop: 0 }}>
              {cargo.name}
            </Title>

            <div className="detail-overview-layout">
              <section className="detail-media-column">
                {photoUrls.length === 0 ? (
                  <div className="detail-media-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Фотографии не прикреплены" />
                  </div>
                ) : (
                  <Image.PreviewGroup>
                    <div className="detail-media-gallery">
                      <Image
                        className="detail-main-photo"
                        src={photoUrls[0]}
                        alt={`${cargo.name}, главное фото`}
                      />
                      {photoUrls.length > 1 && (
                        <div className="detail-thumbnail-row">
                          {photoUrls.slice(1).map((url, index) => (
                            <Image
                              key={`${url}-${index}`}
                              className="detail-thumbnail-photo"
                              src={url}
                              alt={`${cargo.name}, фото ${index + 2}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Image.PreviewGroup>
                )}
              </section>

              <section className="cargo-detail-side">
                <div className="cargo-detail-summary">
                  <div>
                    <Text type="secondary">Стоимость</Text>
                    <Title level={4}>{formatDecimal(cargo.price)} руб</Title>
                  </div>
                  <Tag color="blue">Груз #{cargo.id}</Tag>
                </div>

                <div className="cargo-detail-tags">
                  <Tag>{formatBodyTypes(cargo.bodyTypes)}</Tag>
                  <Tag>{formatLoadingTypes(cargo.loadingTypes)}</Tag>
                  <Tag>{formatLoadingTypes(cargo.unloadingTypes)}</Tag>
                </div>

                <section className="cargo-detail-panel cargo-detail-route-panel">
                  <div className="cargo-detail-panel-header">
                    <div>
                      <Title level={5}>Маршрут</Title>
                      <Text type="secondary">Прямой маршрут</Text>
                    </div>
                  </div>

                  <Paragraph className="cargo-detail-route-summary">
                    {formatRoute(cargo.loadingPlace, cargo.unloadingPlace)}
                  </Paragraph>

                  <div className="cargo-detail-route-list">
                    {buildRouteStops(cargo.loadingPlace, cargo.unloadingPlace).map(
                      (stop, index) => (
                        <div className="cargo-detail-route-stop" key={`${stop.label}-${index}`}>
                          <span className="cargo-detail-route-marker">{index + 1}</span>
                          <div className="cargo-detail-route-stop-content">
                            <Text type="secondary">{stop.label}</Text>
                            <Text>{stop.address}</Text>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                <section className="cargo-detail-panel">
                  <Title level={5}>Характеристики</Title>
                  <div className="cargo-detail-grid">
                    <DetailField label="Длина" value={`${formatDecimal(cargo.length)} м`} />
                    <DetailField label="Ширина" value={`${formatDecimal(cargo.width)} м`} />
                    <DetailField label="Высота" value={`${formatDecimal(cargo.height)} м`} />
                    <DetailField label="Объём" value={`${formatDecimal(calculateCargoVolume(cargo))} м³`} />
                    <DetailField label="Вес" value={formatKgAndTonnes(cargo.weight)} />
                    <DetailField label="Тип кузова" value={formatBodyTypes(cargo.bodyTypes)} />
                    <DetailField label="Тип погрузки" value={formatLoadingTypes(cargo.loadingTypes)} />
                    <DetailField label="Тип разгрузки" value={formatLoadingTypes(cargo.unloadingTypes)} />
                    <DetailField label="Комментарий" value={cargo.comment || "—"} wide />
                  </div>
                </section>

                <section className="cargo-detail-panel">
                  <Title level={5}>Дополнительно</Title>
                  <div className="cargo-detail-grid">
                    <DetailField
                      label="Пользователь"
                      value={<Link to={`/users/${cargo.userUuid}/completed`}>Рейтинг</Link>}
                      wide
                    />
                    <DetailField label="Пользователь (UUID)" value={cargo.userUuid} wide />
                    <DetailField label="Создан" value={formatDateTime(cargo.createdAt)} />
                    <DetailField label="Обновлён" value={formatDateTime(cargo.updatedAt)} />
                  </div>
                </section>
              </section>
            </div>
          </>
        )}
      </Spin>
    </div>
  );
};
