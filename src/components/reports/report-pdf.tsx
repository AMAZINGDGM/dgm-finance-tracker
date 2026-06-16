import {
  Circle,
  Document,
  Line,
  Page,
  Polyline,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View
} from "@react-pdf/renderer";

import type { DashboardData, RecentTransactionItem } from "@/lib/finance/dashboard";
import { formatCompactCurrency, formatCurrency } from "@/lib/finance/format";
import type { ReportsData } from "@/lib/finance/reports";

type ReportPDFProps = {
  kind: "monthly" | "yearly";
  dashboard: DashboardData;
  reports: ReportsData;
};

type KpiItem = {
  helper: string;
  label: string;
  tone?: "blue" | "green" | "navy" | "rose";
  value: string;
};

type TrendPoint = {
  expense: number;
  income: number;
  label: string;
  savings?: number;
};

type CategoryDatum = {
  color?: string;
  name: string;
  value: number;
};

const palette = {
  card: "#07111F",
  cardSoft: "#0B1220",
  cyan: "#22D3EE",
  cyanDeep: "#0891B2",
  cyanLight: "#CFFAFE",
  green: "#22C55E",
  greenSoft: "#86EFAC",
  ink: "#F8FAFC",
  line: "#1E293B",
  muted: "#94A3B8",
  navy: "#020617",
  paper: "#F8FAFC",
  rose: "#FB7185",
  roseDeep: "#F43F5E",
  slate50: "#0F172A",
  slate100: "#111827",
  slate200: "#1E293B",
  slate300: "#334155",
  slate600: "#CBD5E1",
  violet: "#818CF8"
};

