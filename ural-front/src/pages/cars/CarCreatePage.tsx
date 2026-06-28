import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Typography, Upload, message } from "antd";
import type { RcFile } from "antd/es/upload";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as carsApi from "../../api/cars.api";
import * as filesApi from "../../api/files.api";
import { carTypeOptions, getCarTypeLabel } from "../../config/carOptions";
import {
  bodyTypeOptions,
  getBodyTypeLabel,
  getLoadingTypeLabel,
  loadingTypeOptions,
  toCargoOptions,
} from "../../config/cargoOptions";
import type { CreateCarPayload } from "../../types/domain";
import { normalizeAddress } from "../cargo/cargoForm";

export const CarCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<RcFile[]>([]);
  const [bodyOptions, setBodyOptions] = useState(bodyTypeOptions);
  const [loadingOptions, setLoadingOptions] = useState(loadingTypeOptions);

  useEffect(() => {
    let alive = true;
    carsApi.getCarDictionaries()
      .then((dictionaries) => {
        if (!alive) return;
        const nextBodyOptions = toCargoOptions(dictionaries.bodyTypes);
        const nextLoadingOptions = toCargoOptions(dictionaries.loadingTypes);
        if (nextBodyOptions.length > 0) setBodyOptions(nextBodyOptions);
        if (nextLoadingOptions.length > 0) setLoadingOptions(nextLoadingOptions);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  const onFinish = async (values: CreateCarPayload) => {
    setLoading(true);
    try {
      let fileIds: number[] | undefined = undefined;
      if (files.length > 0) {
        const uploaded = await filesApi.uploadFiles({
          files,
          types: files.map(() => "IMAGE"),
        });
        fileIds = uploaded.map((x) => x.id);
      }

      const created = await carsApi.createCar({
        ...values,
        carType: getCarTypeLabel(values.carType),
        bodyType: (values.bodyType ?? []).map(getBodyTypeLabel),
        loadingType: (values.loadingType ?? []).map(getLoadingTypeLabel),
        departurePlace: normalizeAddress(values.departurePlace ?? undefined),
        destinationPlace: normalizeAddress(values.destinationPlace ?? undefined),
        fileIds,
      });
      message.success("Транспорт создан");
      navigate(`/cars/${created.id}`, { replace: true });
    } catch {
      message.error("Не удалось создать транспорт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="detail-page">
      <div className="detail-page-toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography.Link>
          <Link to="/cars">К списку</Link>
        </Typography.Link>
      </div>

      <Typography.Title level={3}>Новый транспорт</Typography.Title>

      <Card className="form-card car-form-card">
        <Form<CreateCarPayload>
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="carType"
                label="Тип"
                rules={[{ required: true, message: "Укажите тип" }]}
              >
                <Select
                  allowClear
                  placeholder="Выберите тип транспорта"
                  options={carTypeOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="carName"
                label="Название"
                rules={[{ required: true, message: "Укажите название" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="carModel"
                label="Модель"
                rules={[{ required: true, message: "Укажите модель" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="bodyType"
                label="Тип кузова"
                rules={[{ type: "array", min: 1, required: true, message: "Выберите тип кузова" }]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder="Выберите типы кузова"
                  options={bodyOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="loadingType"
                label="Тип загрузки"
                rules={[{ type: "array", min: 1, required: true, message: "Выберите тип загрузки" }]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder="Выберите типы загрузки"
                  options={loadingOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="loadCapacity"
                label="Грузоподъёмность"
                rules={[{ required: true, message: "Укажите грузоподъёмность" }]}
              >
                <InputNumber min={0} step={0.01} addonAfter="кг" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="yearProduction"
                label="Год выпуска"
                rules={[{ required: true, message: "Укажите год" }]}
              >
                <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="vinNumber"
                label="VIN"
                rules={[{ required: true, message: "Укажите VIN" }]}
              >
                <Input maxLength={32} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["departurePlace", "city"]}
                label="Город отправления"
                rules={[{ required: true, message: "Укажите город отправления" }]}
              >
                <Input placeholder="Откуда планирует ехать" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name={["destinationPlace", "city"]}
                label="Город назначения"
                rules={[{ required: true, message: "Укажите город назначения" }]}
              >
                <Input placeholder="Куда планирует ехать" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Фотографии транспорта">
            <Upload
              multiple
              listType="picture"
              beforeUpload={() => false}
              onChange={(info) => {
                const next = info.fileList.map((x) => x.originFileObj).filter(Boolean) as RcFile[];
                setFiles(next);
              }}
            >
              <Button>Выбрать файлы</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Создать
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
