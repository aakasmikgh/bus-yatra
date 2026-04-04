import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';

const { width, height } = Dimensions.get('window');

const DESTINATION_IMAGES = [
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546944065-2bxAoXcfwwM?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581432130383-7dfd4db6c72e?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1589136154562-f674251216d6?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558285511-101b67896563?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600100397561-433ff984dd8e?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582650833075-802c676231bd?q=80&w=400&auto=format&fit=crop',
];

interface Location {
  id: string;
  name: string;
}

import { useUser } from '../../context/UserContext';

export default function HomeScreen() {
  const { userData, loading } = useUser();

  // SECOND LAYER AUTH GUARD: If we reach here without a user, kick back to login immediately
  if (!userData && !loading) {
     return <Redirect href="/(auth)/login" />;
  }
  const [from, setFrom] = useState<Location | null>(null);
  const [to, setTo] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSelection, setShowSelection] = useState<'from' | 'to' | null>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [activePromo, setActivePromo] = useState<any>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);

  React.useEffect(() => {
    fetchDestinations();
    fetchPromos();
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/banners/active');
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch banners');
      setBanners([]);
    }
  };

  const fetchPromos = async () => {
    try {
      // Assuming public endpoint /coupons available without auth or handled gracefully
      const response = await api.get('/coupons');
      if (response.data.success && response.data.data.length > 0) {
        // Find first active one or just take the first one
        const promo = response.data.data[0];
        setActivePromo({
          title: promo.title,
          description: `Get ${promo.discountType === 'Percentage' ? promo.discountValue + '%' : 'Rs. ' + promo.discountValue} off with code: ${promo.code}`,
          icon: 'ticket-percent-outline',
          color: '#5856D6'
        });
      }
    } catch (err) {
      console.log('Failed to fetch promos');
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await api.get('/destinations');
      if (response.data.success) {
        setDestinations(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
    }
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = () => {
    if (!from || !to) {
      alert('Please select both origin and destination');
      return;
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = days[new Date(selectedDate).getDay()];

    router.push({
      pathname: '/bus-list',
      params: {
        from: from.name,
        to: to.name,
        date: new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        day: dayOfWeek
      }
    });
  };

  const filteredDestinations = destinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectDestination = (dest: any) => {
    const destData = { id: dest._id, name: dest.name };

    if (showSelection === 'from') {
      if (to && to.id === dest._id) {
        alert('Origin and destination cannot be the same');
        return;
      }
      setFrom(destData);
    } else {
      if (from && from.id === dest._id) {
        alert('Origin and destination cannot be the same');
        return;
      }
      setTo(destData);
    }
    setShowSelection(null);
    setSearchQuery('');
  };

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userData?.name || 'Traveler'}!</Text>
            <Text style={styles.subGreeting}>Where are you going today?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/account')}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={32} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Search Card */}
        <Animated.View
          entering={FadeInDown.duration(1000)}
          style={styles.searchCard}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowSelection('from')}
            >
              <MaterialCommunityIcons name="bus-stop" size={24} color="#007AFF" />
              <View style={styles.inputTextWrapperWeb}>
                <Text style={styles.inputLabel}>From</Text>
                <Text style={[styles.inputValue, !from && { color: '#999' }]}>
                  {from ? from.name : 'Departure City'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
              <MaterialCommunityIcons name="swap-vertical" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowSelection('to')}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={24} color="#FF3B30" />
              <View style={styles.inputTextWrapperWeb}>
                <Text style={styles.inputLabel}>To</Text>
                <Text style={[styles.inputValue, !to && { color: '#999' }]}>
                  {to ? to.name : 'Destination City'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.datePickerWrapper}
            onPress={() => setShowCalendar(true)}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#555" />
            <View style={styles.inputTextWrapper}>
              <Text style={styles.inputLabel}>Date</Text>
              <Text style={styles.dateText}>
                {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search Buses</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Offers & Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offers & Updates</Text>
          </View>

          <View style={styles.offersRow}>
            {banners.slice(0, 2).map((offer: any, index: number) => (
              <Animated.View
                key={offer._id}
                entering={FadeInRight.delay(index * 200).duration(800)}
                style={styles.offerCardWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setIsViewerVisible(true);
                  }}
                  style={styles.offerCard}
                >
                  <Image
                    source={{ uri: offer.imageUrl }}
                    style={styles.offerImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Dynamic Promo Banner */}
        {activePromo && (
          <View style={[styles.promoContainer, { backgroundColor: activePromo.color }]}>
            <View style={styles.promoTextWrapper}>
              <Text style={styles.promoTitle}>{activePromo.title}</Text>
              <Text style={styles.promoDesc}>{activePromo.description}</Text>
            </View>
            <MaterialCommunityIcons
              name={activePromo.icon as any}
              size={60}
              color="#fff"
              style={styles.promoIcon}
            />
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCalendar(false)}
        >
          <View 
            style={styles.calendarContainer}
            onStartShouldSetResponder={() => true} // Prevent tap from bubbling to overlay
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Journey Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={onDayPress}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                todayTextColor: '#007AFF',
                selectedDayBackgroundColor: '#007AFF',
                arrowColor: '#007AFF',
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#007AFF' }
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Selection Modal (eSewa Style) */}
      <Modal
        visible={showSelection !== null}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <TouchableOpacity
              onPress={() => { setShowSelection(null); setSearchQuery(''); }}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.searchBarWrapper}>
              <TextInput
                style={styles.selectionSearchInput}
                placeholder={showSelection === 'from' ? "Search Origin" : "Search Destination"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <MaterialCommunityIcons name="magnify" size={24} color="#999" />
            </View>
          </View>

          <ScrollView style={styles.selectionList} keyboardShouldPersistTaps="handled">
            {filteredDestinations.map((dest: any) => (
              <TouchableOpacity
                key={dest._id}
                style={styles.selectionItem}
                onPress={() => selectDestination(dest)}
              >
                <Text style={styles.selectionItemText}>{dest.name}</Text>
              </TouchableOpacity>
            ))}
            {filteredDestinations.length === 0 && (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No destinations found</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={isViewerVisible}
        transparent={false}
        animationType="fade"
      >
        <SafeAreaView style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsViewerVisible(false)}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainImageWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: selectedImageIndex * width, y: 0 }}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
            >
              {banners.map((offer) => (
                <View key={offer._id} style={{ width: width, justifyContent: 'center' }}>
                  <Image
                    source={{ uri: offer.imageUrl }}
                    style={styles.mainImage}
                    contentFit="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.thumbnailOuterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {banners.map((offer: any, index: number) => (
                <TouchableOpacity
                  key={offer._id}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnailWrapper,
                    selectedImageIndex === index && styles.activeThumbnail
                  ]}
                >
                  <Image
                    source={{ uri: offer.imageUrl }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputTextWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  inputTextWrapperWeb: {
    marginLeft: 15,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  } as any,
  inputLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  input: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
    padding: 0,
    borderWidth: 0,
  },
  swapButton: {
    position: 'absolute',
    right: 0,
    top: '40%',
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 3,
    borderColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 15,
  },
  datePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginTop: 10,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAll: {
    color: '#007AFF',
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  offersRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  offerCardWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  offerCard: {
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  promoContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoTextWrapper: {
    flex: 1,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  promoDesc: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  promoIcon: {
    opacity: 0.3,
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  selectionModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    height: 44,
  },
  selectionSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  selectionList: {
    flex: 1,
  },
  selectionItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  emptySearch: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#999',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: 350,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  // Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    padding: 20,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: width,
    height: width * 1.2,
  },
  thumbnailOuterContainer: {
    height: 120,
    paddingVertical: 10,
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
