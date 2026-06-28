import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popconfirm,
  Row,
  Segmented,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as aiApi from "../../api/ai.api";
import * as cargoApi from "../../api/cargo.api";
import * as contractsApi from "../../api/contracts.api";
import * as filesApi from "../../api/files.api";
import { getCurrentUserUuid } from "../../auth/currentUser";
import { formatBodyTypes, formatLoadingTypes } from "../../config/cargoOptions";
import type { AddressDto, CargoDto, RecommendedCarDto } from "../../types/domain";
import { calculateCargoVolume, formatAddress, formatDecimal, formatKgAndTonnes, formatRoute } from "../../utils/format";

const { Text, Title } = Typography;
type CargoFilterValues = {
  name?: string;
  loadingCity?: string;
  unloadingCity?: string;
  recordsScope?: "all" | "mine";
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  price?: number;
};

const normalizeFilters = (
  values: CargoFilterValues,
  currentUserUuid: string | null
): Record<string, string> => {
  const filters: Record<string, string> = {};
  const name = values.name?.trim();
  if (name) filters.name = name;
  const loadingCity = values.loadingCity?.trim();
  if (loadingCity) filters.loadingCity = loadingCity;
  const unloadingCity = values.unloadingCity?.trim();
  if (unloadingCity) filters.unloadingCity = unloadingCity;
  if (values.recordsScope === "mine" && currentUserUuid) {
    filters.userUuid = currentUserUuid;
  }
  (["length", "width", "height", "weight", "price"] as const).forEach((key) => {
    const value = values[key];
    if (typeof value === "number") filters[key] = String(value);
  });
  return filters;
};

const buildRouteStops = (
  loadingPlace: AddressDto | undefined | null,
  unloadingPlace: AddressDto | undefined | null
) => [
  { label: "Погрузка", address: formatAddress(loadingPlace ?? {}) },
  { label: "Разгрузка", address: formatAddress(unloadingPlace ?? {}) },
];

