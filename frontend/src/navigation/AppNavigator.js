import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DoctorLoginScreen from '../screens/DoctorLoginScreen';
import DoctorHomeScreen from '../screens/DoctorHomeScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const DoctorStack = createNativeStackNavigator();

// Lets code outside the navigation tree (the push-notification tap handler) jump to a tab.
export const navigationRef = createNavigationContainerRef();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tab.Screen name="Perfil" component={ProfileFormScreen} options={{ title: 'Mi perfil' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Dr Longa' }} />
    </Tab.Navigator>
  );
}

function DoctorMain() {
  return (
    <DoctorStack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <DoctorStack.Screen name="MisPacientes" component={DoctorHomeScreen} options={{ title: 'Mis pacientes' }} />
    </DoctorStack.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, doctor, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {doctor ? <DoctorMain /> : user ? <MainTabs /> : <AuthFlow />}
    </NavigationContainer>
  );
}
