import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";

export default function Loading() {
    return (
        <View style={styles.container}>
            <Image source={require("../assets/images/logo.png")} style={styles.image}></Image>
            <Text style={styles.loading}>Loading...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#00c284",
        flex: 1,
        justifyContent: "center",
        alignContent: "center"
    },
    image: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.35,
        shadowRadius: 5.84,
        width: 375,
        height: 375,
        alignSelf: "center"
    },
    loading: {
        fontSize: 24,
        fontWeight: "300",
        color: "white",
        alignSelf: "center",
        marginTop: 20
    }
});
