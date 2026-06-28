import { AimOutlined, ArrowLeftOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, InputNumber, Modal, Popconfirm, Rate, Space, Spin, Tag, Typography, message } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as contractsApi from "../../api/contracts.api";
import * as filesApi from "../../api/files.api";
import { getCurrentUserUuid } from "../../auth/currentUser";
import {
  formatCarType,
  formatPhotoAnalysisStatus,
  getPhotoAnalysisStatusColor,
} from "../../config/carOptions";
import { formatBodyTypes, formatLoadingTypes } from "../../config/cargoOptions";
import type { AddressDto, ContractDto, RouteDto } from "../../types/domain";
import {
  calculateCargoVolume,
  formatAddress,
  formatDateTime,
  formatDecimal,
  formatKgAndTonnes,
  formatRoute,
  formatTonnesFromKg,
} from "../../utils/format";
import {
  getContractCarTitle,
  getContractCargoTitle,
  getContractStatusText,
  isContractAgreementStatus,
  isContractCompletedStatus,
  isContractRejectedStatus,
} from "./contractView";

type DetailFieldProps = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

const MAP_TILE_SIZE = 256;
const ROUTE_MAP_WIDTH = 720;
const ROUTE_MAP_HEIGHT = 320;
const ROUTE_MAP_PADDING = 56;
const MIN_MAP_ZOOM = 3;
const MAX_MAP_ZOOM = 14;
const MAX_MERCATOR_LATITUDE = 85.05112878;
const MIN_ROUTE_ZOOM_OFFSET = -3;
const MAX_ROUTE_ZOOM_OFFSET = 4;

const DetailField = ({ label, value, wide }: DetailFieldProps) => (
  <div
    className={
      wide ? "contract-detail-field contract-detail-field-wide" : "contract-detail-field"
    }
  >
    <Typography.Text type="secondary">{label}</Typography.Text>
    <div className="contract-detail-field-value">{value}</div>
  </div>
);

const formatDistance = (meters: number | null | undefined) => {
  if (meters === undefined || meters === null || Number.isNaN(meters)) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} км`;
  return `${Math.round(meters)} м`;
};

const formatDuration = (timeMs: number | null | undefined) => {
  if (timeMs === undefined || timeMs === null || Number.isNaN(timeMs)) return "—";
  const totalMinutes = Math.round(timeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} мин`;
  return `${hours} ч ${minutes} мин`;
};

const getRouteCityLabel = (address: AddressDto | null | undefined, fallback: string) =>
  address?.city || address?.region || address?.country || fallback;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getWrappedTileX = (x: number, zoom: number) => {
  const tileCount = 2 ** zoom;
  return ((x % tileCount) + tileCount) % tileCount;
};

const projectCoordinate = (latitude: number, longitude: number, zoom: number) => {
  const clampedLatitude = clamp(latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  const sinLatitude = Math.sin((clampedLatitude * Math.PI) / 180);
  const scale = MAP_TILE_SIZE * 2 ** zoom;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI))
      * scale,
  };
};

