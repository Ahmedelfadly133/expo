import { UnavailabilityError, Platform } from 'expo-modules-core';
import { ClipboardPasteButton } from './ClipboardPasteButton';
import ExpoClipboard from './ExpoClipboard';
const onClipboardEventName = 'onClipboardChanged';
/**
 * Gets the content of the user's clipboard. Calling this method on web will prompt
 * the user to grant your app permission to "see text and images copied to the clipboard."
 *
 * @param options Options for the clipboard content to be retrieved.
 * @returns A promise that resolves to the content of the clipboard.
 */
export async function getStringAsync(options = {}) {
    if (!ExpoClipboard.getStringAsync) {
        throw new UnavailabilityError('Clipboard', 'getStringAsync');
    }
    return await ExpoClipboard.getStringAsync(options);
}
/**
 * Sets the content of the user's clipboard.
 *
 * @param text The string to save to the clipboard.
 * @param options Options for the clipboard content to be set.
 * @returns On web, this returns a promise that fulfills to a boolean value indicating whether or not
 * the string was saved to the user's clipboard. On iOS and Android, the promise always resolves to `true`.
 */
export async function setStringAsync(text, options = {}) {
    if (!ExpoClipboard.setStringAsync) {
        throw new UnavailabilityError('Clipboard', 'setStringAsync');
    }
    return ExpoClipboard.setStringAsync(text, options);
}
/**
 * Sets the content of the user's clipboard.
 * @deprecated Use [`setStringAsync()`](#setstringasynctext-options) instead.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export function setString(text) {
    if (Platform.OS === 'web') {
        // on web, we need to return legacy method,
        // because of different return type
        return ExpoClipboard.setString(text);
    }
    else {
        setStringAsync(text);
    }
}
/**
 * Returns whether the clipboard has text content. Returns true for both plain text and rich text (e.g. HTML).
 *
 * On web, this requires the user to grant your app permission to _"see text and images copied to the clipboard"_.
 *
 * @returns A promise that fulfills to `true` if clipboard has text content, resolves to `false` otherwise.
 */
export function hasStringAsync() {
    if (!ExpoClipboard.hasStringAsync) {
        throw new UnavailabilityError('Clipboard', 'hasStringAsync');
    }
    return ExpoClipboard.hasStringAsync();
}
/**
 * Gets the URL from the user's clipboard.
 *
 * @returns A promise that fulfills to the URL in the clipboard.
 * @platform ios
 */
export async function getUrlAsync() {
    if (!ExpoClipboard.getUrlAsync) {
        throw new UnavailabilityError('Clipboard', 'getUrlAsync');
    }
    return await ExpoClipboard.getUrlAsync();
}
/**
 * Sets a URL in the user's clipboard.
 *
 * This function behaves the same as [`setStringAsync()`](#setstringasynctext-options), except that
 * it sets the clipboard content type to be a URL. It lets your app or other apps know that the
 * clipboard contains a URL and behave accordingly.
 *
 * @param url The URL to save to the clipboard.
 * @platform ios
 */
export async function setUrlAsync(url) {
    if (!ExpoClipboard.setUrlAsync) {
        throw new UnavailabilityError('Clipboard', 'setUrlAsync');
    }
    return ExpoClipboard.setUrlAsync(url);
}
/**
 * Returns whether the clipboard has a URL content.
 *
 * @returns A promise that fulfills to `true` if clipboard has URL content, resolves to `false` otherwise.
 * @platform ios
 */
export async function hasUrlAsync() {
    if (!ExpoClipboard.hasUrlAsync) {
        throw new UnavailabilityError('Clipboard', 'hasUrlAsync');
    }
    return await ExpoClipboard.hasUrlAsync();
}
/**
 * Gets the image from the user's clipboard and returns it in the specified
 * format. Calling this method on web will prompt the user to grant your app
 * permission to "see text and images copied to the clipboard."
 *
 * @param options A `GetImageOptions` object to specify the desired format of the image.
 * @returns If there was an image in the clipboard, the promise resolves to
 * a [`ClipboardImage`](#clipboardimage) object containing the base64 string and metadata of the image.
 * Otherwise, it resolves to `null`.
 *
 * @example
 * ```tsx
 * const img = await Clipboard.getImageAsync({ format: 'png' });
 * // ...
 * <Image source={{ uri: img?.data }} style={{ width: 200, height: 200 }} />
 * ```
 */