const chartPalette = ["#22D3EE", "#818CF8", "#22C55E", "#FB7185", "#94A3B8", "#38BDF8"];

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.navy,
    color: palette.ink,
    fontFamily: "Helvetica",
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 12
  },
  hero: {
    backgroundColor: "#07111F",
    borderColor: "#164E63",
    borderRadius: 16,
    borderWidth: 1,
    color: palette.paper,
    marginBottom: 8,
    padding: 10
  },
  heroLayout: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroContent: {
    flex: 1,
    marginRight: 18
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  logo: {
    alignItems: "center",
    backgroundColor: "#0E7490",
    borderColor: "#67E8F9",
    borderWidth: 0.8,
    borderRadius: 12,
    height: 28,
    justifyContent: "center",
    marginRight: 10,
    width: 28
  },
  logoText: {
    color: palette.paper,
    fontSize: 12,
    fontWeight: 700
  },
  brand: {
    color: palette.cyanLight,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.25,
    textTransform: "uppercase"
  },
  brandName: {
    color: palette.paper,
    fontSize: 10,
    fontWeight: 700,
    marginTop: 2
  },
  badge: {
    backgroundColor: "#0B1220",
    borderColor: "#155E75",
    borderRadius: 999,
    borderWidth: 1,
    color: palette.cyanLight,
    fontSize: 7.4,
    fontWeight: 700,
    letterSpacing: 0.08,
    marginBottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    color: palette.paper,
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 7.8,
    lineHeight: 1.28,
    width: "100%"
  },
  heroMeta: {
    alignItems: "stretch",
    backgroundColor: "#0B1220",
    borderColor: "#164E63",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: 200
  },
  metaGroup: {
    marginTop: 0
  },
  metaDivider: {
    backgroundColor: "#1E293B",
    height: 1,
    marginVertical: 8
  },
  metaLabel: {
    color: "#94A3B8",
    fontSize: 6.8,
    fontWeight: 700,
    letterSpacing: 0.08,
    textTransform: "uppercase"
  },
  metaValue: {
    color: palette.paper,
    fontSize: 9.8,
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: 4
  },
  section: {
    marginBottom: 4
  },
  sectionCard: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 13,
    borderWidth: 1,
    padding: 6.2
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: 700
  },
  sectionEyebrow: {
    color: palette.cyan,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.22,
    textTransform: "uppercase"
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4
  },
  kpiCard: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 3,
    marginRight: 5,
    minHeight: 38,
    padding: 5.6,
    width: "31.9%"
  },
  kpiLabel: {
    color: palette.muted,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.18,
    textTransform: "uppercase"
  },
  kpiValue: {
    color: palette.ink,
    fontSize: 10,
    fontWeight: 700,
    marginTop: 4
  },
  kpiHelper: {
    color: palette.muted,
    fontSize: 6.8,
    lineHeight: 1.25,
    marginTop: 3
  },
  insight: {
    backgroundColor: "#07111F",
    borderColor: "#164E63",
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 4,
    padding: 6
  },
  insightTitle: {
    color: palette.cyan,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.22,
    marginBottom: 5,
    textTransform: "uppercase"
  },
  insightText: {
    color: "#CBD5E1",
    fontSize: 7.8,
    lineHeight: 1.35
  },
  row: {
    flexDirection: "row"
  },
  twoColumns: {
    flexDirection: "row",
    marginBottom: 4
  },
  leftColumn: {
    flex: 1,
    marginRight: 7
  },
  rightColumn: {
    flex: 1
  },
  legend: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 5
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: 12
  },
  legendDot: {
    borderRadius: 999,
    height: 6,
    marginRight: 4,
    width: 6
  },
  legendText: {
    color: palette.muted,
    fontSize: 7.2
  },
  chartFooter: {
    color: palette.muted,
    fontSize: 7.2,
    lineHeight: 1.35,
    marginTop: 4
  },
  categoryRow: {
    marginBottom: 4
  },
  categoryLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3
  },
  categoryName: {
    color: palette.ink,
    fontSize: 8.2,
    fontWeight: 700,
    width: "46%"
  },
  categoryAmount: {
    color: palette.slate600,
    fontSize: 7.2,
    textAlign: "right",
    width: "36%"
  },
  categoryPercent: {
    color: palette.muted,
    fontSize: 7.2,
    textAlign: "right",
    width: "18%"
  },
  track: {
    backgroundColor: "#111827",
    borderRadius: 999,
    height: 5,
    overflow: "hidden"
  },
  fill: {
    borderRadius: 999,
    height: 5
  },
  table: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 11,
    borderWidth: 1,
    overflow: "hidden"
  },
  tableRow: {
    flexDirection: "row"
  },
  breakdownGrid: {
    flexDirection: "row"
  },
  breakdownColumn: {
    flex: 1,
    marginRight: 7
  },
  breakdownColumnLast: {
    flex: 1
  },
  headerCell: {
    backgroundColor: "#0B1220",
    color: palette.paper,
    fontSize: 6.9,
    fontWeight: 700,
    lineHeight: 1.25,
    paddingHorizontal: 6,
    paddingVertical: 3.1,
    textTransform: "uppercase"
  },
  cell: {
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    color: "#CBD5E1",
    fontSize: 6.9,
    lineHeight: 1.25,
    paddingHorizontal: 6,
    paddingVertical: 2.9
  },
  cellMuted: {
    color: palette.muted
  },
  cellIncome: {
    color: palette.green,
    fontWeight: 700
  },
  cellExpense: {
    color: palette.rose,
    fontWeight: 700
  },
  miniGrid: {
    flexDirection: "row",
    marginTop: 4
  },
  miniCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: 6,
    padding: 5.4
  },
  miniLabel: {
    color: palette.muted,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.12,
    textTransform: "uppercase"
  },
  miniValue: {
    color: palette.ink,
    fontSize: 9.2,
    fontWeight: 700,
    marginTop: 3
  },
  footer: {
    borderTopColor: "#164E63",
    borderTopWidth: 1,
    bottom: 10,
    color: palette.muted,
    fontSize: 7,
    left: 18,
    paddingTop: 5,
    position: "absolute",
    right: 18
  }
});

