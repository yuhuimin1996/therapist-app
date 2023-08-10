import { View, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Watch from '../screens/Watch';
import Ask from '../screens/Ask';
import Search from '../screens/Search';
import Blank from '../screens/Blank';


const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <Tab.Navigator 
        screenOptions={{
            headerShown:false,
            tabBarStyle: { 
              backgroundColor: 'black'
            },
            tabBarInactiveTintColor: 'gray',
            tabBarActiveTintColor: 'white'
        }}
        
        initialRouteName="Blank"
    >
      <Tab.Screen name="Blank" component={Blank} options={{ tabBarButton: (props) => null}}/>
      <Tab.Screen name="Watch" component={Watch} />
      <Tab.Screen name="Ask" component={Ask} />
      <Tab.Screen name="Search" component={Search} />
    </Tab.Navigator>
  )
}