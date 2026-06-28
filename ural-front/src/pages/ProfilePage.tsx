import {
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Spin,
  Typography,
  Upload,
  message,
} from "antd";
import type { RcFile } from "antd/es/upload";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as filesApi from "../api/files.api";
import * as usersApi from "../api/users.api";
import { getCurrentUserUuid } from "../auth/currentUser";
import type { AvatarRequest, UserDto, UserRequest } from "../types/domain";

type ProfileFormValues = Omit<UserRequest, "avatar">;

type CropState = {
  cropX: number;
  cropY: number;
  cropSize: number;
};

type ImageInfo = {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
};

type DragState = {
  mode: "move" | "resize";
  startX: number;
  startY: number;
  crop: CropState;
};

const DEFAULT_CROP: CropState = {
  cropX: 0,
  cropY: 0,
  cropSize: 240,
};

const toAvatarRequest = (avatar?: AvatarRequest | null): AvatarRequest | null => {
  if (!avatar?.photoId || !avatar.photoThumbnailId) return null;
  return {
    photoId: avatar.photoId,
    photoThumbnailId: avatar.photoThumbnailId,
    cropX: avatar.cropX ?? 0,
    cropY: avatar.cropY ?? 0,
    cropSize: avatar.cropSize ?? DEFAULT_CROP.cropSize,
  };
};

const clampCrop = (next: CropState, info: ImageInfo): CropState => {
  const maxSize = Math.max(1, Math.min(info.naturalWidth, info.naturalHeight));
  const cropSize = Math.round(Math.min(Math.max(next.cropSize, 1), maxSize));
  const maxX = Math.max(0, info.naturalWidth - cropSize);
  const maxY = Math.max(0, info.naturalHeight - cropSize);

  return {
    cropX: Math.round(Math.min(Math.max(next.cropX, 0), maxX)),
    cropY: Math.round(Math.min(Math.max(next.cropY, 0), maxY)),
    cropSize,
  };
};

const getCenteredCrop = (info: ImageInfo): CropState => {
  const cropSize = Math.round(Math.min(info.naturalWidth, info.naturalHeight) * 0.72);
  return clampCrop(
    {
      cropSize,
      cropX: (info.naturalWidth - cropSize) / 2,
      cropY: (info.naturalHeight - cropSize) / 2,
    },
    info
  );
};

const fileNameFromUrl = (url: string) => {
  const path = url.split("?")[0];
  const name = path.substring(path.lastIndexOf("/") + 1);
  return name || "avatar";
};

const loadFileFromUrl = async (url: string): Promise<File> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load avatar image");
  }

  const blob = await response.blob();
  return new File([blob], fileNameFromUrl(url), {
    type: blob.type || "image/jpeg",
  });
};

