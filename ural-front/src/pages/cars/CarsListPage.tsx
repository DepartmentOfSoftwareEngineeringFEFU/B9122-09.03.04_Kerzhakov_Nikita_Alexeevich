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
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as aiApi from "../../api/ai.api";
import * as carsApi from "../../api/cars.api";
import * as contractsApi from "../../api/contracts.api";
import * as filesApi from "../../api/files.api";
import { getCurrentUserUuid } from "../../auth/currentUser";
import {
  formatCarType,
  formatPhotoAnalysisStatus,
  getPhotoAnalysisStatusColor,
} from "../../config/carOptions";
import { formatBodyTypes, formatLoadingTypes } from "../../config/cargoOptions";
import type { CarDto, RecommendedCargoDto } from "../../types/domain";
import { calculateCargoVolume, formatDecimal, formatKgAndTonnes, formatRoute, formatTonnesFromKg } from "../../utils/format";

const { Text, Title } = Typography;
type CarsFilterValues = {
  carName?: string;
  carModel?: string;
  vinNumber?: string;
  departureCity?: string;
  destinationCity?: string;
  recordsScope?: "all" | "mine";
  createdAtSort?: "desc" | "asc";
};

const normalizeFilters = (
  values: CarsFilterValues,
  currentUserUuid: string | null
): Record<string, string> => {
  const filters: Record<string, string> = {};
  (["carName", "carModel", "vinNumber"] as const).forEach((key) => {
    const value = values[key]?.trim();
    if (value) filters[key] = value;
  });
  const departureCity = values.departureCity?.trim();
  if (departureCity) filters.departureCity = departureCity;
  const destinationCity = values.destinationCity?.trim();
  if (destinationCity) filters.destinationCity = destinationCity;
  if (values.recordsScope === "mine" && currentUserUuid) {
    filters.userUuid = currentUserUuid;
  }
  return filters;
};