const buildRouteMap = (
  route: RouteDto | null | undefined,
  zoomOffset: number,
  labels: { start: string; finish: string }
) => {
  const points = (route?.points ?? []).filter(
    (point) =>
      typeof point.latitude === "number"
      && typeof point.longitude === "number"
      && Number.isFinite(point.latitude)
      && Number.isFinite(point.longitude)
  );
  if (points.length < 2) return null;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (!firstPoint || !lastPoint) return null;

  const projectedByZoom = Array.from(
    { length: MAX_MAP_ZOOM - MIN_MAP_ZOOM + 1 },
    (_, index) => MAX_MAP_ZOOM - index
  ).map((zoom) => {
    const projectedPoints = points.map((point) =>
      projectCoordinate(point.latitude as number, point.longitude as number, zoom)
    );
    const xs = projectedPoints.map((point) => point.x);
    const ys = projectedPoints.map((point) => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    return {
      zoom,
      projectedPoints,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      routeWidth: width || 1,
      routeHeight: height || 1,
    };
  });

  const fitProjection =
    projectedByZoom.find(
      (projection) =>
        projection.routeWidth <= ROUTE_MAP_WIDTH - ROUTE_MAP_PADDING * 2
        && projection.routeHeight <= ROUTE_MAP_HEIGHT - ROUTE_MAP_PADDING * 2
    ) ?? projectedByZoom[projectedByZoom.length - 1];
  const targetZoom = clamp(
    fitProjection.zoom + zoomOffset,
    MIN_MAP_ZOOM,
    MAX_MAP_ZOOM
  );
  const mapProjection =
    projectedByZoom.find((projection) => projection.zoom === targetZoom) ?? fitProjection;

  const centerX = (mapProjection.minX + mapProjection.maxX) / 2;
  const centerY = (mapProjection.minY + mapProjection.maxY) / 2;
  const topLeftX = centerX - ROUTE_MAP_WIDTH / 2;
  const topLeftY = centerY - ROUTE_MAP_HEIGHT / 2;
  const startTileX = Math.floor(topLeftX / MAP_TILE_SIZE);
  const endTileX = Math.floor((topLeftX + ROUTE_MAP_WIDTH) / MAP_TILE_SIZE);
  const startTileY = Math.floor(topLeftY / MAP_TILE_SIZE);
  const endTileY = Math.floor((topLeftY + ROUTE_MAP_HEIGHT) / MAP_TILE_SIZE);
  const tileCount = 2 ** mapProjection.zoom;
  const tiles = [];

  for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) continue;

      const wrappedTileX = getWrappedTileX(tileX, mapProjection.zoom);
      tiles.push({
        key: `${mapProjection.zoom}-${tileX}-${tileY}`,
        url: `https://tile.openstreetmap.org/${mapProjection.zoom}/${wrappedTileX}/${tileY}.png`,
        x: tileX * MAP_TILE_SIZE - topLeftX,
        y: tileY * MAP_TILE_SIZE - topLeftY,
      });
    }
  }

  const screenPoints = mapProjection.projectedPoints.map((point, index) => ({
    x: point.x - topLeftX,
    y: point.y - topLeftY,
    latitude: points[index].latitude as number,
    longitude: points[index].longitude as number,
    label:
      index === 0
        ? labels.start
        : index === mapProjection.projectedPoints.length - 1
          ? labels.finish
          : undefined,
  }));
  const centerLatitude = ((firstPoint.latitude as number) + (lastPoint.latitude as number)) / 2;
  const centerLongitude = ((firstPoint.longitude as number) + (lastPoint.longitude as number)) / 2;

  return {
    path: screenPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "),
    points: screenPoints,
    tiles,
    width: ROUTE_MAP_WIDTH,
    height: ROUTE_MAP_HEIGHT,
    zoom: mapProjection.zoom,
    openStreetMapUrl: `https://www.openstreetmap.org/#map=${mapProjection.zoom}/${centerLatitude.toFixed(5)}/${centerLongitude.toFixed(5)}`,
  };
};

