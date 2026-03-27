import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import api from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';

export default function SignupScreen() {
    const { setUserData } = useUser();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!fullName || !email || !password || !phone) {
            Alert.alert('Validation Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/auth/register', {
                name: fullName,
                email,
                password,
                phone,
                role: 'user' // Default role for mobile users
            });

            if (response.data.success) {
                // Save token and user info
                await AsyncStorage.setItem('token', response.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

                // Update context immediately
                setUserData(response.data.user);

                Alert.alert('Success', 'Account created successfully!');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.log('Signup Error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || 'Failed to create account. Please try again.';
            Alert.alert('Signup Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Animated.View entering={FadeInDown.delay(200).duration(1000)}>
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="bus-side" size={60} color="#007AFF" />
                        </View>
                    </Animated.View>
                    <Animated.Text
                        entering={FadeInDown.delay(400).duration(1000)}
                        style={styles.title}
                    >
                        Create Account
                    </Animated.Text>
                    <Animated.Text
                        entering={FadeInDown.delay(600).duration(1000)}
                        style={styles.subtitle}
                    >
                        Join us for seamless travel
                    </Animated.Text>
                </View>

                <Animated.View
                    entering={FadeInUp.delay(800).duration(1000)}
                    style={styles.form}
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="phone-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone number"
                                placeholderTextColor="#999"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Create a password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.signupButton, loading && { opacity: 0.7 }]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signupButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.loginLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    signupButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 24,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '700',
    },
});