export const ProfilePage = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const uuid = useMemo(() => getCurrentUserUuid(), []);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState>(DEFAULT_CROP);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [resetCropOnLoad, setResetCropOnLoad] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);

  const previewUrl = localAvatarUrl ?? avatarUrl;
  const cropScale = imageInfo
    ? imageInfo.renderedWidth / imageInfo.naturalWidth
    : 1;

  const updateImageMeasurements = useCallback(() => {
    const img = imageRef.current;
    if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return;
    const rect = img.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const nextInfo = {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: rect.width,
      renderedHeight: rect.height,
    };

    setImageInfo(nextInfo);
    setCrop((prev) =>
      resetCropOnLoad ? getCenteredCrop(nextInfo) : clampCrop(prev, nextInfo)
    );
    setResetCropOnLoad(false);
  }, [resetCropOnLoad]);

  useEffect(() => {
    if (!uuid) {
      setLoading(false);
      message.error("Не удалось определить пользователя из токена");
      return;
    }

    let alive = true;
    setLoading(true);
    usersApi
      .getUserByUuid(uuid)
      .then(async (data) => {
        if (!alive) return;
        setUser(data);
        form.setFieldsValue({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          patronymic: data.patronymic ?? "",
          phoneNumber: data.phoneNumber ?? "",
        });
        setCrop({
          cropX: data.avatar?.cropX ?? DEFAULT_CROP.cropX,
          cropY: data.avatar?.cropY ?? DEFAULT_CROP.cropY,
          cropSize: data.avatar?.cropSize ?? DEFAULT_CROP.cropSize,
        });

        const photoIds = [data.avatar?.photoId, data.avatar?.photoThumbnailId].filter(
          (x): x is number => typeof x === "number"
        );
        if (photoIds.length === 0) {
          setAvatarUrl(null);
          return;
        }

        try {
          const files = await filesApi.getFiles(photoIds);
          if (!alive) return;
          const photo =
            files.find((file) => file.id === data.avatar?.photoId) ?? files[0];
          setAvatarUrl(photo?.url ?? null);
        } catch {
          if (alive) setAvatarUrl(null);
        }
      })
      .catch(() => {
        message.error("Не удалось загрузить профиль");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [form, uuid]);

  useEffect(() => {
    return () => {
      if (localAvatarUrl) URL.revokeObjectURL(localAvatarUrl);
    };
  }, [localAvatarUrl]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const resizeObserver = new ResizeObserver(() => updateImageMeasurements());
    resizeObserver.observe(img);
    return () => resizeObserver.disconnect();
  }, [previewUrl, updateImageMeasurements]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !imageInfo) return;

      const scale = imageInfo.naturalWidth / imageInfo.renderedWidth;
      const deltaX = (event.clientX - drag.startX) * scale;
      const deltaY = (event.clientY - drag.startY) * scale;

      if (drag.mode === "move") {
        const nextX = drag.crop.cropX + deltaX;
        const nextY = drag.crop.cropY + deltaY;
        setCrop(clampCrop({ ...drag.crop, cropX: nextX, cropY: nextY }, imageInfo));
        return;
      }

      const sizeDelta = Math.max(deltaX, deltaY);
      setCrop(
        clampCrop(
          { ...drag.crop, cropSize: drag.crop.cropSize + sizeDelta },
          imageInfo
        )
      );
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [imageInfo]);

  const handleSelectAvatar = (file: RcFile) => {
    setSelectedFile(file);
    setAvatarEditing(true);
    setResetCropOnLoad(true);
    setLocalAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    return false;
  };

  const getCropBoxStyle = (): React.CSSProperties => ({
    left: crop.cropX * cropScale,
    top: crop.cropY * cropScale,
    width: crop.cropSize * cropScale,
    height: crop.cropSize * cropScale,
  });

  const startDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    mode: DragState["mode"]
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      crop,
    };
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!uuid || !user) return;
    setSaving(true);
    try {
      let avatar = toAvatarRequest(user.avatar);
      const shouldRegenerateAvatar = selectedFile || (avatarEditing && previewUrl);

      if (shouldRegenerateAvatar) {
        const avatarFile = selectedFile ?? (await loadFileFromUrl(previewUrl as string));
        avatar = await filesApi.uploadAvatar({
          file: avatarFile,
          metadata: crop,
        });
      } else if (avatar) {
        avatar = {
          ...avatar,
          ...crop,
        };
      }

      const updated = await usersApi.updateUser(uuid, {
        email: values.email.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        patronymic: values.patronymic?.trim() || "",
        phoneNumber: values.phoneNumber?.trim() || "",
        avatar,
      });

      setUser(updated);
      setSelectedFile(null);
      setAvatarEditing(false);
      if (shouldRegenerateAvatar && updated.avatar?.photoId) {
        try {
          const files = await filesApi.getFiles([updated.avatar.photoId]);
          setAvatarUrl(files[0]?.url ?? null);
          setLocalAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        } catch {
          setAvatarUrl(localAvatarUrl);
        }
      } else if (!updated.avatar?.photoId) {
        setAvatarUrl(null);
        setLocalAvatarUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
      window.dispatchEvent(new Event("profile-updated"));
      message.success("Профиль сохранён");
    } catch {
      message.error("Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  };

  if (!uuid) {
    return (
      <Card>
        <Typography.Text type="danger">
          Не удалось определить пользователя из токена.
        </Typography.Text>
      </Card>
    );
  }

  return (
    <div className="detail-page profile-page">
      <div className="profile-page-header">
        <Typography.Title level={3} style={{ margin: 0 }}>
          Профиль
        </Typography.Title>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} lg={10}>
            <Card className="profile-avatar-card" title="Аватар">
              {previewUrl ? (
                <div className="profile-avatar-cropper">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Исходное изображение аватара"
                    className="profile-avatar-source"
                    onLoad={updateImageMeasurements}
                    draggable={false}
                  />
                  {avatarEditing && imageInfo && (
                    <div
                      className="profile-avatar-crop-box"
                      style={getCropBoxStyle()}
                      onPointerDown={(event) => startDrag(event, "move")}
                    >
                      <div
                        className="profile-avatar-crop-handle"
                        onPointerDown={(event) => startDrag(event, "resize")}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="profile-avatar-empty">
                  <UserOutlined />
                </div>
              )}

              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={handleSelectAvatar}
              >
                <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
                  Выбрать аватар
                </Button>
              </Upload>
              {previewUrl && (
                <Button
                  icon={<EditOutlined />}
                  style={{ marginTop: 16, marginLeft: 12 }}
                  onClick={() => {
                    setAvatarEditing((prev) => !prev);
                    window.requestAnimationFrame(updateImageMeasurements);
                  }}
                >
                  {avatarEditing ? "Скрыть настройку" : "Настроить обрезку"}
                </Button>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card className="form-card">
              <Form<ProfileFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleSubmit}
                autoComplete="on"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Введите email" },
                    { type: "email", message: "Некорректный email" },
                  ]}
                >
                  <Input autoComplete="email" />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  label="Фамилия"
                  rules={[{ required: true, message: "Введите фамилию" }]}
                >
                  <Input autoComplete="family-name" />
                </Form.Item>
                <Form.Item
                  name="firstName"
                  label="Имя"
                  rules={[{ required: true, message: "Введите имя" }]}
                >
                  <Input autoComplete="given-name" />
                </Form.Item>
                <Form.Item name="patronymic" label="Отчество">
                  <Input />
                </Form.Item>
                <Form.Item name="phoneNumber" label="Телефон">
                  <Input autoComplete="tel" />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Сохранить
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
