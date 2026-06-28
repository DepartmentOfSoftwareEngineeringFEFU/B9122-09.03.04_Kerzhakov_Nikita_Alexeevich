import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Image, Input, InputNumber, Row, Select, Spin, Typography, Upload, message } from "antd";
import type { RcFile } from "antd/es/upload";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as cargoApi from "../../api/cargo.api";
import * as filesApi from "../../api/files.api";
import { getCurrentUserUuid } from "../../auth/currentUser";
import {
  bodyTypeOptions,
  getBodyTypeLabel,
  getBodyTypeValue,
  getLoadingTypeLabel,
  getLoadingTypeValue,
  loadingTypeOptions,
  toCargoOptions,
} from "../../config/cargoOptions";
import type { CargoDto, CreateCargoPayload } from "../../types/domain";
import { AddressFields } from "./AddressFields";
import { normalizeCargoPayload } from "./cargoForm";
import type { FileDto } from "../../api/files.api";

export const CargoEditPage = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateCargoPayload>();
  const [cargo, setCargo] = useState<CargoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<RcFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileDto[]>([]);
  const [bodyOptions, setBodyOptions] = useState(bodyTypeOptions);
  const [loadingOptions, setLoadingOptions] = useState(loadingTypeOptions);
  const [unloadingOptions, setUnloadingOptions] = useState(loadingTypeOptions);

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
    cargoApi
      .getCargoById(id)
      .then(async (data) => {
        if (!alive) return;
        const currentUserUuid = getCurrentUserUuid();
        if (!currentUserUuid || data.userUuid !== currentUserUuid) {
          message.error("Редактировать можно только собственный груз");
          navigate(`/cargo/${data.id}`, { replace: true });
          return;
        }

        setCargo(data);
        form.setFieldsValue({
          name: data.name,
          bodyTypes: (data.bodyTypes ?? []).map(getBodyTypeValue),
          loadingTypes: (data.loadingTypes ?? []).map(getLoadingTypeValue),
          unloadingTypes: (data.unloadingTypes ?? []).map(getLoadingTypeValue),
          length: data.length,
          width: data.width,
          height: data.height,
          weight: data.weight,
          price: data.price,
          loadingPlace: data.loadingPlace,
          unloadingPlace: data.unloadingPlace,
          comment: data.comment,
        });

        try {
          const loadedFiles = await filesApi.getFiles(data.fileIds ?? []);
          if (alive) setExistingFiles(loadedFiles);
        } catch {
          if (alive) setExistingFiles([]);
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
  }, [form, id, navigate]);

  useEffect(() => {
    let alive = true;
    cargoApi.getCargoDictionaries()
      .then((dictionaries) => {
        if (!alive) return;
        const nextBodyOptions = toCargoOptions(dictionaries.bodyTypes);
        const nextLoadingOptions = toCargoOptions(dictionaries.loadingTypes);
        const nextUnloadingOptions = toCargoOptions(dictionaries.unloadingTypes);
        if (nextBodyOptions.length > 0) setBodyOptions(nextBodyOptions);
        if (nextLoadingOptions.length > 0) setLoadingOptions(nextLoadingOptions);
        if (nextUnloadingOptions.length > 0) setUnloadingOptions(nextUnloadingOptions);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  const removeExistingFile = (fileId: number) => {
    setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const onFinish = async (values: CreateCargoPayload) => {
    if (!cargo) return;
    setSaving(true);
    try {
      let newFileIds: number[] = [];
      if (files.length > 0) {
        const uploaded = await filesApi.uploadFiles({
          files,
          types: files.map(() => "IMAGE"),
        });
        newFileIds = uploaded.map((x) => x.id);
      }

      const payload = normalizeCargoPayload(values);
      const updated = await cargoApi.updateCargo(cargo.id, {
        ...payload,
        bodyTypes: (values.bodyTypes ?? []).map(getBodyTypeLabel),
        loadingTypes: (values.loadingTypes ?? []).map(getLoadingTypeLabel),
        unloadingTypes: (values.unloadingTypes ?? []).map(getLoadingTypeLabel),
        comment: values.comment?.trim() || undefined,
        fileIds: [...existingFiles.map((file) => file.id), ...newFileIds],
      });
      message.success("Груз обновлён");
      navigate(`/cargo/${updated.id}`, { replace: true });
    } catch {
      message.error("Не удалось обновить груз");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="detail-page">
      <div className="detail-page-toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography.Link>
          <Link to={cargo ? `/cargo/${cargo.id}` : "/cargo"}>К грузу</Link>
        </Typography.Link>
      </div>

      <Typography.Title level={3}>Редактирование груза</Typography.Title>

      <Spin spinning={loading}>
        <Card className="form-card cargo-form-card">
          <Form<CreateCargoPayload> form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="name" label="Название" rules={[{ required: true, message: "Укажите название" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="bodyTypes" label="Тип кузова" rules={[{ type: "array", min: 1, required: true, message: "Выберите тип кузова" }]}>
              <Select mode="multiple" allowClear showSearch placeholder="Выберите типы кузова" options={bodyOptions} optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="loadingTypes" label="Тип погрузки" rules={[{ type: "array", min: 1, required: true, message: "Выберите тип погрузки" }]}>
              <Select mode="multiple" allowClear showSearch placeholder="Выберите типы погрузки" options={loadingOptions} optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="unloadingTypes" label="Тип разгрузки" rules={[{ type: "array", min: 1, required: true, message: "Выберите тип разгрузки" }]}>
              <Select mode="multiple" allowClear showSearch placeholder="Выберите типы разгрузки" options={unloadingOptions} optionFilterProp="label" />
            </Form.Item>

            <Typography.Title level={5}>Габариты и масса</Typography.Title>
            <Row gutter={16}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="length" label="Длина" rules={[{ required: true, message: "Укажите длину" }]}>
                  <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="width" label="Ширина" rules={[{ required: true, message: "Укажите ширину" }]}>
                  <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="height" label="Высота" rules={[{ required: true, message: "Укажите высоту" }]}>
                  <InputNumber min={0} step={0.01} addonAfter="м" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="weight" label="Вес" rules={[{ required: true, message: "Укажите вес" }]}>
                  <InputNumber min={0} step={0.01} addonAfter="кг" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="price" label="Цена" rules={[{ required: true, message: "Укажите цену" }]}>
                  <InputNumber min={0} step={0.01} addonAfter="руб" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5}>Адрес погрузки</Typography.Title>
            <AddressFields namePrefix={["loadingPlace"]} />

            <Typography.Title level={5}>Адрес разгрузки</Typography.Title>
            <AddressFields namePrefix={["unloadingPlace"]} />

            <Form.Item name="comment" label="Комментарий">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item label="Текущие фотографии">
              {existingFiles.length === 0 ? (
                <Typography.Text type="secondary">Фотографии не прикреплены</Typography.Text>
              ) : (
                <Image.PreviewGroup>
                  <div className="edit-photo-grid">
                    {existingFiles.map((file) => (
                      <div className="edit-photo-item" key={file.id}>
                        <Image className="edit-photo-image" src={file.url} alt={file.name || `Фото ${file.id}`} />
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeExistingFile(file.id)}
                        >
                          Открепить
                        </Button>
                      </div>
                    ))}
                  </div>
                </Image.PreviewGroup>
              )}
            </Form.Item>

            <Form.Item label="Добавить фотографии">
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
              <Button type="primary" htmlType="submit" loading={saving}>
                Сохранить
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};
