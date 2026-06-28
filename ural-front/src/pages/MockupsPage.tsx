import {
  BellOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  LockOutlined,
  PlusOutlined,
  SaveOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Steps,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ReactNode } from "react";

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const screens = [
  "Вход",
  "Регистрация",
  "Транспорт",
  "Новый транспорт",
  "Карточка транспорта",
  "Редактирование транспорта",
  "Грузы",
  "Новый груз",
  "Карточка груза",
  "Редактирование груза",
  "Контракты",
  "Карточка контракта",
  "Уведомления",
  "Профиль",
  "Завершённые контракты",
];

const tags = ["Тент", "Рефрижератор", "Задняя загрузка"];

const getSlug = (value: string) => value.toLowerCase().split(" ").join("-");

const PreviewShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mockup-screen" id={getSlug(title)}>
    <div className="mockup-screen-caption">
      <Text type="secondary">Экран</Text>
      <Title level={4}>{title}</Title>
    </div>
    <div className="mockup-browser">
      {children}
    </div>
  </section>
);

const AppFrame = ({ active, children }: { active: string; children: ReactNode }) => (
  <Layout className="mockup-app-frame">
    <Header className="mockup-header">
      <div className="mockup-brand">CarGo</div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[active]}
        items={[
          { key: "cars", icon: <CarOutlined />, label: "Транспорт" },
          { key: "cargo", icon: <InboxOutlined />, label: "Грузы" },
          { key: "contracts", icon: <FileTextOutlined />, label: "Контракты" },
          {
            key: "notifications",
            icon: <Badge count={3} size="small"><BellOutlined /></Badge>,
            label: "Уведомления",
          },
        ]}
      />
      <Avatar icon={<UserOutlined />} />
    </Header>
    <Content className="mockup-frame-content">{children}</Content>
  </Layout>
);

const FilterCard = ({ type }: { type: "cars" | "cargo" }) => (
  <Card className="mockup-filter-card">
    <Row gutter={[12, 12]} align="bottom">
      <Col xs={24} md={6}>
        <Form.Item label={type === "cars" ? "Название" : "Груз"}>
          <Input prefix={<SearchOutlined />} placeholder={type === "cars" ? "Volvo" : "Паллеты"} />
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Откуда">
          <Input placeholder="Екатеринбург" />
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Куда">
          <Input placeholder="Казань" />
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Space>
          <Button type="primary">Применить</Button>
          <Button>Сбросить</Button>
        </Space>
      </Col>
      <Col span={24}>
        <Segmented options={["Все записи", "Мои записи"]} />
      </Col>
    </Row>
  </Card>
);