export const ContractDetailPage = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<ContractDto | null>(null);
  const [fileUrlById, setFileUrlById] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [priceOfferModalOpen, setPriceOfferModalOpen] = useState(false);
  const [priceOfferValue, setPriceOfferValue] = useState<number | null>(null);
  const [priceOfferLoading, setPriceOfferLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [routeZoomOffset, setRouteZoomOffset] = useState(0);
  const currentUserUuid = getCurrentUserUuid();

  const id = useMemo(() => {
    if (!idParam) return NaN;
    const n = Number(idParam);
    return Number.isFinite(n) ? n : NaN;
  }, [idParam]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      message.error("Некорректный идентификатор контракта");
      navigate("/contracts", { replace: true });
      return;
    }

    let alive = true;
    setLoading(true);
    contractsApi
      .getContractById(id)
      .then(async (data) => {
        if (!alive) return;
        setContract(data);
        const firstCargoFileId = data.cargo?.fileIds?.[0];
        const firstCarFileId = data.car?.fileIds?.[0];
        const fileIds = [firstCargoFileId, firstCarFileId].filter(
          (fileId): fileId is number => typeof fileId === "number"
        );

        if (fileIds.length === 0) {
          setFileUrlById({});
          return;
        }

        try {
          const files = await filesApi.getFiles(fileIds);
          if (!alive) return;
          setFileUrlById(
            files.reduce<Record<number, string>>((acc, file) => {
              acc[file.id] = file.url;
              return acc;
            }, {})
          );
        } catch {
          if (alive) setFileUrlById({});
        }
      })
      .catch(() => {
        message.error("Не удалось загрузить контракт");
        navigate("/contracts", { replace: true });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    setRouteZoomOffset(0);
  }, [contract?.route?.id]);

  const firstCargoFileId = contract?.cargo?.fileIds?.[0];
  const firstCarFileId = contract?.car?.fileIds?.[0];
  const cargoImageUrl =
    typeof firstCargoFileId === "number" ? fileUrlById[firstCargoFileId] : undefined;
  const carImageUrl = typeof firstCarFileId === "number" ? fileUrlById[firstCarFileId] : undefined;
  const isCarrier = Boolean(currentUserUuid && contract?.car?.userUuid === currentUserUuid);
  const isCargoOwner = Boolean(currentUserUuid && contract?.cargo?.userUuid === currentUserUuid);
  const ownerUuid = contract?.ownerUuid ?? contract?.cargo?.userUuid;
  const relatedUserUuid = contract?.relatedUserUuid ?? contract?.car?.userUuid;
  const isParticipant = Boolean(
    currentUserUuid
    && (currentUserUuid === ownerUuid
      || currentUserUuid === relatedUserUuid
      || isCarrier
      || isCargoOwner)
  );
  const isAgreement = isContractAgreementStatus(contract?.status);
  const canRespondToPrice = Boolean(
    contract
    && currentUserUuid
    && isAgreement
    && isParticipant
    && contract.priceRequestedByUuid !== currentUserUuid
  );
  const isWaitingPriceResponse = Boolean(
    contract
    && currentUserUuid
    && isAgreement
    && isParticipant
    && contract.priceRequestedByUuid === currentUserUuid
  );
  const canMoveContractStatus =
    isParticipant
    && !isAgreement
    && !isContractCompletedStatus(contract?.status)
    && !isContractRejectedStatus(contract?.status);
  const canRateContract = Boolean(
    contract
    && isContractCompletedStatus(contract.status)
    && (isCarrier || isCargoOwner)
  );
  const routeMap = buildRouteMap(contract?.route, routeZoomOffset, {
    start: getRouteCityLabel(contract?.cargo?.loadingPlace, "Погрузка"),
    finish: getRouteCityLabel(contract?.cargo?.unloadingPlace, "Разгрузка"),
  });

  const updateContractStatus = async (isClose?: boolean) => {
    if (!contract) return;

    setUpdatingStatus(true);
    try {
      const updated = await contractsApi.updateContractStatus(contract.id, { isClose });
      setContract(updated);
      message.success(isClose ? "Сделка отклонена" : "Статус контракта обновлён");
    } catch {
      message.error(isClose ? "Не удалось отклонить сделку" : "Не удалось обновить статус");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openPriceOfferModal = () => {
    setPriceOfferValue(contract?.price ?? null);
    setPriceOfferModalOpen(true);
  };

  const submitPriceOffer = async () => {
    if (!contract || !priceOfferValue) return;

    setPriceOfferLoading(true);
    try {
      const updated = await contractsApi.offerContractPrice(contract.id, {
        price: priceOfferValue,
      });
      setContract(updated);
      setPriceOfferModalOpen(false);
      message.success("Новая стоимость предложена");
    } catch {
      message.error("Не удалось предложить новую стоимость");
    } finally {
      setPriceOfferLoading(false);
    }
  };

  const openRatingModal = () => {
    setRatingValue(5);
    setRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!contract) return;

    setRatingLoading(true);
    try {
      await contractsApi.rateContract(contract.id, {
        rating: ratingValue,
      });
      setRatingModalOpen(false);
      message.success("Оценка сохранена");
    } catch {
      message.error("Не удалось сохранить оценку");
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="detail-page">
      <div className="detail-page-toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography.Link>
          <Link to="/contracts">К списку контрактов</Link>
        </Typography.Link>
      </div>

      <Spin spinning={loading}>
        {contract && (
          <>
            <div className="contract-detail-header">
              <div>
                <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 6 }}>
                  {getContractCargoTitle(contract)}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {getContractCarTitle(contract)}
                </Typography.Text>
              </div>
              <div className="contract-detail-actions">
                <Tag color="blue">{getContractStatusText(contract.status)}</Tag>
                {(canMoveContractStatus || canRespondToPrice) && (
                  <Space wrap size={[8, 8]}>
                    {canRespondToPrice && (
                      <>
                        <Button
                          type="primary"
                          loading={updatingStatus}
                          onClick={() => void updateContractStatus()}
                        >
                          Принять стоимость
                        </Button>
                        <Button onClick={openPriceOfferModal}>
                          Предложить другую
                        </Button>
                        <Popconfirm
                          title="Отклонить сделку?"
                          okText="Отклонить"
                          cancelText="Отмена"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => void updateContractStatus(true)}
                        >
                          <Button danger loading={updatingStatus}>
                            Отклонить
                          </Button>
                        </Popconfirm>
                      </>
                    )}
                    {canMoveContractStatus && (
                      <Button
                        type="primary"
                        loading={updatingStatus}
                        onClick={() => void updateContractStatus()}
                      >
                        Следующий статус
                      </Button>
                    )}
                  </Space>
                )}
                {isWaitingPriceResponse && (
                  <Typography.Text type="secondary">
                    Ожидается ответ второй стороны
                  </Typography.Text>
                )}
                {canRateContract && (
                  <Button onClick={openRatingModal}>
                    Оценить участника
                  </Button>
                )}
              </div>
            </div>

            <section className="contract-detail-panel">
              <Typography.Title level={4}>Контракт</Typography.Title>
              <div className="contract-detail-grid">
                <DetailField label="ID" value={contract.id} />
                <DetailField label="Стоимость" value={formatDecimal(contract.price)} />
                <DetailField
                  label="Стоимость предложил"
                  value={contract.priceRequestedByUuid === currentUserUuid ? "Вы" : contract.priceRequestedByUuid || "—"}
                />
                <DetailField
                  label="Стоимость обновлена"
                  value={formatDateTime(contract.priceUpdatedAt)}
                />
                <DetailField label="Создан" value={formatDateTime(contract.createdAt)} />
                <DetailField label="Обновлён" value={formatDateTime(contract.updatedAt)} />
              </div>
            </section>

            <section className="contract-detail-panel">
              <Typography.Title level={4}>Маршрут перевозки</Typography.Title>
              {routeMap ? (
                <>
                  <div className="contract-route-summary">
                    <DetailField label="Дистанция" value={formatDistance(contract.route?.distanceMeters)} />
                    <DetailField label="Время в пути" value={formatDuration(contract.route?.timeMs)} />
                    <DetailField label="Точек маршрута" value={contract.route?.points?.length ?? 0} />
                    <DetailField label="Сформирован" value={formatDateTime(contract.route?.createdAt)} />
                  </div>
                  <div
                    className="contract-route-map"
                    role="img"
                    aria-label="Карта маршрута перевозки"
                  >
                    <Space.Compact className="contract-route-map-controls">
                      <Button
                        aria-label="Уменьшить масштаб карты"
                        icon={<MinusOutlined />}
                        disabled={
                          routeZoomOffset <= MIN_ROUTE_ZOOM_OFFSET
                          || routeMap.zoom <= MIN_MAP_ZOOM
                        }
                        onClick={() => setRouteZoomOffset((value) => value - 1)}
                      />
                      <Button
                        aria-label="Сбросить масштаб карты"
                        icon={<AimOutlined />}
                        disabled={routeZoomOffset === 0}
                        onClick={() => setRouteZoomOffset(0)}
                      />
                      <Button
                        aria-label="Увеличить масштаб карты"
                        icon={<PlusOutlined />}
                        disabled={
                          routeZoomOffset >= MAX_ROUTE_ZOOM_OFFSET
                          || routeMap.zoom >= MAX_MAP_ZOOM
                        }
                        onClick={() => setRouteZoomOffset((value) => value + 1)}
                      />
                    </Space.Compact>
                    <svg
                      className="contract-route-tile-layer"
                      viewBox={`0 0 ${routeMap.width} ${routeMap.height}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      {routeMap.tiles.map((tile) => (
                        <image
                          key={tile.key}
                          className="contract-route-tile"
                          href={tile.url}
                          x={tile.x.toFixed(1)}
                          y={tile.y.toFixed(1)}
                          width={MAP_TILE_SIZE}
                          height={MAP_TILE_SIZE}
                          preserveAspectRatio="none"
                        />
                      ))}
                    </svg>
                    <svg
                      className="contract-route-overlay"
                      viewBox={`0 0 ${routeMap.width} ${routeMap.height}`}
                      preserveAspectRatio="none"
                    >
                      <polyline className="contract-route-line-shadow" points={routeMap.path} />
                      <polyline className="contract-route-line" points={routeMap.path} />
                      {routeMap.points.map((point, index, all) => (
                        index === 0 || index === all.length - 1 ? (
                          <g
                            key={`${point.latitude}-${point.longitude}-${index}`}
                            className="contract-route-point"
                            transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}
                          >
                            <circle
                              className={index === 0 ? "contract-route-point-start" : "contract-route-point-finish"}
                              r="9"
                            />
                            <text y="-15" textAnchor="middle">
                              {point.label}
                            </text>
                          </g>
                        ) : null
                      ))}
                    </svg>
                    <a
                      className="contract-route-map-badge"
                      href={routeMap.openStreetMapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenStreetMap
                    </a>
                  </div>
                </>
              ) : (
                <Typography.Text type="secondary">
                  Маршрут будет сформирован после согласования контракта.
                </Typography.Text>
              )}
            </section>

            <section className="contract-detail-panel">
              <Typography.Title level={4}>Груз</Typography.Title>
              <div className="contract-detail-media-layout">
                {cargoImageUrl && (
                  <img
                    className="contract-detail-image"
                    alt={getContractCargoTitle(contract)}
                    src={cargoImageUrl}
                  />
                )}
                <div className="contract-detail-grid">
                  <DetailField label="ID" value={contract.cargo?.id ?? contract.cargoId ?? "—"} />
                  <DetailField
                    label="Грузовладелец"
                    value={
                      contract.cargo?.userUuid ? (
                        <Link to={`/users/${contract.cargo.userUuid}/completed`}>
                          История пользователя
                        </Link>
                      ) : "—"
                    }
                  />
                  <DetailField label="Название" value={getContractCargoTitle(contract)} />
                  <DetailField label="Тип кузова" value={formatBodyTypes(contract.cargo?.bodyTypes)} />
                  <DetailField
                    label="Тип погрузки"
                    value={formatLoadingTypes(contract.cargo?.loadingTypes)}
                  />
                  <DetailField
                    label="Тип разгрузки"
                    value={formatLoadingTypes(contract.cargo?.unloadingTypes)}
                  />
                  <DetailField label="Цена" value={formatDecimal(contract.cargo?.price)} />
                  <DetailField label="Длина" value={formatDecimal(contract.cargo?.length)} />
                  <DetailField label="Ширина" value={formatDecimal(contract.cargo?.width)} />
                  <DetailField label="Высота" value={formatDecimal(contract.cargo?.height)} />
                  <DetailField label="Объём" value={formatDecimal(calculateCargoVolume(contract.cargo))} />
                  <DetailField label="Вес" value={formatKgAndTonnes(contract.cargo?.weight)} />
                  <DetailField
                    wide
                    label="Погрузка"
                    value={formatAddress(contract.cargo?.loadingPlace ?? {})}
                  />
                  <DetailField
                    wide
                    label="Разгрузка"
                    value={formatAddress(contract.cargo?.unloadingPlace ?? {})}
                  />
                  <DetailField
                    wide
                    label="Маршрут"
                    value={formatRoute(contract.cargo?.loadingPlace, contract.cargo?.unloadingPlace)}
                  />
                  <DetailField wide label="Комментарий" value={contract.cargo?.comment || "—"} />
                </div>
              </div>
            </section>

            <section className="contract-detail-panel">
              <Typography.Title level={4}>Транспорт</Typography.Title>
              <div className="contract-detail-media-layout">
                {carImageUrl && (
                  <img
                    className="contract-detail-image"
                    alt={getContractCarTitle(contract)}
                    src={carImageUrl}
                  />
                )}
                <div className="contract-detail-grid">
                  <DetailField label="ID" value={contract.car?.id ?? contract.carId ?? "—"} />
                  <DetailField
                    label="Перевозчик"
                    value={
                      contract.car?.userUuid ? (
                        <Link to={`/users/${contract.car.userUuid}/completed`}>
                          История пользователя
                        </Link>
                      ) : "—"
                    }
                  />
                  <DetailField label="Авто" value={getContractCarTitle(contract)} />
                  <DetailField label="Тип" value={formatCarType(contract.car?.carType)} />
                  <DetailField label="Тип кузова" value={formatBodyTypes(contract.car?.bodyType)} />
                  <DetailField
                    label="Тип загрузки"
                    value={formatLoadingTypes(contract.car?.loadingType)}
                  />
                  <DetailField
                    label="Грузоподъёмность"
                    value={formatTonnesFromKg(contract.car?.loadCapacity)}
                  />
                  <DetailField label="Год выпуска" value={contract.car?.yearProduction ?? "—"} />
                  <DetailField label="VIN" value={contract.car?.vinNumber || "—"} />
                  <DetailField
                    label="Состояние по фото"
                    value={
                      <Tag color={getPhotoAnalysisStatusColor(contract.car?.photoAnalysisStatus)}>
                        {formatPhotoAnalysisStatus(contract.car?.photoAnalysisStatus)}
                      </Tag>
                    }
                  />
                  <DetailField
                    wide
                    label="Выжимка нейросети"
                    value={contract.car?.photoAnalysisSummary || "—"}
                  />
                  <DetailField label="Создан" value={formatDateTime(contract.car?.createdAt)} />
                  <DetailField label="Обновлён" value={formatDateTime(contract.car?.updatedAt)} />
                </div>
              </div>
            </section>

          </>
        )}
      </Spin>

      <Modal
        title="Предложить другую стоимость"
        open={priceOfferModalOpen}
        onCancel={() => setPriceOfferModalOpen(false)}
        onOk={() => void submitPriceOffer()}
        okText="Отправить"
        cancelText="Отмена"
        confirmLoading={priceOfferLoading}
        okButtonProps={{ disabled: !priceOfferValue || priceOfferValue <= 0 }}
      >
        <InputNumber
          min={1}
          precision={2}
          value={priceOfferValue}
          onChange={(value) => setPriceOfferValue(value)}
          style={{ width: "100%" }}
          addonAfter="₽"
        />
      </Modal>

      <Modal
        title="Оценить участника сделки"
        open={ratingModalOpen}
        onCancel={() => setRatingModalOpen(false)}
        onOk={() => void submitRating()}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={ratingLoading}
        okButtonProps={{ disabled: ratingValue < 1 }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Rate allowClear={false} value={ratingValue} onChange={setRatingValue} />
        </Space>
      </Modal>
    </div>
  );
};
