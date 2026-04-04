import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';

export default function Index() {
    const { userData } = useUser();

    // If we reached here and have user data, go to tabs
    if (userData) {
        return <Redirect href="/(tabs)" />;
    }

    // If we reached here and DON'T have user data, go to login
    if (!userData) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
}
