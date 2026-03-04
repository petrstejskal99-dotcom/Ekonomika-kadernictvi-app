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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, MonthlyArchive } from '../context/AppContext';
import Header from '../components/Header';
import FAB from '../components/FAB';
import AddOrderModal from '../components/AddOrderModal';

interface ServiceBreakdown {
  serviceName: string;
  revenue: number;
  count: number;
}

export default function Prehled() {
  const { orders, fixedCosts, oneTimeCosts, monthlyArchives, isLoading, performMonthlyClose } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

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

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Daily stats
    const todayOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= todayStart);
    const dailyRevenue = todayOrders.reduce((sum, order) => sum + order.price, 0);
    const dailyCosts = todayOrders.reduce((sum, order) => sum + order.materialCost, 0);

    // Weekly stats
    const weekOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= weekStart);
    const weeklyRevenue = weekOrders.reduce((sum, order) => sum + order.price, 0);
    const weeklyCosts = weekOrders.reduce((sum, order) => sum + order.materialCost, 0);

    // Monthly stats with operational costs
    const monthOrders = orders.filter((o) => new Date(o.timestamp).getTime() >= monthStart);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.price, 0);
    const monthMaterialCosts = monthOrders.reduce((sum, order) => sum + order.materialCost, 0);
    
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    
    const monthOneTimeCosts = oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
    
    const monthProfit = monthRevenue - monthMaterialCosts - totalFixedCosts - monthOneTimeCosts;

    // Service breakdown
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
    const serviceBreakdown = Array.from(breakdownMap.values()).sort((a, b) => b.revenue - a.revenue);

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
    };
  }, [orders, fixedCosts, oneTimeCosts]);

  const toggleArchiveExpand = (id: string) => {
    setExpandedArchiveId(expandedArchiveId === id ? null : id);
  };

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

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Měsíční tržba</Text>
          <View style={styles.statsCard}>
            <StatsRow
              icon="💰"
              label="Tržba"
              value={stats.monthly.revenue}
              color="#CE93D8"
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
            <StatsRow
              icon="✅"
              label="Čistý zisk"
              value={stats.monthly.profit}
              color={stats.monthly.profit >= 0 ? '#4CAF50' : '#F44336'}
              highlighted
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