export const CargoListPage = () => {
  const navigate = useNavigate();
  const [filtersForm] = Form.useForm<CargoFilterValues>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<CargoDto[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [fileUrlById, setFileUrlById] = useState<Record<number, string>>({});
  const [respondingCargo, setRespondingCargo] = useState<CargoDto | null>(null);
  const [recommendedCars, setRecommendedCars] = useState<RecommendedCarDto[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | undefined>(undefined);
  const [contractPrice, setContractPrice] = useState<number | undefined>(undefined);
  const [creatingContract, setCreatingContract] = useState(false);
  const [deletingCargoId, setDeletingCargoId] = useState<number | null>(null);
  const currentUserUuid = getCurrentUserUuid();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    cargoApi
      .getCargoPage({ currentPageNumber: page, itemsOnPage: pageSize, filters })
      .then(async (data) => {
        if (!alive) return;
        const nextItems = data.items ?? [];
        setItems(nextItems);
        setTotal(data.totalResultCount ?? 0);
        const nextSize = data.itemsOnPage || pageSize;
        setPageSize(nextSize);
        if (data.currentPageNumber) {
          setPage(data.currentPageNumber);
        }

        const allFileIds = Array.from(
          new Set(
            nextItems.flatMap((item) => item.fileIds ?? [])
          )
        );

        if (allFileIds.length === 0) {
          setFileUrlById({});
          return;
        }

        try {
          const files = await filesApi.getFiles(allFileIds);
          if (!alive) return;
          setFileUrlById(
            files.reduce<Record<number, string>>((acc, file) => {
              acc[file.id] = file.url;
              return acc;
            }, {})
          );
        } catch {
          if (!alive) return;
          setFileUrlById({});
        }
      })
      .catch(() => {
        if (!alive) return;
        message.error("Не удалось загрузить список грузов");
        setItems([]);
        setTotal(0);
        setFileUrlById({});
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, pageSize, filters]);

  const applyFilters = (values: CargoFilterValues) => {
    if (values.recordsScope === "mine" && !currentUserUuid) {
      message.error("Не удалось определить пользователя из токена");
      return;
    }

    setFilters(normalizeFilters(values, currentUserUuid));
    setPage(1);
  };

  const applyRecordsScopeFilter = (recordsScope: CargoFilterValues["recordsScope"]) => {
    applyFilters({
      ...filtersForm.getFieldsValue(),
      recordsScope,
    });
  };

  const resetFilters = () => {
    filtersForm.resetFields();
    setFilters({});
    setPage(1);
  };

  const openRespondModal = async (cargo: CargoDto) => {
    if (!currentUserUuid) {
      message.error("Не удалось определить пользователя из токена");
      return;
    }

    setRespondingCargo(cargo);
    setSelectedCarId(undefined);
    setContractPrice(undefined);
    setCarsLoading(true);
    try {
      setRecommendedCars(await aiApi.getRecommendedCars(cargo.id));
    } catch {
      message.error("Не удалось загрузить рекомендации транспорта");
      setRecommendedCars([]);
    } finally {
      setCarsLoading(false);
    }
  };

  const submitContract = async () => {
    if (!respondingCargo) return;
    if (!selectedCarId) {
      message.error("Выберите транспорт");
      return;
    }
    if (!contractPrice || contractPrice <= 0) {
      message.error("Укажите стоимость больше 0");
      return;
    }

    setCreatingContract(true);
    try {
      await contractsApi.createContract({
        carId: selectedCarId,
        cargoId: respondingCargo.id,
        price: contractPrice,
      });
      message.success("Отклик отправлен");
      setRespondingCargo(null);
    } catch {
      message.error("Не удалось отправить отклик");
    } finally {
      setCreatingContract(false);
    }
  };

  const deleteCargo = async (cargo: CargoDto) => {
    setDeletingCargoId(cargo.id);
    try {
      await cargoApi.deleteCargo(cargo.id);
      setItems((prev) => prev.filter((item) => item.id !== cargo.id));
      setTotal((prev) => Math.max(0, prev - 1));
      message.success("Груз удалён");
    } catch {
      message.error("Не удалось удалить груз");
    } finally {
      setDeletingCargoId(null);
    }
  };

  return (
    <div className="list-page">
      <div className="list-page-toolbar">
        <Title level={3} style={{ margin: 0 }}>
          Грузы
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/cargo/new")}>
          Новый груз
        </Button>
      </div>

      <Card className="list-filter-card">
        <Form<CargoFilterValues>
          form={filtersForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{ recordsScope: "all" }}
          autoComplete="off"
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="name" label="Название">
                <Input allowClear placeholder="Введите название" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="loadingCity" label="Город загрузки">
                <Input allowClear placeholder="Откуда" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="unloadingCity" label="Город разгрузки">
                <Input allowClear placeholder="Куда" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="recordsScope" label="Записи">
                <Segmented
                  block
                  onChange={(value) => applyRecordsScopeFilter(value as CargoFilterValues["recordsScope"])}
                  options={[
                    { value: "all", label: "Все записи" },
                    { value: "mine", label: "Мои записи" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="length" label="Длина">
                <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="width" label="Ширина">
                <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="height" label="Высота">
                <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="weight" label="Вес">
                <InputNumber min={0} step={0.01} addonAfter="кг" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="price" label="Цена">
                <InputNumber min={0} step={0.01} addonAfter="руб" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <div className="list-filter-actions">
                <Button type="primary" htmlType="submit">
                  Применить
                </Button>
                <Button onClick={resetFilters}>Сбросить</Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {!loading && items.length === 0 ? (
          <Empty description="Нет грузов" />
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((c) => (
              <Col span={24} key={c.id}>
                {(() => {
                  const firstFileId = c.fileIds?.[0];
                  const coverUrl =
                    typeof firstFileId === "number" ? fileUrlById[firstFileId] : undefined;
                  const isOwnCargo = Boolean(currentUserUuid && c.userUuid === currentUserUuid);
                  const routeStops = buildRouteStops(c.loadingPlace, c.unloadingPlace);
                  const routeSummary = formatRoute(c.loadingPlace, c.unloadingPlace);

                  return (
                <Card
                  className="entity-card entity-card-improved"
                  hoverable
                  onClick={() => navigate(`/cargo/${c.id}`)}
                >
                  <div className="entity-card-layout">
                    <div className="entity-card-media">
                      {coverUrl ? (
                        <img alt={c.name} src={coverUrl} />
                      ) : (
                        <div className="entity-card-media-placeholder">Груз</div>
                      )}
                    </div>
                    <div className="entity-card-content">
                      <div className="entity-card-header-row">
                        <div className="entity-card-heading">
                          <Title level={4} className="entity-card-name">
                            {c.name}
                          </Title>
                          <Text type="secondary" ellipsis={{ tooltip: formatBodyTypes(c.bodyTypes) }}>
                            {formatBodyTypes(c.bodyTypes)}
                          </Text>
                        </div>
                        <Tag color="green">{formatDecimal(c.price)} руб</Tag>
                      </div>

                      <div className="entity-card-tag-row">
                        <Tag>{formatLoadingTypes(c.loadingTypes)}</Tag>
                        <Tag>{formatLoadingTypes(c.unloadingTypes)}</Tag>
                      </div>

                      <div className="entity-card-info-grid">
                        <div className="entity-card-info-item">
                          <Text type="secondary">Вес</Text>
                          <Text strong>{formatKgAndTonnes(c.weight)}</Text>
                        </div>
                        <div className="entity-card-info-item">
                          <Text type="secondary">Объём</Text>
                          <Text strong>{formatDecimal(calculateCargoVolume(c))} м³</Text>
                        </div>
                        <div className="entity-card-info-item">
                          <Text type="secondary">Габариты</Text>
                          <Text>
                            {[c.length, c.width, c.height].map(formatDecimal).join(" × ")} м
                          </Text>
                        </div>
                      </div>

                      <div className="entity-card-route-panel">
                        <div className="entity-card-route-header">
                          <Text strong>Маршрут</Text>
                          <Text type="secondary" ellipsis={{ tooltip: routeSummary }}>
                            Прямой маршрут
                          </Text>
                        </div>

                        <div className="entity-card-route-path">
                          {routeStops.map((stop, index) => (
                            <div className="entity-card-route-stop" key={`${stop.label}-${index}`}>
                              <span className="entity-card-route-marker">{index + 1}</span>
                              <div className="entity-card-route-stop-text">
                                <Text type="secondary">{stop.label}</Text>
                                <Text ellipsis={{ tooltip: stop.address }}>{stop.address}</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="entity-card-actions">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${c.userUuid}/completed`);
                          }}
                        >
                          Профиль владельца
                        </Button>
                        {!isOwnCargo && (
                          <Button
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openRespondModal(c);
                            }}
                          >
                            Откликнуться
                          </Button>
                        )}
                        {isOwnCargo && (
                          <>
                            <Button
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cargo/${c.id}/edit`);
                              }}
                            >
                              Редактировать
                            </Button>
                            <Popconfirm
                              title="Удалить груз?"
                              description="Это действие нельзя отменить"
                              okText="Удалить"
                              cancelText="Отмена"
                              okButtonProps={{ danger: true, loading: deletingCargoId === c.id }}
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                void deleteCargo(c);
                              }}
                              onCancel={(e) => e?.stopPropagation()}
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={deletingCargoId === c.id}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Удалить
                              </Button>
                            </Popconfirm>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                  );
                })()}
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {total > 0 && (
        <div className="list-page-pagination">
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </div>
      )}

      <Modal
        title={respondingCargo ? `Отклик на груз "${respondingCargo.name}"` : "Отклик"}
        open={Boolean(respondingCargo)}
        onCancel={() => setRespondingCargo(null)}
        onOk={() => void submitContract()}
        confirmLoading={creatingContract}
        okText="Отправить"
        cancelText="Отмена"
        width={760}
        className="response-modal"
      >
        <div className="response-modal-content">
          <section className="response-modal-section">
            <div className="response-modal-section-header">
              <Text strong>Выберите транспорт</Text>
              <Text type="secondary">{recommendedCars.length} вариантов</Text>
            </div>

            <Spin spinning={carsLoading}>
              {!carsLoading && recommendedCars.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Подходящий транспорт не найден" />
              ) : (
                <div className="response-option-grid">
                  {recommendedCars.map((recommendation) => {
                    const { car } = recommendation;
                    const carId = Number(car.id);
                    const selected = selectedCarId === carId;

                    return (
                      <button
                        className={`response-option-card${selected ? " response-option-card-selected" : ""}`}
                        key={car.id}
                        type="button"
                        onClick={() => setSelectedCarId(carId)}
                      >
                        <div className="response-option-card-header">
                          <Text strong ellipsis={{ tooltip: `${car.carName} ${car.carModel}` }}>
                            {car.carName} {car.carModel}
                          </Text>
                          <Tag color="blue">{recommendation.score}%</Tag>
                        </div>

                        <div className="response-option-tags">
                          <Tag>{formatBodyTypes(car.bodyType)}</Tag>
                          <Tag>{formatLoadingTypes(car.loadingType)}</Tag>
                          {car.yearProduction && <Tag>{car.yearProduction} г.</Tag>}
                        </div>

                        <div className="response-option-meta-grid">
                          <div>
                            <Text type="secondary">Грузоподъёмность</Text>
                            <Text>{formatKgAndTonnes(car.loadCapacity)}</Text>
                          </div>
                          <div>
                            <Text type="secondary">VIN</Text>
                            <Text code ellipsis={{ tooltip: car.vinNumber || "—" }}>
                              {car.vinNumber || "—"}
                            </Text>
                          </div>
                        </div>
                        <Text type="secondary">{recommendation.reasons.join(", ")}</Text>
                      </button>
                    );
                  })}
                </div>
              )}
            </Spin>
          </section>

          <section className="response-modal-section">
            <Text strong>Стоимость отклика</Text>
            <InputNumber
              className="response-price-input"
              min={0}
              step={0.01}
              placeholder="Стоимость"
              addonAfter="руб"
              value={contractPrice}
              onChange={(v) => setContractPrice(v === null ? undefined : v)}
            />
          </section>
        </div>
      </Modal>
    </div>
  );
};
