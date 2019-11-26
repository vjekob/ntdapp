import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, View, Text } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { NTDAPP_AUTH } from './constants/NTDAPP_AUTH';
import { getCurrentToken, clearToken } from './components/AzureOAuth';
import { AuthScreen } from './screens/AuthScreen';
import Loading from './components/Loading';
import { API } from './constants/API';
import { StateStore } from './redux/StateStore';
import { Provider } from "react-redux";
import { ItemStateManager } from './components/ItemStateManager';

const STATUS_LOADING = Symbol("loading");
const STATUS_AUTH = Symbol("auth");
const STATUS_GO = Symbol("go");
const STATUS_ERROR = Symbol("error");

let attemptCount = 0;
let currentToken = null;

const _loadCurrentToken = async () => currentToken = await getCurrentToken(NTDAPP_AUTH);

const _validateToken = async setStatus => {
  await _loadCurrentToken();
  if (!currentToken)
    return setStatus(STATUS_AUTH);

  const authorization = API.getAuthorization(currentToken)
  const result = await fetch(API.getCompaniesUrl(), { method: "GET", headers: authorization });
  console.log(`Authentication status: ${result.status}`);
  if (result.status === 401)
    return setStatus(STATUS_AUTH);

  if (result.status === 200) {
    attemptCount = 0;
    return setStatus(STATUS_GO);
  }

  if (attemptCount++ > 5) {
    debugger;
    return setStatus(STATUS_ERROR);
  }
  await clearToken(NTDAPP_AUTH);
  return setStatus(STATUS_LOADING);
}

const _login = (token, setStatus) => {
  currentToken = token;
  setStatus(STATUS_GO);
}

export default function App() {
  const [status, setStatus] = useState(STATUS_LOADING);

  switch (status) {
    case STATUS_LOADING:
      _validateToken(setStatus);
      return <Loading />;

    case STATUS_AUTH:
      return <AuthScreen onLogin={async token => _login(token, setStatus)} />

    case STATUS_GO:
      return (
        <Provider store={StateStore}>
          <ItemStateManager token={currentToken} />
          <View style={styles.container}>
            {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
            <AppNavigator />
          </View>
        </Provider>
      );

    case STATUS_ERROR:
      return (
        <Text>ERROR - TODO</Text>
      )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#00c284",
    flex: 1,
    justifyContent: "center",
    alignContent: "center"
  }
});
