import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalysesScreen } from '../screens/AnalysesScreen';
import { FormulaInfoScreen } from '../screens/FormulaInfoScreen';
import { PositionEditorScreen } from '../screens/PositionEditorScreen';
import { PositionsListScreen } from '../screens/PositionsListScreen';
import { SalesScreen } from '../screens/SalesScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PositionsList">
        <Stack.Screen
          name="PositionsList"
          component={PositionsListScreen}
          options={{ title: 'Stock Projections' }}
        />
        <Stack.Screen
          name="PositionEditor"
          component={PositionEditorScreen}
          options={{ title: 'Edit position' }}
        />
        <Stack.Screen name="Analyses" component={AnalysesScreen} options={{ title: 'Analyses' }} />
        <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Sales & what-if' }} />
        <Stack.Screen
          name="FormulaInfo"
          component={FormulaInfoScreen}
          options={{ title: 'Formulas & legend' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
