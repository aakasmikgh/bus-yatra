import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    ActivityIndicator,
    Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useUser } from '../context/UserContext';

const COLORS = {
    PRIMARY: '#007AFF',
    BACKGROUND: '#F8F9FA',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    BORDER: '#EEE',
    RED: '#FF3B30',
};


export default function AccountScreen() {
    const { userData, refreshUser, setUserData } = useUser();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        profileImage: '',
        age: '',
        gender: 'Other'
    });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (userData) {
            setEditForm({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                profileImage: userData.profileImage || '',
                age: userData.age ? String(userData.age) : '',
                gender: userData.gender || 'Other'
            });
        }
    }, [userData]);

    const handlePickImage = async () => {
        // ...
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEditForm({ ...editForm, profileImage: result.assets[0].uri });
        }
    };

    const handleUpdateProfile = async () => {
        if (!editForm.name || !editForm.email) {
            Alert.alert('Error', 'Name and Email are required');
            return;
        }

        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('email', editForm.email);
            formData.append('phone', editForm.phone);
            if(editForm.age) formData.append('age', editForm.age);
            if(editForm.gender) formData.append('gender', editForm.gender);

            if (editForm.profileImage && editForm.profileImage.startsWith('file://')) {
                const uriParts = editForm.profileImage.split('.');
                const fileType = uriParts[uriParts.length - 1];

                formData.append('profileImage', {
                    uri: editForm.profileImage,
                    name: `photo.${fileType}`,
                    type: `image/${fileType}`,
                } as any);
            }

            const response = await api.put('/auth/updateMe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const updatedUser = response.data.data;
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                await refreshUser();
                setIsEditModalVisible(false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error: any) {
            console.error('Update Profile Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear context immediately to trigger layout reset
                            setUserData(null);
                            // Then clear storage
                            await AsyncStorage.multiRemove(['token', 'user']);
                            // Force manual redirect for snappiness
                            router.replace('/(auth)/login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <SafeAreaView />
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
                        <MaterialCommunityIcons name="pencil-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsEditModalVisible(true)}>
                        <View style={styles.avatarContainer}>
                            {userData?.profileImage ? (
                                <Image source={{ uri: userData.profileImage }} style={styles.avatarImage} />
                            ) : (
                                <MaterialCommunityIcons name="account" size={60} color={COLORS.PRIMARY} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{userData?.name || 'Loading...'}</Text>
                    <Text style={styles.userEmail}>{userData?.email || ''}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Account Settings</Text>

                <View style={styles.settingsCard}>
                    <SettingItem icon="account-outline" title="Personal Information" onPress={() => setIsEditModalVisible(true)} />
                    <View style={styles.divider} />
                    <SettingItem icon="bell-outline" title="Notifications" />
                    <View style={styles.divider} />
                    <SettingItem icon="wallet-outline" title="Payment Methods" />
                    <View style={styles.divider} />
                    <SettingItem icon="security" title="Security & Password" />
                </View>

                <Text style={styles.sectionTitle}>More Options</Text>

                <View style={styles.settingsCard}>
                    <SettingItem icon="share-variant-outline" title="Refer and Earn" />
                    <View style={styles.divider} />
                    <SettingItem icon="star-outline" title="Rate the App" />
                    <View style={styles.divider} />
                    <SettingItem icon="information-outline" title="About Us" onPress={() => setIsAboutModalVisible(true)} />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={24} color={COLORS.RED} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} disabled={isUpdating}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.editAvatarSection}>
                                <TouchableOpacity style={styles.editAvatarContainer} onPress={handlePickImage} disabled={isUpdating}>
                                    {editForm.profileImage ? (
                                        <Image source={{ uri: editForm.profileImage }} style={styles.editAvatarImage} />
                                    ) : (
                                        <MaterialCommunityIcons name="account" size={60} color={COLORS.PRIMARY} />
                                    )}
                                    <View style={styles.cameraIconContainer}>
                                        <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                            </View>

                            <View style={styles.formSection}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.name}
                                        onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                                        placeholder="Enter your name"
                                        editable={!isUpdating}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.email}
                                        onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                                        placeholder="Enter your email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isUpdating}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.phone}
                                        onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                        placeholder="Enter your phone number"
                                        keyboardType="phone-pad"
                                        editable={!isUpdating}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editForm.age}
                                        onChangeText={(text) => setEditForm({ ...editForm, age: text })}
                                        placeholder="Enter your age"
                                        keyboardType="numeric"
                                        editable={!isUpdating}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Gender</Text>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <TouchableOpacity 
                                                key={g} 
                                                style={{padding: 10, borderWidth: 1, borderColor: editForm.gender === g ? COLORS.PRIMARY : COLORS.BORDER, borderRadius: 8, backgroundColor: editForm.gender === g ? '#E6F0FF' : '#FFF', flex: 1, marginHorizontal: 5, alignItems: 'center'}}
                                                onPress={() => setEditForm({...editForm, gender: g})}
                                                disabled={isUpdating}
                                            >
                                                <Text style={{color: editForm.gender === g ? COLORS.PRIMARY : COLORS.TEXT_SUB, fontWeight: '600'}}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                                onPress={handleUpdateProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* About Us Modal */}
            <Modal
                visible={isAboutModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAboutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>About Bus Yatra</Text>
                            <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.aboutContent}>
                                <View style={styles.logoCircle}>
                                    <MaterialCommunityIcons name="bus" size={50} color={COLORS.PRIMARY} />
                                </View>
                                <Text style={styles.appName}>Bus Yatra</Text>
                                <Text style={styles.appTagline}>Your Ultimate Travel Companion in Nepal</Text>

                                <View style={styles.aboutCard}>
                                    <Text style={styles.aboutDescription}>
                                        Bus Yatra is Nepal's leading digital bus ticketing platform, dedicated to making your travel experience seamless, safe, and reliable.
                                    </Text>
                                    <Text style={styles.aboutDescription}>
                                        Whether you're traveling across the bustling city of Kathmandu or exploring the scenic hills of Pokhara, we connect you with hundreds of bus operators at your fingertips.
                                    </Text>

                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.PRIMARY} />
                                        <Text style={styles.featureText}>Real-time seat selection</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.PRIMARY} />
                                        <Text style={styles.featureText}>Secure Khalti & Stripe payments</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.PRIMARY} />
                                        <Text style={styles.featureText}>24/7 AI-powered support</Text>
                                    </View>
                                </View>

                                <Text style={styles.aboutFooter}>Developed with ❤️ in Nepal</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function SettingItem({ icon, title, onPress }: { icon: any, title: string, onPress?: () => void }) {
    return (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
            <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name={icon} size={22} color={COLORS.TEXT_SUB} />
            </View>
            <Text style={styles.settingTitle}>{title}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    header: {
        backgroundColor: COLORS.PRIMARY,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    editButton: {
        padding: 5,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
        marginTop: 10,
    },
    settingsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    settingIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.TEXT_MAIN,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0F0',
        paddingVertical: 15,
        borderRadius: 15,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    logoutText: {
        color: COLORS.RED,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.TEXT_SUB,
        fontSize: 12,
        marginBottom: 30,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    editAvatarSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    editAvatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        overflow: 'hidden',
    },
    editAvatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.PRIMARY,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changePhotoText: {
        fontSize: 14,
        color: COLORS.PRIMARY,
        fontWeight: '700',
        marginTop: 12,
    },
    formSection: {
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.TEXT_SUB,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.TEXT_MAIN,
    },
    saveButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // About Us Styles
    aboutContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    appName: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.PRIMARY,
        marginBottom: 5,
    },
    appTagline: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        marginBottom: 25,
        fontWeight: '600',
    },
    aboutCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    aboutDescription: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
        textAlign: 'center',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    featureText: {
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.TEXT_MAIN,
        fontWeight: '600',
    },
    aboutFooter: {
        marginTop: 30,
        fontSize: 13,
        color: COLORS.TEXT_SUB,
        fontStyle: 'italic',
    },
});