export async function getImageAsync(options) {
    if (!ExpoClipboard.getImageAsync) {
        throw new UnavailabilityError('Clipboard', 'getImageAsync');
    }
    return await ExpoClipboard.getImageAsync(options);
}
/**
 * Sets an image in the user's clipboard.
 *
 * @param base64Image Image encoded as a base64 string, without MIME type.
 *
 * @example
 * ```tsx
 * const result = await ImagePicker.launchImageLibraryAsync({
 *   mediaTypes: ImagePicker.MediaTypeOptions.Images,
 *   base64: true,
 * });
 * await Clipboard.setImageAsync(result.base64);
 * ```
 */
export async function setImageAsync(base64Image) {
    if (!ExpoClipboard.setImageAsync) {
        throw new UnavailabilityError('Clipboard', 'setImageAsync');
    }
    return ExpoClipboard.setImageAsync(base64Image);
}
/**
 * Returns whether the clipboard has an image content.
 *
 * On web, this requires the user to grant your app permission to _"see text and images copied to the clipboard"_.
 *
 * @returns A promise that fulfills to `true` if clipboard has image content, resolves to `false` otherwise.
 */
export async function hasImageAsync() {
    if (!ExpoClipboard.hasImageAsync) {
        throw new UnavailabilityError('Clipboard', 'hasImageAsync');
    }
    return ExpoClipboard.hasImageAsync();
}
/**
 * Adds a listener that will fire whenever the content of the user's clipboard changes. This method
 * is a no-op on Web.
 *
 * @param listener Callback to execute when listener is triggered. The callback is provided a
 * single argument that is an object containing information about clipboard contents.
 *
 * @example
 * ```typescript
 * Clipboard.addClipboardListener(({ contentTypes }: ClipboardEvent) => {
 *   if (contentTypes.includes(Clipboard.ContentType.PLAIN_TEXT)) {
 *     Clipboard.getStringAsync().then(content => {
 *       alert('Copy pasta! Here\'s the string that was copied: ' + content)
 *     });
 *   } else if (contentTypes.includes(Clipboard.ContentType.IMAGE)) {
 *     alert('Yay! Clipboard contains an image');
 *   }
 * });
 * ```
 */
export function addClipboardListener(listener) {
    // TODO: Get rid of this wrapper once we remove deprecated `content` property (not before SDK47)
    const listenerWrapper = (event) => {
        const wrappedEvent = {
            ...event,
            get content() {
                console.warn("The 'content' property of the clipboard event is deprecated. Use 'getStringAsync()' instead to get clipboard content");
                return '';
            },
        };
        listener(wrappedEvent);
    };
    return ExpoClipboard.addListener(onClipboardEventName, listenerWrapper);
}
/**
 * Removes the listener added by addClipboardListener. This method is a no-op on Web.
 *
 * @param subscription The subscription to remove (created by addClipboardListener).
 *
 * @example
 * ```typescript
 * const subscription = addClipboardListener(() => {
 *   alert('Copy pasta!');
 * });
 * removeClipboardListener(subscription);
 * ```
 */
export function removeClipboardListener(subscription) {
    subscription.remove();
}
/**
 * Property that determines if the `ClipboardPasteButton` is available.
 *
 * This requires the users device to be using at least iOS 16.
 *
 * `true` if the component is available, and `false` otherwise.
 */
export const isPasteButtonAvailable = Platform.OS === 'ios' ? ExpoClipboard.isPasteButtonAvailable : false;
export * from './Clipboard.types';
export { ClipboardPasteButton };
//# sourceMappingURL=Clipboard.js.map