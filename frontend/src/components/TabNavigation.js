import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Watch from '../screens/Watch';
import Ask from '../screens/Ask';
import Search from '../screens/Search';
import { MaterialIcons } from '@expo/vector-icons';


export default function TabNavigation() {

  const Tab = createBottomTabNavigator();

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
        
        initialRouteName="Watch"
    >
      <Tab.Screen 
        name="Watch" 
        component={Watch}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="home" size={24} color='white' />
          )
        }} 
      />
      <Tab.Screen 
        name="Ask" 
        component={Ask}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="question-answer" size={24} color='white' />
          )
        }} 
      />
      <Tab.Screen 
        name="Search" 
        component={Search}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="search" size={24} color='white' />
          )
        }}
      />
    </Tab.Navigator>
  )
}