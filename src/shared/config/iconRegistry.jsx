import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  CalculatorOutlined,
  CarOutlined,
  CoffeeOutlined,
  ControlOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  GiftOutlined,
  LaptopOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  MinusOutlined,
  MobileOutlined,
  MoreOutlined,
  PieChartOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TagOutlined,
  TagsOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TransactionOutlined,
  WalletOutlined
} from "@ant-design/icons";

/**
 * Named icons the CMS can reference from plain configuration data.
 *
 * Config stores a string (`"savings"`), never a component, so it stays JSON
 * serialisable in Firestore. Anything unknown falls back to a neutral glyph
 * rather than crashing the menu.
 */
export const ICON_REGISTRY = {
  dashboard: DashboardOutlined,
  add: PlusOutlined,
  plus: PlusOutlined,
  minus: MinusOutlined,
  transactions: TransactionOutlined,
  budget: CalculatorOutlined,
  savings: SafetyCertificateOutlined,
  debt: CreditCardOutlined,
  reports: BarChartOutlined,
  analytics: PieChartOutlined,
  trend: LineChartOutlined,
  categories: TagsOutlined,
  tag: TagOutlined,
  users: TeamOutlined,
  settings: SettingOutlined,
  sliders: ControlOutlined,
  database: DatabaseOutlined,
  wallet: WalletOutlined,
  bank: BankOutlined,
  mobile: MobileOutlined,
  bell: BellOutlined,
  file: FileTextOutlined,
  gift: GiftOutlined,
  coffee: CoffeeOutlined,
  shopping: ShoppingOutlined,
  car: CarOutlined,
  medicine: MedicineBoxOutlined,
  laptop: LaptopOutlined,
  automation: ThunderboltOutlined,
  "arrow-up": ArrowUpOutlined,
  "arrow-down": ArrowDownOutlined,
  more: MoreOutlined,
  default: AppstoreOutlined
};

/** Names offered in the CMS icon picker. */
export const ICON_NAMES = Object.keys(ICON_REGISTRY).filter((name) => name !== "default");

/**
 * @param {string} name  Registry key.
 * @param {object} props Passed through to the antd icon (className, style…).
 */
export function renderIcon(name, props = {}) {
  const IconComponent = ICON_REGISTRY[name] || ICON_REGISTRY.default;
  return <IconComponent {...props} />;
}
