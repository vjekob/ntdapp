import React, { Component } from "react";
import { Dimensions, Image, StyleSheet } from "react-native";
import { bindComponentToImageSource } from "../redux/itemReducer";

class UnboundCarouselImage extends Component {
    render() {
        return <Image style={styles.image} pageIndex={this.props.pageIndex} source={this.props.source} />
    }
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: "contain",
        width: Dimensions.get("screen").width,
        height: Dimensions.get("screen").height
    }
})

export const CarouselImage = bindComponentToImageSource(UnboundCarouselImage);