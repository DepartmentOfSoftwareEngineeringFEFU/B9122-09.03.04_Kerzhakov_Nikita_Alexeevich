export type CargoOption = {
  value: string;
  label: string;
};

export const bodyTypeOptions: CargoOption[] = [
  { value: "AWNING", label: "тентованный" },
  { value: "CONTAINER", label: "контейнер" },
  { value: "VAN", label: "фургон" },
  { value: "ALL_METAL", label: "цельнометал." },
  { value: "ISOTHERMAL", label: "изотермический" },
  { value: "REFRIGERATOR_MULTI_TEMP", label: "реф. мультирежимный" },
  { value: "REFRIGERATOR_WITH_PARTITION", label: "реф. с перегородкой" },
  { value: "REFRIGERATED_TRUCK", label: "реф.-тушевоз" },
  { value: "ON_BOARD", label: "бортовой" },
  { value: "OPEN_CONTAINER", label: "открытый контейнер" },
  { value: "PLATFORM_WITHOUT_SIDES", label: "площадка без бортов" },
  { value: "DUMP_TRUCK", label: "самосвал" },
  { value: "SCOW", label: "шаланда" },
  { value: "LOW_FRAME", label: "низкорамный" },
  { value: "LOW_PLATFORM", label: "низкорам.платф." },
  { value: "TELESCOPIC", label: "телескопический" },
  { value: "TRAWL", label: "трал" },
  { value: "BULK", label: "балковоз(негабарит)" },
  { value: "BUS", label: "автобус" },
  { value: "AUTOTOWER", label: "автовышка" },
  { value: "AUTO_TRANSPORTER", label: "автотранспортер" },
  { value: "CONCRETE_TRUCK", label: "бетоновоз" },
  { value: "BITUMEN_TRUCK", label: "битумовоз" },
  { value: "FUEL_TRUCKER", label: "бензовоз" },
  { value: "ALL_TERRAIN", label: "вездеход" },
  { value: "GAS_CARRIER", label: "газовоз" },
  { value: "GRAIN_CARRIER", label: "зерновоз" },
  { value: "HORSE_CARRIER", label: "коневоз" },
  { value: "CONTAINER_CARRIER", label: "контейнеровоз" },
  { value: "FEED_TRUCK", label: "кормовоз" },
  { value: "CRANE", label: "кран" },
  { value: "TIMBER_CARRIER", label: "лесовоз" },
  { value: "SCARP_TRUCK", label: "ломовоз" },
  { value: "MANIPULATOR", label: "манипулятор" },
  { value: "MINIBUS", label: "микроавтобус" },
  { value: "FLOUR_TRUCK", label: "муковоз" },
  { value: "PANEL_TRUCK", label: "панелевоз" },
  { value: "PICKUP_TRUCK", label: "пикап" },
  { value: "DOWN_TRUCK", label: "пухтовоз" },
  { value: "PYRAMID", label: "пирамида" },
  { value: "ROLL_TRUCK", label: "рулоновоз" },
  { value: "TRACTOR_TRUCK", label: "седельный тягач" },
  { value: "CATTLE_TRUCK", label: "скотовоз" },
  { value: "GLASS_CARRIER", label: "стекловоз" },
  { value: "PIPE_CARRIER", label: "трубовоз" },
  { value: "CEMENT_TRUCK", label: "цементовоз" },
  { value: "TANKER_TRUCK", label: "автоцистерна" },
  { value: "WOODCHIPPER_TRUCK", label: "щеповоз" },
  { value: "TOW_TRUCK", label: "эвакуатор" },
  { value: "CARGO_PASSENGER", label: "грузопассажирский" },
  { value: "STICK_CARRIER", label: "клюшковоз" },
  { value: "GARBAGE_TRUCK", label: "мусоровоз" },
  { value: "JUMBO", label: "jumbo" },
  { value: "TANK_CONTAINER_20", label: "20' танк-контейнер" },
  { value: "TANK_CONTAINER_40", label: "40' танк-контейнер" },
  { value: "MEGA_TRUCK", label: "мега фура" },
  { value: "DOPPELGANGER", label: "допельшток" },
  { value: "SLIDING_SEMI_TRAILER", label: "Раздвижной полуприцеп 20'/40'" },
];

export const loadingTypeOptions: CargoOption[] = [
  { value: "UPPER", label: "верхняя" },
  { value: "LATERAL", label: "боковая" },
  { value: "BACK", label: "задняя" },
  { value: "FULL_RASTERIZATION", label: "с полной растентовкой" },
  { value: "REMOVAL_CROSSBAR", label: "со снятием поперечных перекладин" },
  { value: "REMOVAL_RACKS", label: "со снятием стоек" },
  { value: "WITHOUT_GATE", label: "без ворот" },
  { value: "HYDROBOARD", label: "гидроборт" },
  { value: "RAMPS", label: "аппарели" },
  { value: "WITH_CRATE", label: "с обрешеткой" },
  { value: "WITH_SIDES", label: "с бортами" },
  { value: "SIDE_FROM_2_SIDES", label: "боковая с 2-х сторон" },
  { value: "FILLING", label: "налив" },
  { value: "ELECTRIC", label: "электрический" },
  { value: "HYDRAULIC", label: "гидравлический" },
  { value: "UNDEFINED", label: "не указан" },
  { value: "PNEUMATIC", label: "пневматический" },
  { value: "DIESEL_COMPRESSOR", label: "дизельный компрессор" },
];

export function toCargoOptions(items: { code: string; label: string }[] | null | undefined): CargoOption[] {
  return (items ?? []).map((item) => ({
    value: item.code,
    label: item.label,
  }));
}

const bodyTypeLabelByValue = new Map(bodyTypeOptions.map((option) => [option.value, option.label]));
const loadingTypeLabelByValue = new Map(
  loadingTypeOptions.map((option) => [option.value, option.label])
);
const bodyTypeValueByLabel = new Map(bodyTypeOptions.map((option) => [option.label, option.value]));
const loadingTypeValueByLabel = new Map(
  loadingTypeOptions.map((option) => [option.label, option.value])
);

export function getBodyTypeLabel(value: string) {
  return bodyTypeLabelByValue.get(value) ?? value;
}

export function getLoadingTypeLabel(value: string) {
  return loadingTypeLabelByValue.get(value) ?? value;
}

export function getBodyTypeValue(value: string) {
  return bodyTypeValueByLabel.get(value) ?? value;
}

export function getLoadingTypeValue(value: string) {
  return loadingTypeValueByLabel.get(value) ?? value;
}

function formatCargoOptions(values: string[] | null | undefined, labels: Map<string, string>) {
  if (!values || values.length === 0) return "—";
  return values.map((value) => labels.get(value) ?? value).join(", ");
}

export function formatBodyTypes(values: string[] | null | undefined) {
  return formatCargoOptions(values, bodyTypeLabelByValue);
}

export function formatLoadingTypes(values: string[] | null | undefined) {
  return formatCargoOptions(values, loadingTypeLabelByValue);
}