function money(value: number) {
  return formatCurrency(Number(value || 0));
}

function compact(value: number) {
  return formatCompactCurrency(Number(value || 0));
}

function compactMoney(value: number) {
  const number = Number(value || 0);
  return `${number < 0 ? "-" : ""}Rp ${compact(Math.abs(number))}`;
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function chartColor(index: number, color?: string) {
  return color && /^#[0-9A-F]{6}$/i.test(color) ? color : chartPalette[index % chartPalette.length];
}

function KpiGrid({ items }: { items: KpiItem[] }) {
  const toneStyle = {
    blue: { borderLeftColor: palette.cyan, borderLeftWidth: 3 },
    green: { borderLeftColor: palette.green, borderLeftWidth: 3 },
    navy: { borderLeftColor: palette.ink, borderLeftWidth: 3 },
    rose: { borderLeftColor: palette.rose, borderLeftWidth: 3 }
  };

  return (
    <View style={styles.kpiGrid} wrap={false}>
      {items.map((item) => (
        <View key={item.label} style={[styles.kpiCard, toneStyle[item.tone ?? "navy"]]}>
          <Text style={styles.kpiLabel}>{item.label}</Text>
          <Text style={styles.kpiValue}>{item.value}</Text>
          <Text style={styles.kpiHelper}>{item.helper}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({
  children,
  eyebrow,
  keepTogether = true,
  title
}: {
  children: React.ReactNode;
  eyebrow?: string;
  keepTogether?: boolean;
  title: string;
}) {
  return (
    <View style={styles.section} wrap={!keepTogether}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

function ExecutiveInsight({ children, title }: { children: string; title: string }) {
  return (
    <View style={styles.insight} wrap={false}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightText}>{children}</Text>
    </View>
  );
}

function TrendChart({
  data,
  keys,
  note
}: {
  data: TrendPoint[];
  keys: { color: string; key: keyof TrendPoint; label: string }[];
  note: string;
}) {
  const width = 500;
  const height = 86;
  const left = 28;
  const right = 10;
  const top = 10;
  const bottom = 16;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = data.flatMap((item) =>
    keys.map(({ key }) => (typeof item[key] === "number" ? Number(item[key]) : 0))
  );
  const max = Math.max(1, ...values);
  const xFor = (index: number) =>
    data.length <= 1 ? left : left + (index / (data.length - 1)) * chartWidth;
  const yFor = (value: number) => top + chartHeight - (value / max) * chartHeight;

  return (
    <View>
      <View style={styles.legend}>
        {keys.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
        <Text style={styles.legendText}>Peak: {compact(max)}</Text>
      </View>
      <Svg width={500} height={86} viewBox={`0 0 ${width} ${height}`}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={10}
          fill="#07111F"
          stroke="#1E293B"
          strokeWidth={1}
        />
        {[0, 1, 2, 3].map((line) => {
          const y = top + (line / 3) * chartHeight;
          return (
            <Line
              key={`grid-${line}`}
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="#172033"
              strokeWidth={0.8}
            />
          );
        })}
        {keys.map((item) => {
          const points = data
            .map((datum, index) => {
              const value = typeof datum[item.key] === "number" ? Number(datum[item.key]) : 0;
              return `${xFor(index)},${yFor(value)}`;
            })
            .join(" ");

          return (
            <Polyline
              key={item.label}
              fill="none"
              points={points}
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
          );
        })}
        {data.map((item, index) => (
          <Circle
            key={`dot-${item.label}-${index}`}
            cx={xFor(index)}
            cy={yFor(Number(item.income || 0))}
            fill={palette.green}
            r={2.2}
          />
        ))}
      </Svg>
      <View style={[styles.row, { justifyContent: "space-between", marginTop: 4 }]}>
        {data.map((item) => (
          <Text key={item.label} style={[styles.legendText, { width: `${100 / data.length}%` }]}>
            {item.label}
          </Text>
        ))}
      </View>
      <Text style={styles.chartFooter}>{note}</Text>
    </View>
  );
}

function CategoryBars({
  categories,
  emptyLabel = "No category data yet."
}: {
  categories: CategoryDatum[];
  emptyLabel?: string;
}) {
  const rows = categories.filter((item) => item.value > 0).slice(0, 6);
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(1, ...rows.map((item) => item.value));

  if (rows.length === 0) {
    return <Text style={styles.insightText}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {rows.map((item, index) => {
        const share = total > 0 ? (item.value / total) * 100 : 0;
        const width = Math.max(4, (item.value / max) * 100);
        const color = chartColor(index, item.color);

        return (
          <View key={item.name} style={styles.categoryRow}>
            <View style={styles.categoryLine}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryAmount}>{money(item.value)}</Text>
              <Text style={styles.categoryPercent}>{share.toFixed(1)}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { backgroundColor: color, width: `${width}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SavingsBars({ data }: { data: { label: string; savings: number }[] }) {
  const max = Math.max(1, ...data.map((item) => Math.abs(item.savings)));

  return (
    <View>
      <View style={[styles.row, { alignItems: "flex-end", height: 48 }]}>
        {data.slice(0, 12).map((item) => {
          const isNegative = item.savings < 0;
          const height = Math.max(5, (Math.abs(item.savings) / max) * 42);

          return (
            <View key={item.label} style={{ alignItems: "center", flex: 1 }}>
              <View
                style={{
                  backgroundColor: isNegative ? palette.rose : palette.cyan,
                  borderRadius: 4,
                  height,
                  width: 10
                }}
              />
              <Text style={[styles.legendText, { marginTop: 4 }]}>{item.label.slice(0, 3)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.chartFooter}>Positive bars show saved cashflow; rose bars indicate months where spending exceeded income.</Text>
    </View>
  );
}

function Table({
  headers,
  rows,
  widths
}: {
  headers: string[];
  rows: (string | { tone?: "expense" | "income"; value: string })[][];
  widths: string[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableRow} wrap={false}>
        {headers.map((header, index) => (
          <Text
            key={header}
            style={[
              styles.headerCell,
              { textAlign: index === headers.length - 1 ? "right" : "left", width: widths[index] }
            ]}
          >
            {header}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { width: "100%" }]}>No data available.</Text>
        </View>
      ) : (
        rows.map((row, rowIndex) => (
          <View
            key={`${rowIndex}-${row.map((cell) => (typeof cell === "string" ? cell : cell.value)).join("-")}`}
            style={[
              styles.tableRow,
              rowIndex % 2 === 1 ? { backgroundColor: palette.slate50 } : {}
            ]}
            wrap={false}
          >
            {row.map((cell, index) => {
              const value = typeof cell === "string" ? cell : cell.value;
              const tone = typeof cell === "string" ? undefined : cell.tone;

              return (
                <Text
                  key={`${value}-${index}`}
                  style={[
                    styles.cell,
                    { textAlign: index === row.length - 1 ? "right" : "left", width: widths[index] },
                    tone === "income" ? styles.cellIncome : {},
                    tone === "expense" ? styles.cellExpense : {}
                  ]}
                >
                  {value}
                </Text>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}

function TransactionTable({ transactions }: { transactions: RecentTransactionItem[] }) {
  return (
    <Table
      headers={["Date", "Transaction", "Category", "Account", "Amount"]}
      widths={["14%", "31%", "19%", "17%", "19%"]}
      rows={transactions.slice(0, 10).map((transaction) => [
        transaction.date,
        transaction.title,
        transaction.category,
        transaction.account,
        {
          tone: transaction.type === "income" ? "income" : transaction.type === "expense" ? "expense" : undefined,
          value: `${transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}${money(
            transaction.amount
          )}`
        }
      ])}
    />
  );
}

function TrendTable({ rows }: { rows: { expense: number; income: number; label: string; savings: number }[] }) {
  return (
    <Table
      headers={["Period", "Income", "Expense", "Savings"]}
      widths={["20%", "27%", "27%", "26%"]}
      rows={rows.map((item) => [
        item.label,
        { tone: "income", value: money(item.income) },
        { tone: "expense", value: money(item.expense) },
        { tone: item.savings >= 0 ? "income" : "expense", value: money(item.savings) }
      ])}
    />
  );
}

function YearlyMonthlyBreakdownTable({
  rows
}: {
  rows: { expense: number; income: number; label: string; savings: number }[];
}) {
  const tableRows = rows.map((item) => [
    item.label,
    { tone: "income" as const, value: compactMoney(item.income) },
    { tone: "expense" as const, value: compactMoney(item.expense) },
    { tone: item.savings >= 0 ? ("income" as const) : ("expense" as const), value: compactMoney(item.savings) }
  ]);

  return (
    <View style={styles.breakdownGrid} wrap={false}>
      <View style={styles.breakdownColumn}>
        <Table
          headers={["Month", "Income", "Expense", "Savings"]}
          rows={tableRows.slice(0, 6)}
          widths={["18%", "27%", "27%", "28%"]}
        />
      </View>
      <View style={styles.breakdownColumnLast}>
        <Table
          headers={["Month", "Income", "Expense", "Savings"]}
          rows={tableRows.slice(6, 12)}
          widths={["18%", "27%", "27%", "28%"]}
        />
      </View>
    </View>
  );
}

function GoalsTable({ reports }: { reports: ReportsData }) {
  return (
    <Table
      headers={["Goal", "Current", "Target", "Progress"]}
      widths={["38%", "22%", "22%", "18%"]}
      rows={reports.yearly.goals.slice(0, 6).map((goal) => {
        const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
        return [goal.name, money(goal.current), money(goal.target), percent(progress)];
      })}
    />
  );
}

function YearlyClosingSummary({ reports }: { reports: ReportsData }) {
  const positiveYear = reports.yearly.savings >= 0;
  const focusCategory = reports.yearly.categoryBreakdown.find((category) => category.value > 0)?.name ?? "No category pattern";
  const nextAction = positiveYear ? "Protect savings rate" : "Review spending plan";

  return (
    <Section eyebrow="Closing Summary" title="Annual Closing Notes">
      <View style={styles.miniGrid}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Financial Direction</Text>
          <Text style={styles.miniValue}>{positiveYear ? "Positive" : "Needs Review"}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Category Recap</Text>
          <Text style={styles.miniValue}>{focusCategory}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Next Action</Text>
          <Text style={styles.miniValue}>{nextAction}</Text>
        </View>
      </View>
      <Text style={styles.chartFooter}>
        Use this closing view to compare the strongest saving month against the highest spending period, then tune next
        month's category limits before new transactions accumulate.
      </Text>
    </Section>
  );
}

function Header({ kind, reports }: { kind: "monthly" | "yearly"; reports: ReportsData }) {
  const title = kind === "monthly" ? "DFT Monthly Finance Report" : "DFT Yearly Finance Report";
  const period = kind === "monthly" ? reports.monthly.label : String(reports.yearly.year);
  const summary =
    kind === "monthly"
      ? `${money(reports.monthly.netSavings)} net savings with ${reports.monthly.savingsRate}% savings rate.`
      : `${money(reports.yearly.savings)} total savings across ${reports.yearly.year}.`;

  return (
    <View style={styles.hero} wrap={false}>
      <View style={styles.heroLayout}>
        <View style={styles.heroContent}>
          <View style={styles.heroTop}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>DFT</Text>
              </View>
              <View>
                <Text style={styles.brand}>Dgm Finance Tracker</Text>
                <Text style={styles.brandName}>AI-powered personal finance dashboard</Text>
              </View>
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{summary}</Text>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.badge}>Executive Report</Text>
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Reporting Period</Text>
            <Text style={styles.metaValue}>{period}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>{reports.generatedAt}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MonthlyPDF({ dashboard, reports }: Omit<ReportPDFProps, "kind">) {
  const monthlyTrend = dashboard.incomeExpenseTrend.map((item) => ({
    expense: item.expense,
    income: item.income,
    label: item.name,
    savings: item.income - item.expense
  }));

  return (
    <>
      <KpiGrid
        items={[
          { helper: "Income recorded this month", label: "Income", tone: "green", value: money(reports.monthly.income) },
          { helper: "Expenses excluding transfers", label: "Expense", tone: "rose", value: money(reports.monthly.expense) },
          {
            helper: `${reports.monthly.savingsRate}% savings rate`,
            label: "Net Savings",
            tone: reports.monthly.netSavings >= 0 ? "green" : "rose",
            value: money(reports.monthly.netSavings)
          },
          { helper: `${money(reports.monthly.budgetUsedAmount)} used`, label: "Budget Usage", tone: "blue", value: percent(reports.monthly.budgetUsage) },
          { helper: "Largest spending category", label: "Top Category", tone: "navy", value: reports.monthly.biggestExpenseCategory },
          { helper: "Shown in top transactions", label: "Transactions", tone: "blue", value: String(reports.monthly.topTransactions.length) }
        ]}
      />

      <ExecutiveInsight title="Executive Insight">
        {`For ${reports.monthly.label}, income reached ${money(reports.monthly.income)} while expenses were ${money(
          reports.monthly.expense
        )}. Net savings are ${money(reports.monthly.netSavings)} and the leading expense category is ${
          reports.monthly.biggestExpenseCategory
        }. Budget usage is currently ${reports.monthly.budgetUsage}%.`}
      </ExecutiveInsight>

      <Section eyebrow="Trend" title="Income vs Expense Trend">
        <TrendChart
          data={monthlyTrend}
          keys={[
            { color: palette.green, key: "income", label: "Income" },
            { color: palette.rose, key: "expense", label: "Expense" }
          ]}
          note="Weekly movement shown as a clean line comparison for faster cashflow review."
        />
      </Section>

      <View style={styles.twoColumns} wrap={false}>
        <View style={styles.leftColumn}>
          <Section eyebrow="Categories" title="Category Breakdown">
            <CategoryBars categories={reports.monthly.categoryBreakdown} />
          </Section>
        </View>
        <View style={styles.rightColumn}>
          <Section eyebrow="Budget" title="Budget + Account Snapshot">
            <View style={styles.miniGrid}>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Budget Limit</Text>
                <Text style={styles.miniValue}>{money(reports.monthly.budgetLimit)}</Text>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Used</Text>
                <Text style={styles.miniValue}>{money(reports.monthly.budgetUsedAmount)}</Text>
              </View>
            </View>
            <View style={[styles.track, { marginTop: 9 }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: reports.monthly.budgetUsage >= 100 ? palette.rose : palette.cyan,
                    width: `${Math.min(100, reports.monthly.budgetUsage)}%`
                  }
                ]}
              />
            </View>
            <Text style={styles.chartFooter}>
              Total balance snapshot: {money(reports.overview.totalBalance)}. Budget usage is{" "}
              {reports.monthly.budgetUsage}% for the selected month.
            </Text>
          </Section>
        </View>
      </View>

      <View style={styles.twoColumns}>
        <View style={styles.leftColumn}>
          <Section eyebrow="Breakdown" keepTogether={false} title="Weekly Cashflow Table">
            <TrendTable rows={monthlyTrend} />
          </Section>
        </View>
        <View style={styles.rightColumn}>
          <Section eyebrow="Transactions" keepTogether={false} title="Top Transactions">
            <TransactionTable transactions={reports.monthly.topTransactions} />
          </Section>
        </View>
      </View>
    </>
  );
}

function YearlyPDF({ reports }: { reports: ReportsData }) {
  const yearlyTrend = reports.yearly.monthlyTrend.map((item) => ({
    expense: item.expense,
    income: item.income,
    label: item.month.slice(0, 3),
    savings: item.savings
  }));

  return (
    <>
      <KpiGrid
        items={[
          { helper: "Total income this year", label: "Total Income", tone: "green", value: money(reports.yearly.income) },
          { helper: "Total expense this year", label: "Total Expense", tone: "rose", value: money(reports.yearly.expense) },
          {
            helper: "Income minus expense",
            label: "Total Savings",
            tone: reports.yearly.savings >= 0 ? "green" : "rose",
            value: money(reports.yearly.savings)
          },
          { helper: "Average monthly expense", label: "Avg. Monthly Expense", tone: "blue", value: money(reports.yearly.averageMonthlyExpense) },
          { helper: "Strongest saving month", label: "Best Saving Month", tone: "navy", value: reports.yearly.bestSavingMonth },
          { helper: "Highest spending period", label: "Highest Spending", tone: "rose", value: reports.yearly.highestSpendingMonth }
        ]}
      />

      <ExecutiveInsight title="Yearly Executive Insight">
        {`In ${reports.yearly.year}, total savings are ${money(reports.yearly.savings)} with average monthly income of ${money(
          reports.yearly.averageMonthlyIncome
        )}. The best saving month is ${reports.yearly.bestSavingMonth}, while ${
          reports.yearly.highestSpendingMonth
        } had the highest spending.`}
      </ExecutiveInsight>

      <Section eyebrow="Trend" title="Monthly Financial Trend">
        <TrendChart
          data={yearlyTrend}
          keys={[
            { color: palette.green, key: "income", label: "Income" },
            { color: palette.rose, key: "expense", label: "Expense" },
            { color: palette.cyan, key: "savings", label: "Savings" }
          ]}
          note="Month-by-month yearly movement across income, expense, and net savings."
        />
      </Section>

      <View style={styles.twoColumns} wrap={false}>
        <View style={styles.leftColumn}>
          <Section eyebrow="Categories" title="Yearly Expense Categories">
            <CategoryBars categories={reports.yearly.categoryBreakdown} />
          </Section>
        </View>
        <View style={styles.rightColumn}>
          <Section eyebrow="Performance" title="Savings Performance">
            <SavingsBars data={yearlyTrend} />
          </Section>
        </View>
      </View>

      <View break wrap={false}>
        <Section eyebrow="Breakdown" title="Monthly Breakdown">
          <YearlyMonthlyBreakdownTable rows={yearlyTrend} />
        </Section>
      </View>

      <View style={styles.twoColumns} wrap={false}>
        <View style={styles.leftColumn}>
          <Section eyebrow="Goals" title="Goals Summary">
            <GoalsTable reports={reports} />
          </Section>
        </View>
        <View style={styles.rightColumn}>
          <YearlyClosingSummary reports={reports} />
        </View>
      </View>

      <Section eyebrow="Transactions" keepTogether={false} title="Top Transactions">
        <TransactionTable transactions={reports.yearly.topTransactions} />
      </Section>
    </>
  );
}

export function ReportPDF({ kind, dashboard, reports }: ReportPDFProps) {
  return (
    <Document
      title={`DFT ${kind === "monthly" ? reports.monthly.label : reports.yearly.year} Report`}
      author="Dgm Finance Tracker"
      subject="Personal finance report"
    >
      <Page size="A4" style={styles.page}>
        <Header kind={kind} reports={reports} />
        {kind === "monthly" ? (
          <MonthlyPDF dashboard={dashboard} reports={reports} />
        ) : (
          <YearlyPDF reports={reports} />
        )}
        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            `DFT - Dgm Finance Tracker - Generated ${reports.generatedAt} - Page ${pageNumber} of ${totalPages}`
          }
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}