export const CarsListPage = () => {
  const navigate = useNavigate();
  const [filtersForm] = Form.useForm<CarsFilterValues>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<CarDto[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [createdAtSort, setCreatedAtSort] = useState<"desc" | "asc" | undefined>(undefined);
  const [fileUrlById, setFileUrlById] = useState<Record<number, string>>({});
  const [respondingCar, setRespondingCar] = useState<CarDto | null>(null);
  const [recommendedCargo, setRecommendedCargo] = useState<RecommendedCargoDto[]>([]);
  const [cargoLoading, setCargoLoading] = useState(false);
  const [selectedCargoId, setSelectedCargoId] = useState<number | undefined>(undefined);
  const [contractPrice, setContractPrice] = useState<number | undefined>(undefined);
  const [creatingContract, setCreatingContract] = useState(false);
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);
  const currentUserUuid = getCurrentUserUuid();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    carsApi
      .getCarsPage({
        currentPageNumber: page,
        itemsOnPage: pageSize,
        filters,
        sorting: createdAtSort ? "createdAt" : undefined,
        sortingValue: createdAtSort,
      })
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

        const allFileIds = Array.from(new Set(nextItems.flatMap((item) => item.fileIds ?? [])));
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
        message.error("Не удалось загрузить список транспорта");
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
  }, [page, pageSize, filters, createdAtSort]);

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const applyFilters = (values: CarsFilterValues) => {
    const currentUserUuid = getCurrentUserUuid();
    if (values.recordsScope === "mine" && !currentUserUuid) {
      message.error("Не удалось определить пользователя из токена");
      return;
    }

    setFilters(normalizeFilters(values, currentUserUuid));
    setCreatedAtSort(values.createdAtSort);
    setPage(1);
  };

  const applyRecordsScopeFilter = (recordsScope: CarsFilterValues["recordsScope"]) => {
    applyFilters({
      ...filtersForm.getFieldsValue(),
      recordsScope,
    });
  };

  const resetFilters = () => {
    filtersForm.resetFields();
    setFilters({});
    setCreatedAtSort(undefined);
    setPage(1);
  };

  const openRespondModal = async (car: CarDto) => {
    if (!currentUserUuid) {
      message.error("Не удалось определить пользователя из токена");
      return;
    }

    setRespondingCar(car);
    setSelectedCargoId(undefined);
    setContractPrice(undefined);
    setCargoLoading(true);
    try {
      setRecommendedCargo(await aiApi.getRecommendedCargo(Number(car.id)));
    } catch {
      message.error("Не удалось загрузить рекомендации грузов");
      setRecommendedCargo([]);
    } finally {
      setCargoLoading(false);
    }
  };

  const submitContract = async () => {
    if (!respondingCar) return;
    if (!selectedCargoId) {
      message.error("Выберите груз");
      return;
    }
    if (!contractPrice || contractPrice <= 0) {
      message.error("Укажите стоимость больше 0");
      return;
    }

    setCreatingContract(true);
    try {
      await contractsApi.createContract({
        carId: Number(respondingCar.id),
        cargoId: selectedCargoId,
        price: contractPrice,
      });
      message.success("Отклик отправлен");
      setRespondingCar(null);
    } catch {
      message.error("Не удалось отправить отклик");
    } finally {
      setCreatingContract(false);
    }
  };

  const deleteCar = async (car: CarDto) => {
    setDeletingCarId(car.id);
    try {
      await carsApi.deleteCar(car.id);
      setItems((prev) => prev.filter((item) => item.id !== car.id));
      setTotal((prev) => Math.max(0, prev - 1));
      message.success("Транспорт удалён");
    } catch {
      message.error("Не удалось удалить транспорт");
    } finally {
      setDeletingCarId(null);
    }
  };

  return (
    <div className="list-page">
      <div className="list-page-toolbar">
        <Title level={3} style={{ margin: 0 }}>
          Транспорт
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/cars/new")}>
          Новый транспорт
        </Button>
      </div>

      <Card className="list-filter-card">
        <Form<CarsFilterValues>
          form={filtersForm}
          layout="vertical"
          onFinish={applyFilters}
          initialValues={{ recordsScope: "all" }}
          autoComplete="off"
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="carName" label="Название">
                <Input allowClear placeholder="Введите название" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="carModel" label="Модель">
                <Input allowClear placeholder="Введите модель" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="vinNumber" label="VIN">
                <Input allowClear placeholder="Введите VIN" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="departureCity" label="Город отправления">
                <Input allowClear placeholder="Откуда" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="destinationCity" label="Город назначения">
                <Input allowClear placeholder="Куда" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="recordsScope" label="Записи">
                <Segmented
                  block
                  onChange={(value) => applyRecordsScopeFilter(value as CarsFilterValues["recordsScope"])}
                  options={[
                    { value: "all", label: "Все записи" },
                    { value: "mine", label: "Мои записи" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="createdAtSort" label="Создан">
                <Select
                  allowClear
                  placeholder="Сортировка"
                  options={[
                    { value: "desc", label: "Сначала новые" },
                    { value: "asc", label: "Сначала старые" },
                  ]}
                />
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
          <Empty description="Нет транспорта" />
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((car) => (
              <Col span={24} key={car.id}>
                {(() => {
                  const firstFileId = car.fileIds?.[0];
                  const coverUrl =
                    typeof firstFileId === "number" ? fileUrlById[firstFileId] : undefined;
                  const isOwnCar = Boolean(currentUserUuid && car.userUuid === currentUserUuid);
                  const routeSummary = formatRoute(car.departurePlace, car.destinationPlace);
                  return (
                <Card
                  className="entity-card entity-card-improved"
                  hoverable
                  onClick={() => navigate(`/cars/${car.id}`)}
                >
                  <div className="entity-card-layout">
                    <div className="entity-card-media">
                      {coverUrl ? (
                        <img
                          alt={`${car.carName} ${car.carModel}`}
                          src={coverUrl}
                        />
                      ) : (
                        <div className="entity-card-media-placeholder">Авто</div>
                      )}
                    </div>
                    <div className="entity-card-content">
                      <div className="entity-card-header-row">
                        <div className="entity-card-heading">
                          <Title level={4} className="entity-card-name">
                            {car.carName} {car.carModel}
                          </Title>
                          <Text type="secondary">{formatCarType(car.carType)}</Text>
                        </div>
                        <Tag color="blue">
                          {car.yearProduction ? `${car.yearProduction} г.` : "—"}
                        </Tag>
                      </div>

                      <div className="entity-card-tag-row">
                        <Tag>{formatBodyTypes(car.bodyType)}</Tag>
                        <Tag>{formatLoadingTypes(car.loadingType)}</Tag>
                        <Tag color={getPhotoAnalysisStatusColor(car.photoAnalysisStatus)}>
                          {formatPhotoAnalysisStatus(car.photoAnalysisStatus)}
                        </Tag>
                      </div>

                      <div className="entity-card-info-grid">
                        <div className="entity-card-info-item entity-card-info-item-wide">
                          <Text type="secondary">Маршрут</Text>
                          <Text strong ellipsis={{ tooltip: routeSummary }}>
                            {routeSummary}
                          </Text>
                        </div>
                        <div className="entity-card-info-item">
                          <Text type="secondary">Грузоподъёмность</Text>
                          <Text strong>{formatTonnesFromKg(car.loadCapacity)}</Text>
                        </div>
                        <div className="entity-card-info-item">
                          <Text type="secondary">VIN</Text>
                          <Text code ellipsis={{ tooltip: car.vinNumber || "—" }}>
                            {car.vinNumber || "—"}
                          </Text>
                        </div>
                      </div>

                      <div className="entity-card-actions">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${car.userUuid}/completed`);
                          }}
                        >
                          Профиль владельца
                        </Button>
                        {!isOwnCar && (
                          <Button
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openRespondModal(car);
                            }}
                          >
                            Откликнуться
                          </Button>
                        )}
                        {isOwnCar && (
                          <>
                            <Button
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cars/${car.id}/edit`);
                              }}
                            >
                              Редактировать
                            </Button>
                            <Popconfirm
                              title="Удалить транспорт?"
                              description="Это действие нельзя отменить"
                              okText="Удалить"
                              cancelText="Отмена"
                              okButtonProps={{ danger: true, loading: deletingCarId === car.id }}
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                void deleteCar(car);
                              }}
                              onCancel={(e) => e?.stopPropagation()}
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={deletingCarId === car.id}
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
            onChange={handlePageChange}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </div>
      )}

      <Modal
        title={
          respondingCar
            ? `Отклик на транспорт "${respondingCar.carName} ${respondingCar.carModel}"`
            : "Отклик"
        }
        open={Boolean(respondingCar)}
        onCancel={() => setRespondingCar(null)}
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
              <Text strong>Выберите груз</Text>
              <Text type="secondary">{recommendedCargo.length} вариантов</Text>
            </div>

            <Spin spinning={cargoLoading}>
              {!cargoLoading && recommendedCargo.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Подходящие грузы не найдены" />
              ) : (
                <div className="response-option-grid">
                  {recommendedCargo.map((recommendation) => {
                    const { cargo: c } = recommendation;
                    const selected = selectedCargoId === c.id;
                    const routeSummary = formatRoute(c.loadingPlace, c.unloadingPlace);

                    return (
                      <button
                        className={`response-option-card${selected ? " response-option-card-selected" : ""}`}
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCargoId(c.id)}
                      >
                        <div className="response-option-card-header">
                          <Text strong ellipsis={{ tooltip: c.name }}>
                            {c.name}
                          </Text>
                          <Tag color="green">{recommendation.score}%</Tag>
                        </div>

                        <div className="response-option-tags">
                          <Tag>{formatBodyTypes(c.bodyTypes)}</Tag>
                          <Tag>{formatLoadingTypes(c.loadingTypes)}</Tag>
                          <Tag>{formatLoadingTypes(c.unloadingTypes)}</Tag>
                          <Tag>{formatDecimal(c.price)} руб</Tag>
                        </div>

                        <div className="response-option-meta-grid">
                          <div>
                            <Text type="secondary">Вес</Text>
                            <Text>{formatKgAndTonnes(c.weight)}</Text>
                          </div>
                          <div>
                            <Text type="secondary">Объём</Text>
                            <Text>{formatDecimal(calculateCargoVolume(c))} м³</Text>
                          </div>
                        </div>

                        <div className="response-option-route">
                          <Text type="secondary">Маршрут</Text>
                          <Text ellipsis={{ tooltip: routeSummary }}>{routeSummary}</Text>
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
