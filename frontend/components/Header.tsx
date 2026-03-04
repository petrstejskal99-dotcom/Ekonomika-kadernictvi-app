import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.container}>
      <Text style={styles.salonName}>Můj Salon</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => router.push('/sluzby')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabText,
              isActive('/sluzby') && styles.tabTextActive,
            ]}
          >
            Služby
          </Text>
          {isActive('/sluzby') && <View style={styles.activeUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/prehled')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabText,
              isActive('/prehled') && styles.tabTextActive,
            ]}
          >
            Přehled
          </Text>
          {isActive('/prehled') && <View style={styles.activeUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/provoz')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabText,
              isActive('/provoz') && styles.tabTextActive,
            ]}
          >
            Provoz
          </Text>
          {isActive('/provoz') && <View style={styles.activeUnderline} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salonName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    gap: 20,
  },
  tab: {
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#CE93D8',
    fontWeight: '700',
  },
  activeUnderline: {
    height: 2,
    backgroundColor: '#CE93D8',
    marginTop: 4,
    borderRadius: 1,
  },
});
