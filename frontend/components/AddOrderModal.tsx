import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface AddOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderAdded?: () => void;
}

export default function AddOrderModal({
  visible,
  onClose,
  onOrderAdded,
}: AddOrderModalProps) {
  const { services, addOrder } = useApp();
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [price, setPrice] = useState<string>('');

  useEffect(() => {
    // Reset when modal opens
    if (visible) {
      setSelectedService(null);
      setPrice('');
    }
  }, [visible]);

  const handleSelectService = (service: typeof services[0]) => {
    setSelectedService(service);
    setPrice(service.price.toString());
  };

  const handleSave = () => {
    if (!selectedService) {
      Alert.alert('Chyba', 'Vyberte službu');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Chyba', 'Zadejte platnou cenu');
      return;
    }

    addOrder({
      serviceName: selectedService.name,
      price: priceValue,
      materialCost: selectedService.materialCost,
    });

    Alert.alert('Hotovo', 'Zakázka byla uložena');
    onOrderAdded?.();
    setSelectedService(null);
    setPrice('');
    onClose();
  };

  const handleClose = () => {
    setSelectedService(null);
    setPrice('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nová zakázka</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Service List */}
        <Text style={styles.subtitle}>Vyberte službu:</Text>
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          style={styles.serviceList}
          contentContainerStyle={styles.serviceListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectService(item)}
              style={[
                styles.serviceItem,
                selectedService?.id === item.id && styles.serviceItemSelected,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.serviceItemContent}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.servicePrice}>{item.price} Kč</Text>
              </View>
              {selectedService?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#CE93D8" />
              )}
            </TouchableOpacity>
          )}
        />

        {/* Price Input - shown after service selected */}
        {selectedService && (
          <View style={styles.priceSection}>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Vybráno:</Text>
              <Text style={styles.selectedServiceName}>{selectedService.name}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cena (Kč):</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.priceInput}
                placeholder="0"
              />
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!selectedService}
          style={[
            styles.saveButton,
            !selectedService && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>Uložit zakázku</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  serviceList: {
    flex: 1,
    maxHeight: 400,
  },
  serviceListContent: {
    paddingBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  serviceItemSelected: {
    borderColor: '#F8BBD9',
    backgroundColor: '#FFF5FA',
  },
  serviceItemContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#CE93D8',
    fontWeight: '500',
  },
  priceSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedInfo: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  selectedServiceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  priceInput: {
    borderWidth: 2,
    borderColor: '#F8BBD9',
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#CE93D8',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
