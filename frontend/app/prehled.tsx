import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp, MonthlyArchive, Order } from '../context/AppContext';
import Header from '../components/Header';
import FAB from '../components/FAB';
import AddOrderModal from '../components/AddOrderModal';

const screenWidth = Dimensions.get('window').width;

const CZECH_MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

interface ServiceBreakdown {
  serviceName: string;
  revenue: number;
  count: number;
}

interface DailyRevenue {
  day: number;
  revenue: number;
}

export default function Prehled() {
  const { orders, fixedCosts, oneTimeCosts, monthlyArchives, isLoading, performMonthlyClose } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleMonthlyClose = () => {
    Alert.alert(
      'Uzavřít měsíc',
      'Opravdu chcete uzavřít aktuální měsíc? Všechny zakázky a jednorazové náklady budou archivovány.',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Uzavřít',
          style: 'destructive',
          onPress: async () => {
            setIsClosing(true);
            try {
              await performMonthlyClose();
              Alert.alert('Hotovo', 'Měsíc byl úspěšně uzavřen.');
            } catch (error) {
              Alert.alert('Chyba', 'Nepodařilo se uzavřít měsíc.');
            }
            setIsClosing(false);
          },
        },
      ]
    );
  };

  // Calculate all statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStart = new Date(currentYear, currentMonth, now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(currentYear, currentMonth, 1).getTime();

    // Daily stats
    const todayOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= todayStart);
    const dailyRevenue = todayOrders.reduce((sum, order) => sum + order.price, 0);
    const dailyCosts = todayOrders.reduce((sum, order) => sum + order.materialCost, 0);

    // Weekly stats
    const weekOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= weekStart);
    const weeklyRevenue = weekOrders.reduce((sum, order) => sum + order.price, 0);
    const weeklyCosts = weekOrders.reduce((sum, order) => sum + order.materialCost, 0);

    // Monthly stats
    const monthOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= monthStart);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.price, 0);
    const monthMaterialCosts = monthOrders.reduce((sum, order) => sum + order.materialCost, 0);
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const monthOneTimeCosts = oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const monthProfit = monthRevenue - monthMaterialCosts - totalFixedCosts - monthOneTimeCosts;

    // Service breakdown for top services
    const breakdownMap = new Map<string, ServiceBreakdown>();
    monthOrders.forEach((order) => {
      const existing = breakdownMap.get(order.serviceName);
      if (existing) {
        existing.revenue += order.price;
        existing.count += 1;
      } else {
        breakdownMap.set(order.serviceName, {
          serviceName: order.serviceName,
          revenue: order.price,
          count: 1,
        });
      }
    });
    const serviceBreakdown = Array.from(breakdownMap.values())
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue);
    const topServices = serviceBreakdown.slice(0, 5);

    // Daily revenue chart data
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyRevenueData: DailyRevenue[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(currentYear, currentMonth, day).getTime();
      const dayEnd = new Date(currentYear, currentMonth, day + 1).getTime();
      const dayOrders = orders.filter(o => {
        const ts = new Date(o.timestamp).getTime();
        return ts >= dayStart && ts < dayEnd;
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.price, 0);
      dailyRevenueData.push({ day, revenue: dayRevenue });
    }

    // Monthly comparison (last 6 months)
    const monthlyComparison: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      if (i === 0) {
        // Current month from orders
        monthlyComparison.push({
          month: CZECH_MONTHS[targetMonth].substring(0, 3),
          revenue: monthRevenue,
        });
      } else {
        // Previous months from archive
        const archive = monthlyArchives.find(
          a => a.month === targetMonth + 1 && a.year === targetYear
        );
        monthlyComparison.push({
          month: CZECH_MONTHS[targetMonth].substring(0, 3),
          revenue: archive ? archive.revenue : 0,
        });
      }
    }

    // Previous month comparison
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    const prevArchive = monthlyArchives.find(
      a => a.month === prevMonth + 1 && a.year === prevYear
    );
    
    let revenueChange = 0;
    let profitChange = 0;
    let prevMonthLabel = CZECH_MONTHS[prevMonth] + ' ' + prevYear;
    
    if (prevArchive && prevArchive.revenue > 0) {
      revenueChange = ((monthRevenue - prevArchive.revenue) / prevArchive.revenue) * 100;
    }
    if (prevArchive && prevArchive.netProfit !== 0) {
      profitChange = ((monthProfit - prevArchive.netProfit) / Math.abs(prevArchive.netProfit)) * 100;
    }

    return {
      daily: { revenue: dailyRevenue, costs: dailyCosts, profit: dailyRevenue - dailyCosts },
      weekly: { revenue: weeklyRevenue, costs: weeklyCosts, profit: weeklyRevenue - weeklyCosts },
      monthly: {
        revenue: monthRevenue,
        materialCosts: monthMaterialCosts,
        fixedCosts: totalFixedCosts,
        oneTimeCosts: monthOneTimeCosts,
        profit: monthProfit,
        ordersCount: monthOrders.length,
      },
      serviceBreakdown,
      topServices,
      dailyRevenueData,
      monthlyComparison,
      comparison: {
        revenueChange,
        profitChange,
        prevMonthLabel,
        hasPrevData: !!prevArchive,
      },
      monthOrders,
      currentMonthLabel: CZECH_MONTHS[currentMonth] + ' ' + currentYear,
    };
  }, [orders, fixedCosts, oneTimeCosts, monthlyArchives]);

  // Generate PDF
  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const now = new Date();
      const generatedDate = now.toLocaleDateString('cs-CZ');
      
      // Build orders table rows
      const ordersTableRows = stats.monthOrders
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(order => {
          const date = new Date(order.timestamp).toLocaleDateString('cs-CZ');
          return `
            <tr>
              <td>${date}</td>
              <td>${order.serviceName}</td>
              <td style="text-align: right;">${order.price} Kč</td>
            </tr>
          `;
        }).join('');

      // Build top services table rows
      const topServicesRows = stats.topServices.map((service, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `
          <tr>
            <td>${medal}</td>
            <td>${service.serviceName}</td>
            <td style="text-align: center;">${service.count}×</td>
            <td style="text-align: right;">${service.revenue} Kč</td>
          </tr>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Přehled - ${stats.currentMonthLabel}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #CE93D8;
              border-bottom: 3px solid #CE93D8;
              padding-bottom: 10px;
            }
            h2 {
              color: #666;
              margin-top: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E0E0E0;
            }
            th {
              background-color: #F8BBD9;
              color: #333;
              font-weight: 600;
            }
            .summary-table td:first-child {
              font-weight: 600;
            }
            .summary-table td:last-child {
              text-align: right;
              font-weight: 700;
            }
            .profit-row {
              background-color: #F5F5F5;
            }
            .profit-row td:last-child {
              color: ${stats.monthly.profit >= 0 ? '#4CAF50' : '#F44336'};
              font-size: 18px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E0E0E0;
              color: #999;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>🏠 Můj Salon - ${stats.currentMonthLabel}</h1>
          
          <h2>📊 Měsíční souhrn</h2>
          <table class="summary-table">
            <tr>
              <td>💰 Tržba</td>
              <td>${stats.monthly.revenue} Kč</td>
            </tr>
            <tr>
              <td>🧼 Náklady na materiál</td>
              <td>-${stats.monthly.materialCosts} Kč</td>
            </tr>
            <tr>
              <td>🏠 Fixní náklady</td>
              <td>-${stats.monthly.fixedCosts} Kč</td>
            </tr>
            <tr>
              <td>✂️ Jednorazové náklady</td>
              <td>-${stats.monthly.oneTimeCosts} Kč</td>
            </tr>
            <tr class="profit-row">
              <td>✅ Čistý zisk</td>
              <td>${stats.monthly.profit >= 0 ? '+' : ''}${stats.monthly.profit} Kč</td>
            </tr>
          </table>

          <h2>🏆 Top 5 služeb</h2>
          ${stats.topServices.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">Pořadí</th>
                  <th>Služba</th>
                  <th style="width: 80px; text-align: center;">Počet</th>
                  <th style="width: 100px; text-align: right;">Tržba</th>
                </tr>
              </thead>
              <tbody>
                ${topServicesRows}
              </tbody>
            </table>
          ` : '<p>Zatím žádné zakázky tento měsíc.</p>'}

          <h2>📋 Seznam zakázek (${stats.monthOrders.length})</h2>
          ${stats.monthOrders.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 100px;">Datum</th>
                  <th>Služba</th>
                  <th style="width: 100px; text-align: right;">Cena</th>
                </tr>
              </thead>
              <tbody>
                ${ordersTableRows}
              </tbody>
            </table>
          ` : '<p>Zatím žádné zakázky tento měsíc.</p>'}

          <div class="footer">
            Vygenerováno ${generatedDate}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Přehled - ${stats.currentMonthLabel}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Chyba', 'Sdílení není na tomto zařízení dostupné.');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Chyba', 'Nepodařilo se vygenerovat PDF.');
    }
    setIsExporting(false);
  };

  const toggleArchiveExpand = (id: string) => {
    setExpandedArchiveId(expandedArchiveId === id ? null : id);
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(206, 147, 216, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#CE93D8',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E0E0E0',
    },
  };

  // Prepare bar chart data (show only days with data or recent days)
  const barChartData = useMemo(() => {
    const today = new Date().getDate();
    const daysToShow = Math.min(today, 14); // Show up to 14 days
    const startDay = Math.max(1, today - 13);
    
    const labels: string[] = [];
    const data: number[] = [];
    
    for (let i = startDay; i <= today; i++) {
      labels.push(i.toString());
      const dayData = stats.dailyRevenueData.find(d => d.day === i);
      data.push(dayData ? dayData.revenue : 0);
    }
    
    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }],
    };
  }, [stats.dailyRevenueData]);

  // Prepare line chart data for monthly comparison
  const lineChartData = useMemo(() => ({
    labels: stats.monthlyComparison.map(m => m.month),
    datasets: [{
      data: stats.monthlyComparison.map(m => m.revenue),
      color: (opacity = 1) => `rgba(206, 147, 216, ${opacity})`,
      strokeWidth: 3,
    }],
  }), [stats.monthlyComparison]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CE93D8" />
          <Text style={styles.loadingText}>Načítání dat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Export PDF Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={generatePDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.exportButtonIcon}>📄</Text>
              <Text style={styles.exportButtonText}>Exportovat přehled</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Daily Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Graf tržeb (tento měsíc)</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={barChartData}
              width={screenWidth - 48}
              height={180}
              yAxisLabel=""
              yAxisSuffix=" Kč"
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars={false}
            />
          </View>
        </View>

        {/* Monthly Comparison Line Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Srovnání měsíců (posledních 6)</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={lineChartData}
              width={screenWidth - 48}
              height={180}
              yAxisLabel=""
              yAxisSuffix=" Kč"
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              fromZero
            />
          </View>
        </View>

        {/* Daily Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dnešní tržba</Text>
          <View style={styles.statsCard}>
            <StatsRow label="Tržba" value={stats.daily.revenue} color="#CE93D8" />
            <StatsRow label="Náklady" value={stats.daily.costs} color="#F44336" />
            <StatsRow
              label="Čistý zisk"
              value={stats.daily.profit}
              color="#4CAF50"
              highlighted
            />
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Týdenní tržba</Text>
          <View style={styles.statsCard}>
            <StatsRow label="Tržba" value={stats.weekly.revenue} color="#CE93D8" />
            <StatsRow label="Náklady" value={stats.weekly.costs} color="#F44336" />
            <StatsRow
              label="Čistý zisk"
              value={stats.weekly.profit}
              color="#4CAF50"
              highlighted
            />
          </View>
        </View>

        {/* Monthly Stats with Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Měsíční tržba</Text>
          <View style={styles.statsCard}>
            <StatsRowWithComparison
              icon="💰"
              label="Tržba"
              value={stats.monthly.revenue}
              color="#CE93D8"
              change={stats.comparison.revenueChange}
              prevLabel={stats.comparison.prevMonthLabel}
              hasComparison={stats.comparison.hasPrevData}
            />
            <StatsRow
              icon="🧼"
              label="Náklady na materiál"
              value={stats.monthly.materialCosts}
              color="#F44336"
            />
            <StatsRow
              icon="🏠"
              label="Fixní náklady"
              value={stats.monthly.fixedCosts}
              color="#F44336"
            />
            <StatsRow
              icon="✂️"
              label="Jednorazové náklady"
              value={stats.monthly.oneTimeCosts}
              color="#F44336"
            />
            <StatsRowWithComparison
              icon="✅"
              label="Čistý zisk"
              value={stats.monthly.profit}
              color={stats.monthly.profit >= 0 ? '#4CAF50' : '#F44336'}
              highlighted
              change={stats.comparison.profitChange}
              prevLabel={stats.comparison.prevMonthLabel}
              hasComparison={stats.comparison.hasPrevData}
            />
          </View>

          {/* Monthly Close Button */}
          {stats.monthly.ordersCount > 0 && (
            <TouchableOpacity
              style={styles.closeMonthButton}
              onPress={handleMonthlyClose}
              disabled={isClosing}
            >
              {isClosing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.closeMonthButtonText}>Uzavřít měsíc</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Top Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top služby tento měsíc</Text>
          {stats.topServices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Zatím žádné zakázky tento měsíc</Text>
            </View>
          ) : (
            <View style={styles.topServicesCard}>
              {stats.topServices.map((service, index) => (
                <View
                  key={service.serviceName}
                  style={[
                    styles.topServiceRow,
                    index < stats.topServices.length - 1 && styles.topServiceRowBorder,
                  ]}
                >
                  <View style={styles.topServiceRank}>
                    <Text style={styles.topServiceRankText}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </Text>
                  </View>
                  <View style={styles.topServiceInfo}>
                    <Text style={styles.topServiceName}>{service.serviceName}</Text>
                    <Text style={styles.topServiceCount}>×{service.count}</Text>
                  </View>
                  <Text style={styles.topServiceRevenue}>{service.revenue} Kč</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Service Breakdown */}
        {stats.serviceBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rozpis služeb (měsíc)</Text>
            <View style={styles.breakdownCard}>
              {stats.serviceBreakdown.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.breakdownRow,
                    index < stats.serviceBreakdown.length - 1 &&
                      styles.breakdownRowBorder,
                  ]}
                >
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownServiceName}>
                      {item.serviceName}
                    </Text>
                    <Text style={styles.breakdownCount}>
                      {item.count}× zakázka{item.count > 1 ? 'y' : ''}
                    </Text>
                  </View>
                  <Text style={styles.breakdownRevenue}>
                    {item.revenue.toFixed(0)} Kč
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Archive History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historie uzávěrek</Text>
          {monthlyArchives.length === 0 ? (
            <View style={styles.emptyArchiveCard}>
              <Ionicons name="folder-open-outline" size={48} color="#DDD" />
              <Text style={styles.emptyArchiveText}>Zatím žádné uzávěrky</Text>
            </View>
          ) : (
            <View style={styles.archiveList}>
              {monthlyArchives.map((archive) => (
                <ArchiveItem
                  key={archive.id}
                  archive={archive}
                  expanded={expandedArchiveId === archive.id}
                  onToggle={() => toggleArchiveExpand(archive.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FAB onPress={() => setModalVisible(true)} />
      <AddOrderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOrderAdded={() => {}}
      />
    </SafeAreaView>
  );
}

interface ArchiveItemProps {
  archive: MonthlyArchive;
  expanded: boolean;
  onToggle: () => void;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({ archive, expanded, onToggle }) => (
  <TouchableOpacity
    style={styles.archiveCard}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.archiveHeader}>
      <View style={styles.archiveHeaderLeft}>
        <Ionicons name="calendar-outline" size={20} color="#CE93D8" />
        <Text style={styles.archiveLabel}>{archive.label}</Text>
      </View>
      <View style={styles.archiveHeaderRight}>
        <Text style={[
          styles.archiveProfit,
          { color: archive.netProfit >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {archive.netProfit >= 0 ? '+' : ''}{archive.netProfit.toFixed(0)} Kč
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#999"
        />
      </View>
    </View>

    {expanded && (
      <View style={styles.archiveDetails}>
        <View style={styles.archiveDetailRow}>
          <Text style={styles.archiveDetailLabel}>💰 Tržba</Text>
          <Text style={[styles.archiveDetailValue, { color: '#CE93D8' }]}>
            {archive.revenue.toFixed(0)} Kč
          </Text>
        </View>
        <View style={styles.archiveDetailRow}>
          <Text style={styles.archiveDetailLabel}>🧼 Náklady na materiál</Text>
          <Text style={[styles.archiveDetailValue, { color: '#F44336' }]}>
            -{archive.materialCosts.toFixed(0)} Kč
          </Text>
        </View>
        <View style={styles.archiveDetailRow}>
          <Text style={styles.archiveDetailLabel}>🏠 Fixní náklady</Text>
          <Text style={[styles.archiveDetailValue, { color: '#F44336' }]}>
            -{archive.fixedCosts.toFixed(0)} Kč
          </Text>
        </View>
        <View style={styles.archiveDetailRow}>
          <Text style={styles.archiveDetailLabel}>✂️ Jednorazové náklady</Text>
          <Text style={[styles.archiveDetailValue, { color: '#F44336' }]}>
            -{archive.oneTimeCosts.toFixed(0)} Kč
          </Text>
        </View>
        <View style={[styles.archiveDetailRow, styles.archiveDetailRowTotal]}>
          <Text style={styles.archiveDetailLabelTotal}>✅ Čistý zisk</Text>
          <Text style={[
            styles.archiveDetailValueTotal,
            { color: archive.netProfit >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {archive.netProfit >= 0 ? '+' : ''}{archive.netProfit.toFixed(0)} Kč
          </Text>
        </View>
        <View style={styles.archiveMetaRow}>
          <Text style={styles.archiveMeta}>
            {archive.ordersCount} zakázek
          </Text>
          <Text style={styles.archiveMeta}>
            Uzavřeno: {new Date(archive.closedAt).toLocaleDateString('cs-CZ')}
          </Text>
        </View>
      </View>
    )}
  </TouchableOpacity>
);

interface StatsRowProps {
  icon?: string;
  label: string;
  value: number;
  color: string;
  highlighted?: boolean;
}

const StatsRow: React.FC<StatsRowProps> = ({
  icon,
  label,
  value,
  color,
  highlighted = false,
}) => (
  <View
    style={[
      styles.statsRow,
      highlighted && { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12 },
    ]}
  >
    <Text style={[styles.statsLabel, highlighted && { fontWeight: '700' }]}>
      {icon && `${icon} `}{label}
    </Text>
    <Text
      style={[
        styles.statsValue,
        { color },
        highlighted && { fontSize: 24, fontWeight: '700' },
      ]}
    >
      {value.toFixed(0)} Kč
    </Text>
  </View>
);

interface StatsRowWithComparisonProps extends StatsRowProps {
  change: number;
  prevLabel: string;
  hasComparison: boolean;
}

const StatsRowWithComparison: React.FC<StatsRowWithComparisonProps> = ({
  icon,
  label,
  value,
  color,
  highlighted = false,
  change,
  prevLabel,
  hasComparison,
}) => (
  <View
    style={[
      styles.statsRowWithComparison,
      highlighted && { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12 },
    ]}
  >
    <View style={styles.statsRowMain}>
      <Text style={[styles.statsLabel, highlighted && { fontWeight: '700' }]}>
        {icon && `${icon} `}{label}
      </Text>
      <Text
        style={[
          styles.statsValue,
          { color },
          highlighted && { fontSize: 24, fontWeight: '700' },
        ]}
      >
        {value.toFixed(0)} Kč
      </Text>
    </View>
    {hasComparison && (
      <View style={styles.comparisonRow}>
        <Text style={[
          styles.comparisonText,
          { color: change >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {change >= 0 ? '↑' : '↓'} {change >= 0 ? '+' : ''}{change.toFixed(0)}% vs. {prevLabel}
        </Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CE93D8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  exportButtonIcon: {
    fontSize: 18,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  statsCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsRowWithComparison: {
    marginBottom: 12,
  },
  statsRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonRow: {
    marginTop: 4,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeMonthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CE93D8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  closeMonthButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  topServicesCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  topServiceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topServiceRank: {
    width: 40,
  },
  topServiceRankText: {
    fontSize: 20,
  },
  topServiceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  topServiceCount: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  topServiceRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CE93D8',
  },
  emptyCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  breakdownCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  breakdownCount: {
    fontSize: 14,
    color: '#999',
  },
  breakdownRevenue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CE93D8',
  },
  emptyArchiveCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArchiveText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  archiveList: {
    gap: 12,
  },
  archiveCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  archiveProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  archiveDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  archiveDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  archiveDetailRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  archiveDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  archiveDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  archiveDetailLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  archiveDetailValueTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  archiveMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  archiveMeta: {
    fontSize: 12,
    color: '#999',
  },
});
