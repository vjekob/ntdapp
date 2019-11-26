import { Component } from "react";
import { AsyncStorage } from "react-native";
import { bindComponentToItemState } from "../redux/itemReducer";
import { API } from "../constants/API";
import blobToBase64 from "blob-to-base64";
import { NTDAPP_SKIP } from "../constants/AsyncPaths";

class UnboundItemStateManager extends Component {
    async _start(token) {
        this._authorization = API.getAuthorization(token);

        this._loading = false;
        const skip = await AsyncStorage.getItem(NTDAPP_SKIP) || "{}";
        this._startAt = JSON.parse(skip).startAt || 0;
        this._loadNextBatchOfPictures();
    }

    async _fetchNextBatch(startAt) {
        let result = await fetch(API.getItemsUrl(5, startAt), { headers: this._authorization });
        return await result.json();
    }

    async _fetchImageBlobAsBase64(item) {
        let id = item.systemId;
        let picture = await fetch(API.getItemPictureContentUrl(id), { headers: this._authorization });
        let blob = await picture.blob();
        console.log(`Downloaded ${item.number} ${item.name}, ${blob.size} bytes`)
        return await new Promise((fulfill, reject) => {
            blobToBase64(blob, (error, base64) => {
                if (error) {
                    reject(error);
                    return;
                }
                fulfill(base64);
            });
        })
    }

    async _processBatch(items, itemState, addImage) {
        let batchIndex = 0;
        await new Promise((fulfill, reject) => {
            const promises = [];
            for (let item of items.value) {
                promises.push(this._fetchImageBlobAsBase64(item)
                    .then(base64 =>
                        addImage({ uri: base64, index: itemState.startAt + batchIndex++, item: item }))
                    .catch(error => {
                        rejected = true;
                        reject(error);
                    }));
            }
            Promise.all(promises)
                .then(fulfill)
                .catch(error => reject(error))
        });
    }

    async _loadNextBatchOfPictures() {
        const { itemState, addImage, startAt } = this.props;
        this._loading = true;
        console.log(`Loading next batch: ${itemState.images.length} total, ${itemState.currentImagesIndex} current`);

        try {
            let items = await this._fetchNextBatch(itemState.startAt + this._startAt);
            if (!items || items.value.length === 0)
            {
                setTimeout(() => this._loadNextBatchOfPictures(), 60000);
                return;
            }
            await this._processBatch(items, itemState, addImage);
            startAt(itemState.startAt + items.value.length);
            if (itemState.images.length < itemState.currentImagesIndex + 35) {
                console.log(`Reloading: ${itemState.images.length} total, ${itemState.currentImagesIndex} current`);
                this._loadNextBatchOfPictures();
            }
            else {
                console.log(`No reloading needed: ${itemState.images.length} total, ${itemState.currentImagesIndex} current`);
                this._loading = false;
            }
        }
        catch (e) {
            debugger;
            console.warn(`Error: ${e}`);
            this._loading = false;
        }
    }

    shouldComponentUpdate() {
        const { itemState } = this.props;
        if (itemState.images.length < itemState.currentImagesIndex + 42 && !this._loading)
            this._loadNextBatchOfPictures();
        return false;
    }

    render() {
        this._start(this.props.token);
        return null;
    }
}

export const ItemStateManager = bindComponentToItemState(UnboundItemStateManager);