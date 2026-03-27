import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../utils/api';

const COLORS = {
    PRIMARY: '#007AFF',
    BACKGROUND: '#F8F9FA',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    BORDER: '#EEE',
};

export default function MyTripsScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'expired'

    const fetchMyBookings = async () => {
        try {
            const response = await api.get('/bookings/my');
            if (response.data.success) {
                setBookings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMyBookings();
    }, []);

    const handleDownloadTicket = async (booking: any) => {
        const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
              body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 20px; background-color: #f5f5f5; -webkit-print-color-adjust: exact; }
              .ticket-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; position: relative; }
              
              /* Header Section */
              .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 30px; position: relative; }
              .brand { font-size: 24px; font-weight: 800; letter-spacing: -1px; margin-bottom: 5px; }
              .sub-brand { font-size: 12px; opacity: 0.7; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
              .status-badge { position: absolute; right: 30px; top: 30px; background: #22c55e; color: white; padding: 6px 12px; border-radius: 50px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

              /* Main Body */
              .body { padding: 30px; }
              
              /* Route Display */
              .route-display { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
              .city-group { flex: 1; }
              .city-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
              .city-val { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.2; }
              .city-time-val { font-size: 14px; color: #334155; font-weight: 600; margin-top: 4px; }
              
              .connector { flex: 0 0 80px; text-align: center; position: relative; }
              .line { height: 2px; background: #e2e8f0; width: 100%; position: absolute; top: 50%; left: 0; }
              .bus-icon-circle { background: #eff6ff; color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; margin: 0 auto; font-size: 14px; }

              /* Info Grid */
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
              .info-item .label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
              .info-item .value { font-size: 16px; font-weight: 700; color: #1e293b; }
              
              /* Tear-off Section */
              .tear-off { border-top: 2px dashed #e2e8f0; position: relative; background: #fafafa; padding: 30px; display: flex; align-items: center; justify-content: space-between; }
              .tear-off::before, .tear-off::after { content: ''; position: absolute; top: -10px; width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%; }
              .tear-off::before { left: -10px; }
              .tear-off::after { right: -10px; }
              
              .passenger-info { flex: 1; }
              .qr-placeholder { width: 80px; height: 80px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px; display: flex; align-items: center; justify-content: center; }
              .qr-code { font-size: 40px; }

              .footer-note { text-align: center; font-size: 10px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; background: white; }
            </style>
          </head>
          <body>
            <div class="ticket-container">
              <div class="header">
                <div class="brand">${booking.bus?.name || 'Bus Yatra'}</div>
                <div class="sub-brand">Official E-Ticket</div>
                <div class="status-badge">Confirmed</div>
              </div>
              
              <div class="body">
                <div class="route-display">
                  <div class="city-group" style="text-align: left;">
                    <div class="city-label">Boarding At</div>
                    <div class="city-val">${booking.boardingPoint || '...'}</div>
                    <div class="city-time-val">${booking.route?.departureTime || '--:--'}</div>
                  </div>
                  
                  <div class="connector">
                    <div class="line"></div>
                    <div class="bus-icon-circle">🚌</div>
                  </div>
                  
                  <div class="city-group" style="text-align: right;">
                    <div class="city-label">Destination</div>
                    <div class="city-val">${booking.route?.destination?.name || '...'}</div>
                    <div class="city-time-val">${booking.route?.arrivalTime || '--:--'}</div>
                  </div>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Passenger</div>
                    <div class="value">${booking.contactName}</div>
                  </div>
                  <div class="info-item" style="text-align: right;">
                    <div class="label">Date</div>
                    <div class="value">${booking.bookingDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Seat No.</div>
                    <div class="value" style="color: #007AFF;">${booking.seats?.join(', ')}</div>
                  </div>
                   <div class="info-item" style="text-align: right;">
                    <div class="label">Total Paid</div>
                    <div class="value">Rs. ${booking.totalPrice}</div>
                  </div>
                </div>
              </div>

              <div class="tear-off">
                <div class="passenger-info">
                  <div class="info-item">
                     <div class="label">Booking Reference</div>
                     <div class="value" style="font-family: monospace; letter-spacing: 1px; font-size: 18px;">#${booking._id.slice(-8).toUpperCase()}</div>
                  </div>
                </div>
                <div class="qr-placeholder">
                   <!-- Visual placeholder for QR -->
                   <div style="width: 100%; height: 100%; background: #000; opacity: 0.1;"></div>
                </div>
              </div>
              
              <div class="footer-note">
                Please show this ticket to the bus conductor. Have a safe journey!
              </div>

            </div>
          </body>
        </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            Alert.alert('Error', 'Could not generate ticket PDF');
        }
    };

    const isExpired = (dateStr: string) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Robust parsing for "DD MMM YYYY" format (e.g., "30 Jan 2026")
            const parts = dateStr.split(' ');
            if (parts.length !== 3) return false;

            const day = parseInt(parts[0], 10);
            const monthStr = parts[1].toLowerCase().substring(0, 3);
            const year = parseInt(parts[2], 10);

            const months: { [key: string]: number } = {
                jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
            };

            const month = months[monthStr];
            if (month === undefined) {
                // Fallback to standard parser if manual fails
                const fallbackDate = new Date(dateStr);
                fallbackDate.setHours(0, 0, 0, 0);
                return !isNaN(fallbackDate.getTime()) && fallbackDate < today;
            }

            const bookingDate = new Date(year, month, day);
            bookingDate.setHours(0, 0, 0, 0);

            return bookingDate < today;
        } catch (e) {
            console.error('Date parsing error:', e);
            return false;
        }
    };

    const filteredBookings = bookings.filter((booking: any) => {
        const expired = isExpired(booking.bookingDate);
        return activeTab === 'tickets' ? !expired : expired;
    });

    const renderTicket = (booking: any) => (
        <View key={booking._id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <View style={styles.companyInfo}>
                    <MaterialCommunityIcons name="bus" size={24} color={COLORS.PRIMARY} />
                    <Text style={styles.companyName}>{booking.bus?.name || 'Bus'}</Text>
                </View>
            </View>

            <View style={styles.tripDetails}>
                <View style={styles.routeRow}>
                    <View style={styles.point}>
                        <Text style={styles.cityText}>{booking.boardingPoint || '...'}</Text>
                        <Text style={styles.timeText}>{booking.route?.departureTime || '--:--'}</Text>
                    </View>
                    <View style={styles.flightPath}>
                        <View style={styles.line} />
                        <MaterialCommunityIcons name="bus-side" size={20} color={COLORS.PRIMARY} />
                        <View style={styles.line} />
                    </View>
                    <View style={[styles.point, { alignItems: 'flex-end' }]}>
                        <Text style={styles.cityText}>{booking.route?.destination?.name || '...'}</Text>
                        <Text style={styles.timeText}>{booking.route?.arrivalTime || '--:--'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                    <View>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{booking.bookingDate}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Seat(s)</Text>
                        <Text style={styles.value}>{booking.seats?.join(', ') || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => handleDownloadTicket(booking)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="download" size={16} color={COLORS.PRIMARY} style={{ marginRight: 4 }} />
                            <Text style={styles.detailsBtnText}>Download</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Trips</Text>
            </View>

            <View style={styles.tabContainer}>
                <View style={styles.tabHeader}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('tickets')}
                        style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Tickets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('expired')}
                        style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>Expired</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />
                }
            >
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
                ) : filteredBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="ticket-outline" size={80} color="#DDD" />
                        <Text style={styles.emptyTitle}>No {activeTab} found</Text>
                        <Text style={styles.emptySub}>Your booked journeys will appear here.</Text>
                    </View>
                ) : (
                    filteredBookings.map(renderTicket)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    tabContainer: {
        paddingHorizontal: 15,
        paddingTop: 15,
        backgroundColor: '#fff',
    },
    tabHeader: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.TEXT_SUB,
    },
    activeTabText: {
        color: COLORS.PRIMARY,
    },
    scrollContent: {
        padding: 15,
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    companyName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginLeft: 10,
    },
    tripDetails: {},
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    point: {
        flex: 1,
    },
    cityText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    timeText: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        marginTop: 4,
    },
    flightPath: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: '#EEE',
        marginHorizontal: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: COLORS.TEXT_SUB,
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
    },
    detailsBtn: {
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    detailsBtnText: {
        color: COLORS.PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.6,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        marginTop: 8,
    },
});
