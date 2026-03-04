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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import FAB from '../components/FAB';
import AddOrderModal from '../components/AddOrderModal';

export default function Sluzby() {
  const { services, addService, updateService, deleteService, isLoading } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<typeof services[0] | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [materialCost, setMaterialCost] = useState('');

  const handleAddService = () => {
    setEditingService(null);
    setServiceName('');
    setDefaultPrice('');
    setMaterialCost('');
    setModalVisible(true);
  };

  const handleEditService = (service: typeof services[0]) => {
    setEditingService(service);
    setServiceName(service.name);
    setDefaultPrice(service.defaultPrice.toString());
    setMaterialCost(service.materialCost.toString());
    setModalVisible(true);
  };

  const handleSaveService = () => {
    if (!serviceName.trim()) {
      Alert.alert('Chyba', 'Zadejte název služby');
      return;
    }

    const price = parseFloat(defaultPrice);
    const cost = parseFloat(materialCost);

    if (isNaN(price) || price < 0) {
      Alert.alert('Chyba', 'Zadejte platnou cenu');
      return;
    }

    if (isNaN(cost) || cost < 0) {
      Alert.alert('Chyba', 'Zadejte platné náklady');
      return;
    }

    if (editingService) {
      updateService({
        ...editingService,
        name: serviceName,
        defaultPrice: price,
        materialCost: cost,
      });
    } else {
      addService({
        name: serviceName,
        defaultPrice: price,
        materialCost: cost,
      });
    }

    setModalVisible(false);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Smazat službu',
      'Opravdu chcete smazat tuto službu?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: () => deleteService(serviceId),
        },
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (serviceId: string) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDeleteService(serviceId)}
    >
      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      <Text style={styles.deleteButtonText}>Smazat</Text>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item }: { item: typeof services[0] }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => handleEditService(item)}
        activeOpacity={0.7}
      >
        <View style={styles.serviceContent}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <View style={styles.serviceDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cena:</Text>
              <Text style={styles.detailValue}>{item.defaultPrice} Kč</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Materiál:</Text>
              <Text style={[styles.detailValue, { color: '#F44336' }]}>
                {item.materialCost} Kč
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CE93D8" />
      </TouchableOpacity>
    </Swipeable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CE93D8" />
          <Text style={styles.loadingText}>Načítání služeb...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerText}>Přejeďte pro smazání</Text>
      </View>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Upravit službu' : 'Nová služba'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Název služby</Text>
                <TextInput
                  style={styles.input}
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="např. Střih vlasů"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Výchozí cena (Kč)</Text>
                <TextInput
                  style={styles.input}
                  value={defaultPrice}
                  onChangeText={setDefaultPrice}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Materiálové náklady (Kč)</Text>
                <TextInput
                  style={styles.input}
                  value={materialCost}
                  onChangeText={setMaterialCost}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveService}
              >
                <Text style={styles.saveButtonText}>
                  {editingService ? 'Uložit změny' : 'Přidat službu'}
                </Text>
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

      <TouchableOpacity style={styles.addServiceButton} onPress={handleAddService}>
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  serviceCard: {
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
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CE93D8',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
  addServiceButton: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8BBD9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    minHeight: 500,
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
  saveButton: {
    backgroundColor: '#CE93D8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
