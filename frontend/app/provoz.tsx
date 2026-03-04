import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import FAB from '../components/FAB';
import AddOrderModal from '../components/AddOrderModal';

export default function Provoz() {
  const {
    fixedCosts,
    oneTimeCosts,
    addFixedCost,
    updateFixedCost,
    deleteFixedCost,
    addOneTimeCost,
    deleteOneTimeCost,
    isLoading,
  } = useApp();

  const [fixedModalVisible, setFixedModalVisible] = useState(false);
  const [oneTimeModalVisible, setOneTimeModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<typeof fixedCosts[0] | null>(null);
  
  const [fixedCostName, setFixedCostName] = useState('');
  const [fixedCostAmount, setFixedCostAmount] = useState('');
  
  const [oneTimeCostName, setOneTimeCostName] = useState('');
  const [oneTimeCostAmount, setOneTimeCostAmount] = useState('');

  const handleAddFixedCost = () => {
    setEditingFixedCost(null);
    setFixedCostName('');
    setFixedCostAmount('');
    setFixedModalVisible(true);
  };

  const handleEditFixedCost = (cost: typeof fixedCosts[0]) => {
    setEditingFixedCost(cost);
    setFixedCostName(cost.name);
    setFixedCostAmount(cost.amount.toString());
    setFixedModalVisible(true);
  };

  const handleSaveFixedCost = () => {
    if (!fixedCostName.trim()) {
      Alert.alert('Chyba', 'Zadejte název nákladů');
      return;
    }

    const amount = parseFloat(fixedCostAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Chyba', 'Zadejte platnou částku');
      return;
    }

    if (editingFixedCost) {
      updateFixedCost({
        ...editingFixedCost,
        name: fixedCostName,
        amount: amount,
      });
    } else {
      addFixedCost({
        name: fixedCostName,
        amount: amount,
      });
    }

    setFixedModalVisible(false);
  };

  const handleDeleteFixedCost = (costId: string) => {
    Alert.alert(
      'Smazat náklady',
      'Opravdu chcete smazat tento náklad?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: () => deleteFixedCost(costId),
        },
      ]
    );
  };

  const handleAddOneTimeCost = () => {
    setOneTimeCostName('');
    setOneTimeCostAmount('');
    setOneTimeModalVisible(true);
  };

  const handleSaveOneTimeCost = () => {
    if (!oneTimeCostName.trim()) {
      Alert.alert('Chyba', 'Zadejte název výdaje');
      return;
    }

    const amount = parseFloat(oneTimeCostAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Chyba', 'Zadejte platnou částku');
      return;
    }

    addOneTimeCost({
      name: oneTimeCostName,
      amount: amount,
    });

    setOneTimeModalVisible(false);
  };

  const handleDeleteOneTimeCost = (costId: string) => {
    Alert.alert(
      'Smazat výdaj',
      'Opravdu chcete smazat tento výdaj?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: () => deleteOneTimeCost(costId),
        },
      ]
    );
  };

  const getTotalFixedCosts = () => {
    return fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ');
  };

  const renderFixedCostItem = ({ item }: { item: typeof fixedCosts[0] }) => (
    <View style={styles.costCard}>
      <TouchableOpacity
        style={styles.costContent}
        onPress={() => handleEditFixedCost(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.costName}>{item.name}</Text>
        <Text style={styles.costAmount}>{item.amount} Kč / měsíc</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteFixedCost(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  const renderOneTimeCostItem = ({ item }: { item: typeof oneTimeCosts[0] }) => (
    <View style={styles.costCard}>
      <View style={styles.costContent}>
        <View style={styles.oneTimeCostInfo}>
          <Text style={styles.costName}>{item.name}</Text>
          <Text style={styles.costDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.costAmount}>{item.amount} Kč</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteOneTimeCost(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CE93D8" />
          <Text style={styles.loadingText}>Načítání nákladů...</Text>
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
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fixní náklady</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFixedCost}
            >
              <Ionicons name="add-circle" size={28} color="#CE93D8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Měsíční opakované náklady</Text>
          
          <FlatList
            data={fixedCosts}
            renderItem={renderFixedCostItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Žádné fixní náklady</Text>
            }
          />

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Celkové fixní náklady / měsíc</Text>
            <Text style={styles.totalAmount}>{getTotalFixedCosts()} Kč</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jednorazové náklady</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddOneTimeCost}
            >
              <Ionicons name="add-circle" size={28} color="#CE93D8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Jednorazové výdaje</Text>
          
          <FlatList
            data={oneTimeCosts}
            renderItem={renderOneTimeCostItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Žádné jednorazové náklady</Text>
            }
          />
        </View>
      </ScrollView>

      <Modal
        visible={fixedModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFixedModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFixedCost ? 'Upravit náklady' : 'Nový fixní náklad'}
              </Text>
              <TouchableOpacity onPress={() => setFixedModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Název</Text>
                <TextInput
                  style={styles.input}
                  value={fixedCostName}
                  onChangeText={setFixedCostName}
                  placeholder="např. Nájem"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Měsíční částka (Kč)</Text>
                <TextInput
                  style={styles.input}
                  value={fixedCostAmount}
                  onChangeText={setFixedCostAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveFixedCost}
              >
                <Text style={styles.saveButtonText}>
                  {editingFixedCost ? 'Uložit změny' : 'Přidat náklad'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={oneTimeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOneTimeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nový jednorazový výdaj</Text>
              <TouchableOpacity onPress={() => setOneTimeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Název výdaje</Text>
                <TextInput
                  style={styles.input}
                  value={oneTimeCostName}
                  onChangeText={setOneTimeCostName}
                  placeholder="např. Nákup zboží"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Částka (Kč)</Text>
                <TextInput
                  style={styles.input}
                  value={oneTimeCostAmount}
                  onChangeText={setOneTimeCostAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <Text style={styles.dateNote}>
                Datum: {new Date().toLocaleDateString('cs-CZ')}
              </Text>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveOneTimeCost}
              >
                <Text style={styles.saveButtonText}>Přidat výdaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FAB onPress={() => setOrderModalVisible(true)} />
      <AddOrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
      />
    </SafeAreaView>
  );
}

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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  costCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  costContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  costAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
  },
  oneTimeCostInfo: {
    flex: 1,
  },
  costDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  totalCard: {
    backgroundColor: '#F8BBD9',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8BBD9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  dateNote: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#CE93D8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