const VehicleCard = () => (
  <Card className="mockup-entity-card">
    <div className="mockup-entity-grid">
      <div className="mockup-photo mockup-photo-car" />
      <div>
        <div className="mockup-card-headline">
          <div>
            <Title level={5}>Volvo FH 540</Title>
            <Text type="secondary">VIN XW8ZZZ61ZDG000123</Text>
          </div>
          <Tag color="green">Фото проверено</Tag>
        </div>
        <Space wrap>{tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
        <Row gutter={[10, 10]} className="mockup-metrics">
          <Col span={8}><Metric label="Грузоподъёмность" value="20 т" /></Col>
          <Col span={8}><Metric label="Год" value="2021" /></Col>
          <Col span={8}><Metric label="Маршрут" value="ЕКБ - Казань" /></Col>
        </Row>
        <Space wrap>
          <Button type="primary">Откликнуться</Button>
          <Button icon={<EditOutlined />}>Изменить</Button>
          <Button danger icon={<DeleteOutlined />}>Удалить</Button>
        </Space>
      </div>
    </div>
  </Card>
);

const CargoCard = () => (
  <Card className="mockup-entity-card">
    <div className="mockup-entity-grid">
      <div className="mockup-photo mockup-photo-cargo" />
      <div>
        <div className="mockup-card-headline">
          <div>
            <Title level={5}>Промышленное оборудование</Title>
            <Text type="secondary">Екатеринбург - Пермь - Казань</Text>
          </div>
          <Tag color="blue">120 000 ₽</Tag>
        </div>
        <Row gutter={[10, 10]} className="mockup-metrics">
          <Col span={8}><Metric label="Вес" value="8.4 т" /></Col>
          <Col span={8}><Metric label="Объём" value="42 м³" /></Col>
          <Col span={8}><Metric label="Габариты" value="6 x 2.4 x 2.9" /></Col>
        </Row>
        <Timeline
          className="mockup-route"
          items={[
            { children: "Погрузка: Екатеринбург" },
            { children: "Точка: Пермь" },
            { children: "Разгрузка: Казань" },
          ]}
        />
        <Space wrap>
          <Button type="primary">Предложить транспорт</Button>
          <Button icon={<EditOutlined />}>Изменить</Button>
          <Button danger icon={<DeleteOutlined />}>Удалить</Button>
        </Space>
      </div>
    </div>
  </Card>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="mockup-metric">
    <Text type="secondary">{label}</Text>
    <Text strong>{value}</Text>
  </div>
);

const EntityForm = ({ kind, edit = false }: { kind: "car" | "cargo"; edit?: boolean }) => (
  <Card className="mockup-form-card">
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Form.Item label={kind === "car" ? "Тип" : "Название"}>
          {kind === "car" ? <Select value="Грузовой автомобиль" /> : <Input value="Промышленное оборудование" />}
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label={kind === "car" ? "Название" : "Вес"}>
          {kind === "car" ? <Input value="Volvo" /> : <InputNumber value={8400} addonAfter="кг" />}
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label={kind === "car" ? "Модель" : "Цена"}>
          {kind === "car" ? <Input value="FH 540" /> : <InputNumber value={120000} addonAfter="₽" />}
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Тип кузова">
          <Select mode="multiple" value={["Тент", "Рефрижератор"]} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Тип загрузки">
          <Select mode="multiple" value={["Задняя", "Боковая"]} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Город отправления">
          <Input value="Екатеринбург" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Город назначения">
          <Input value="Казань" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label={kind === "car" ? "Фотографии транспорта" : "Фотографии груза"}>
          <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
        </Form.Item>
      </Col>
    </Row>
    <Button type="primary" icon={edit ? <SaveOutlined /> : <PlusOutlined />}>
      {edit ? "Сохранить" : "Создать"}
    </Button>
  </Card>
);

const ContractCard = ({ detail = false }: { detail?: boolean }) => (
  <Card className="mockup-entity-card">
    <div className="mockup-card-headline">
      <div>
        <Title level={5}>Контракт #184: оборудование</Title>
        <Text type="secondary">Екатеринбург - Пермь - Казань</Text>
      </div>
      <Space wrap>
        <Tag color="processing">Согласование</Tag>
        <Text strong>118 000 ₽</Text>
      </Space>
    </div>
    <Row gutter={[14, 14]} className="mockup-metrics">
      <Col xs={24} md={8}><Metric label="Груз" value="8.4 т / 42 м³" /></Col>
      <Col xs={24} md={8}><Metric label="Транспорт" value="Volvo FH 540" /></Col>
      <Col xs={24} md={8}><Metric label="Создан" value="24.06.2026 10:42" /></Col>
    </Row>
    {detail && (
      <>
        <Divider />
        <Steps
          current={1}
          items={[
            { title: "Отклик" },
            { title: "Согласование" },
            { title: "В пути" },
            { title: "Завершён" },
          ]}
        />
      </>
    )}
    <Space wrap className="mockup-actions">
      <Button type="primary">Следующий статус</Button>
      <Button danger>Отклонить</Button>
    </Space>
  </Card>
);

const AuthScreen = ({ mode }: { mode: "login" | "register" }) => (
  <div className="mockup-auth">
    <Card className="mockup-auth-card" title={mode === "login" ? "Вход" : "Регистрация"}>
      <Form layout="vertical">
        {mode === "register" && (
          <>
            <Form.Item label="Имя"><Input prefix={<UserOutlined />} value="Никита" /></Form.Item>
            <Form.Item label="Фамилия"><Input value="Кержаков" /></Form.Item>
          </>
        )}
        <Form.Item label="Логин"><Input prefix={<UserOutlined />} value="driver@example.ru" /></Form.Item>
        <Form.Item label="Пароль"><Input.Password prefix={<LockOutlined />} value="password" /></Form.Item>
        <Button type="primary" block>{mode === "login" ? "Войти" : "Зарегистрироваться"}</Button>
      </Form>
      <Text type="secondary">{mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Вход"}</Text>
    </Card>
  </div>
);

export const MockupsPage = () => (
  <div className="mockups-page">
    <aside className="mockups-sidebar">
      <Title level={3}>Макеты CarGo</Title>
      <Text type="secondary">Все основные экраны системы в одном обзорном каталоге.</Text>
      <nav>
        {screens.map((screen) => (
          <a key={screen} href={`#${getSlug(screen)}`}>
            {screen}
          </a>
        ))}
      </nav>
    </aside>

    <main className="mockups-main">
      <PreviewShell title="Вход"><AuthScreen mode="login" /></PreviewShell>
      <PreviewShell title="Регистрация"><AuthScreen mode="register" /></PreviewShell>

      <PreviewShell title="Транспорт">
        <AppFrame active="cars">
          <div className="mockup-toolbar"><Title level={3}>Транспорт</Title><Button type="primary" icon={<PlusOutlined />}>Новый транспорт</Button></div>
          <FilterCard type="cars" />
          <VehicleCard />
          <Pagination current={1} total={48} />
        </AppFrame>
      </PreviewShell>

      <PreviewShell title="Новый транспорт"><AppFrame active="cars"><Title level={3}>Новый транспорт</Title><EntityForm kind="car" /></AppFrame></PreviewShell>
      <PreviewShell title="Карточка транспорта"><AppFrame active="cars"><Title level={3}>Volvo FH 540</Title><VehicleCard /></AppFrame></PreviewShell>
      <PreviewShell title="Редактирование транспорта"><AppFrame active="cars"><Title level={3}>Редактирование транспорта</Title><EntityForm kind="car" edit /></AppFrame></PreviewShell>

      <PreviewShell title="Грузы">
        <AppFrame active="cargo">
          <div className="mockup-toolbar"><Title level={3}>Грузы</Title><Button type="primary" icon={<PlusOutlined />}>Новый груз</Button></div>
          <FilterCard type="cargo" />
          <CargoCard />
          <Pagination current={1} total={32} />
        </AppFrame>
      </PreviewShell>

      <PreviewShell title="Новый груз"><AppFrame active="cargo"><Title level={3}>Новый груз</Title><EntityForm kind="cargo" /></AppFrame></PreviewShell>
      <PreviewShell title="Карточка груза"><AppFrame active="cargo"><Title level={3}>Промышленное оборудование</Title><CargoCard /></AppFrame></PreviewShell>
      <PreviewShell title="Редактирование груза"><AppFrame active="cargo"><Title level={3}>Редактирование груза</Title><EntityForm kind="cargo" edit /></AppFrame></PreviewShell>

      <PreviewShell title="Контракты">
        <AppFrame active="contracts">
          <Title level={3}>Контракты</Title>
          <ContractCard />
          <ContractCard />
        </AppFrame>
      </PreviewShell>

      <PreviewShell title="Карточка контракта"><AppFrame active="contracts"><Title level={3}>Контракт #184</Title><ContractCard detail /></AppFrame></PreviewShell>

      <PreviewShell title="Уведомления">
        <AppFrame active="notifications">
          <Title level={3}>Уведомления</Title>
          <List
            className="mockup-list"
            dataSource={[
              ["Новый отклик на груз", "Водитель предложил Volvo FH 540 для перевозки."],
              ["Статус контракта изменён", "Контракт #184 перешёл на этап согласования."],
            ]}
            renderItem={([title, body], index) => (
              <List.Item actions={[<Button type="link" icon={<CheckCircleOutlined />}>Прочитано</Button>]}>
                <List.Item.Meta avatar={<BellOutlined />} title={<Space><Text strong>{title}</Text><Tag color={index === 0 ? "blue" : undefined}>{index === 0 ? "Новое" : "Прочитано"}</Tag></Space>} description={body} />
              </List.Item>
            )}
          />
        </AppFrame>
      </PreviewShell>

      <PreviewShell title="Профиль">
        <AppFrame active="">
          <Title level={3}>Профиль</Title>
          <Card className="mockup-form-card">
            <Row gutter={20}>
              <Col xs={24} md={8}>
                <div className="mockup-avatar-editor"><Avatar size={96} icon={<UserOutlined />} /><Button icon={<UploadOutlined />}>Загрузить фото</Button></div>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={12}>
                  <Col span={12}><Form.Item label="Имя"><Input value="Никита" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Фамилия"><Input value="Кержаков" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Email"><Input value="driver@example.ru" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Телефон"><Input value="+7 900 000-00-00" /></Form.Item></Col>
                </Row>
                <Button type="primary" icon={<SaveOutlined />}>Сохранить</Button>
              </Col>
            </Row>
          </Card>
        </AppFrame>
      </PreviewShell>

      <PreviewShell title="Завершённые контракты">
        <AppFrame active="contracts">
          <Title level={3}>Завершённые контракты пользователя</Title>
          <ContractCard />
          <Tag color="success">3 завершённых сделки</Tag>
        </AppFrame>
      </PreviewShell>
    </main>
  </div>
);
