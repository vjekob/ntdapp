import React from "react";
import { WebView, AsyncStorage } from "react-native";
import { NTDAPP_AUTH } from "../constants/NTDAPP_AUTH";

let currentAuthToken = null;

const getSourceUri = authInfo =>
    `${authInfo.authorizeUri}?resource=${authInfo.resourceUri}&client_id=${authInfo.clientId}&response_type=code&redirect_uri=${authInfo.redirectUri}`;

const getAuthTokenRequest = (authInfo, code) => ({
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=authorization_code" +
        "&client_id=" + authInfo.clientId +
        "&code=" + code +
        "&client_secret=" + authInfo.clientSecret +
        "&redirect_uri=" + authInfo.redirectUri
});

const authTokenStorageItem = authInfo => `oauth_${authInfo.clientId}`;

const CODE_REGEX = /((\?|\&)code\=)(?<code>[^\&]+)/;

export const getCurrentToken = async authInfo => {
    if (currentAuthToken)
        return currentAuthToken;

    try {
        let token = await AsyncStorage.getItem(authTokenStorageItem(authInfo));
        if (token !== null)
            currentAuthToken = token;
    }
    catch (error) {
        console.error(`Error retrieving OAuth token from async storage: ${error}`);
    }
    finally {
        return currentAuthToken;
    }
}

export const clearToken = async () => {
    await AsyncStorage.removeItem(authTokenStorageItem(NTDAPP_AUTH));
}

export class AzureOAuthScreen extends React.Component {
    async onLoadFinished(args) {
        let match = args.url.match(CODE_REGEX);
        if (match === null)
            return;

        debugger;
        let result = await fetch(this.props.azureOAuthInfo.tokenUri, getAuthTokenRequest(this.props.azureOAuthInfo, match.groups.code));
        debugger;
        let json = await result.json();
        debugger;
        currentAuthToken = json.access_token;
        console.log(`Token: ${currentAuthToken}`);
        await AsyncStorage.setItem(authTokenStorageItem(this.props.azureOAuthInfo), currentAuthToken);
        this.props.onLogin(currentAuthToken);
    }

    render() {
        return <WebView
            style={this.props.style}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            decelerationRate="normal"
            javaScriptEnabledAndroid={true}
            thirdPartyCookiesEnabled={false}
            onShouldStartLoadWithRequest={() => true}
            startInLoadingState={true}
            source={{ uri: getSourceUri(this.props.azureOAuthInfo) }}
            useWebKit={true}
            onNavigationStateChange={args => args.loading || this.onLoadFinished(args)}
        />
    }
}
